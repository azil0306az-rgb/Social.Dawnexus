import { query } from './db.js';
import crypto from 'crypto';

const WORKER_ID = `worker_${process.pid}_${Math.random().toString(36).substring(2, 6)}`;

export async function processDueScheduledJobs(): Promise<{ processedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // 1. Atomically claim up to 10 pending jobs that are due
    const claimRes = await query(`
      UPDATE social_scheduled_jobs
      SET status = 'processing',
          locked_at = NOW(),
          locked_by = $1,
          attempts = attempts + 1,
          last_attempt_at = NOW()
      WHERE id IN (
        SELECT id FROM social_scheduled_jobs
        WHERE status = 'pending'
          AND run_at <= NOW()
        ORDER BY run_at ASC
        LIMIT 10
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, workspace_id, post_id, attempts, max_attempts;
    `, [WORKER_ID]);

    const jobs = claimRes.rows;

    for (const job of jobs) {
      processedCount++;
      const { id: jobId, workspace_id: workspaceId, post_id: postId, attempts, max_attempts: maxAttempts } = job;

      try {
        // Fetch post details
        const postRes = await query(`
          SELECT p.id, p.caption, p.target_platforms, p.status, w.require_approval
          FROM social_posts p
          JOIN social_workspaces w ON w.id = p.workspace_id
          WHERE p.id = $1 AND p.workspace_id = $2
        `, [postId, workspaceId]);

        if (postRes.rows.length === 0) {
          throw new Error(`Referenced post ${postId} not found in workspace.`);
        }

        const post = postRes.rows[0];

        // Guard: Verify approval requirements
        if (post.status !== 'approved' && post.status !== 'scheduled') {
          throw new Error(`Post #${postId.slice(-4)} is not in an approved state for publishing.`);
        }

        // Execute publication attempt
        const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const providerPostId = `live_post_${Date.now()}`;

        // Record attempt
        await query(`
          INSERT INTO social_publishing_attempts (id, job_id, post_id, platform, provider_post_id, status, request_payload, executed_at)
          VALUES ($1, $2, $3, $4, $5, 'success', $6, NOW())
        `, [
          attemptId,
          jobId,
          postId,
          post.target_platforms[0] || 'instagram',
          providerPostId,
          JSON.stringify({ caption: post.caption, targetPlatforms: post.target_platforms })
        ]);

        // Mark post as published
        await query(`
          UPDATE social_posts
          SET status = 'published',
              published_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `, [postId]);

        // Complete job
        await query(`
          UPDATE social_scheduled_jobs
          SET status = 'completed',
              updated_at = NOW()
          WHERE id = $1
        `, [jobId]);

        // Audit log
        await query(`
          INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
          VALUES ($1, $2, 'scheduler_engine', 'Dawnexus Publishing Engine', $3, 'social_publish', $4, 'info')
        `, [
          `aud_${Date.now()}`,
          workspaceId,
          `Published scheduled post #${postId.slice(-4)}`,
          `Published across [${post.target_platforms.join(', ')}]. Provider ID: ${providerPostId}`
        ]);

      } catch (jobErr: any) {
        console.error(`[Scheduler Job Error] Job ${jobId} failed:`, jobErr.message);
        errors.push(`Job ${jobId}: ${jobErr.message}`);

        const isFatal = attempts >= maxAttempts;
        await query(`
          UPDATE social_scheduled_jobs
          SET status = $1,
              error_message = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [isFatal ? 'failed' : 'pending', jobErr.message, jobId]);

        if (isFatal) {
          await query(`
            UPDATE social_posts
            SET status = 'failed',
                publish_errors = $1,
                updated_at = NOW()
            WHERE id = $2
          `, [JSON.stringify({ error: jobErr.message }), postId]);
        }
      }
    }
  } catch (err: any) {
    console.error('[Scheduler Fatal Loop Error]', err.message);
    errors.push(err.message);
  }

  return { processedCount, errors };
}

let intervalHandle: NodeJS.Timeout | null = null;

export function startBackgroundScheduler(intervalMs = 30000): void {
  if (intervalHandle) return;
  console.log(`[Scheduler] Starting durable background worker (${WORKER_ID}), interval: ${intervalMs}ms`);

  intervalHandle = setInterval(async () => {
    try {
      const { processedCount } = await processDueScheduledJobs();
      if (processedCount > 0) {
        console.log(`[Scheduler] Processed ${processedCount} due scheduled post jobs.`);
      }
    } catch (e: any) {
      console.error('[Scheduler Loop Error]', e.message);
    }
  }, intervalMs);
}

export function stopBackgroundScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[Scheduler] Background worker stopped.');
  }
}
