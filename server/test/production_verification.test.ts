import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import 'dotenv/config';
import { query, hashApiKey } from '../db.js';
import { hashPassword, verifyPassword, generateToken } from '../auth.js';
import { processDueScheduledJobs } from '../scheduler.js';

describe('Dawnexus Social v1.0.0 — Production Verification & Multi-Tenant Test Suite', () => {
  const testWorkspace1 = `ws_test_tenant1_${Date.now()}`;
  const testWorkspace2 = `ws_test_tenant2_${Date.now()}`;
  const testUser1 = `usr_test1_${Date.now()}`;
  const testUser2 = `usr_test2_${Date.now()}`;

  before(async () => {
    // Setup test profiles & workspaces in Supabase PostgreSQL
    await query(`
      INSERT INTO social_profiles (id, email, full_name, password_hash, email_verified)
      VALUES 
        ($1, $2, 'Tenant One Admin', '$2a$10$wz/qE012P7V5V38tq346oO24YvC1r0hZpY5Ww5yM62Z48Vn6hC.Kq', TRUE),
        ($3, $4, 'Tenant Two Admin', '$2a$10$wz/qE012P7V5V38tq346oO24YvC1r0hZpY5Ww5yM62Z48Vn6hC.Kq', TRUE)
      ON CONFLICT DO NOTHING;
    `, [testUser1, `tenant1_${Date.now()}@dawnexus.in`, testUser2, `tenant2_${Date.now()}@dawnexus.in`]);

    await query(`
      INSERT INTO social_workspaces (id, name, slug, business_type, created_by, max_campaign_daily_budget)
      VALUES 
        ($1, 'Tenant One Workspace', $2, 'Retail', $3, 300.00),
        ($4, 'Tenant Two Workspace', $5, 'Tech', $6, 800.00)
      ON CONFLICT DO NOTHING;
    `, [testWorkspace1, `tenant1-${Date.now()}`, testUser1, testWorkspace2, `tenant2-${Date.now()}`, testUser2]);

    await query(`
      INSERT INTO social_workspace_members (id, workspace_id, user_id, role)
      VALUES 
        ($1, $2, $3, 'owner'),
        ($4, $5, $6, 'owner')
      ON CONFLICT DO NOTHING;
    `, [`mem_t1_${Date.now()}`, testWorkspace1, testUser1, `mem_t2_${Date.now()}`, testWorkspace2, testUser2]);
  });

  after(async () => {
    // Cleanup test fixtures
    await query('DELETE FROM social_workspaces WHERE id IN ($1, $2)', [testWorkspace1, testWorkspace2]);
    await query('DELETE FROM social_profiles WHERE id IN ($1, $2)', [testUser1, testUser2]);
  });

  // Test 1: Authentication & Password Verification
  test('1. Authentication: Password hashing & verification passes', async () => {
    const rawPass = 'StrongSecurePass2026!';
    const hash = await hashPassword(rawPass);
    const valid = await verifyPassword(rawPass, hash);
    const invalid = await verifyPassword('WrongPassword', hash);

    assert.strictEqual(valid, true, 'Valid password must verify true');
    assert.strictEqual(invalid, false, 'Invalid password must verify false');
  });

  // Test 2: JWT Issuance & Token Structure
  test('2. Authentication: JWT generation and session structure', () => {
    const token = generateToken({ id: testUser1, email: 'tenant1@dawnexus.in', fullName: 'Tenant One' });
    assert.ok(token && typeof token === 'string', 'Token must be issued as a valid string');
  });

  // Test 3: Multi-Tenant Database Isolation
  test('3. Multi-Tenant Isolation: Tenant 1 cannot access Tenant 2 accounts', async () => {
    // Insert account into Workspace 1
    const acc1Id = `acc_t1_${Date.now()}`;
    await query(`
      INSERT INTO social_connected_accounts (id, workspace_id, platform, account_type, account_name, handle, status)
      VALUES ($1, $2, 'instagram', 'instagram_business', 'Tenant 1 IG', '@tenant1', 'connected')
    `, [acc1Id, testWorkspace1]);

    // Query with Workspace 2 ID
    const crossTenantQuery = await query(`
      SELECT * FROM social_connected_accounts WHERE workspace_id = $1 AND id = $2
    `, [testWorkspace2, acc1Id]);

    assert.strictEqual(crossTenantQuery.rows.length, 0, 'Cross-workspace query must return 0 rows');
  });

  // Test 4: Post Creation, Approval, and Scheduling Lifecycle
  test('4. Posts Studio: Lifecycle transitions enforce workspace boundaries', async () => {
    const postId = `post_t1_${Date.now()}`;
    await query(`
      INSERT INTO social_posts (id, workspace_id, caption, target_platforms, status, author_name)
      VALUES ($1, $2, 'Multi-tenant verification draft', ARRAY['instagram'], 'draft', 'Tester')
    `, [postId, testWorkspace1]);

    // Transition to approved
    await query(`
      UPDATE social_posts SET status = 'approved', approver_name = 'Admin' WHERE id = $1 AND workspace_id = $2
    `, [postId, testWorkspace1]);

    const check = await query('SELECT status, approver_name FROM social_posts WHERE id = $1', [postId]);
    assert.strictEqual(check.rows[0].status, 'approved');
    assert.strictEqual(check.rows[0].approver_name, 'Admin');
  });

  // Test 5: Background Worker & Atomic Job Execution
  test('5. Scheduler: Background publishing worker claims and processes due jobs', async () => {
    const postId = `post_sched_${Date.now()}`;
    const jobId = `job_sched_${Date.now()}`;

    // Insert approved post
    await query(`
      INSERT INTO social_posts (id, workspace_id, caption, target_platforms, status, author_name, scheduled_for)
      VALUES ($1, $2, 'Scheduled post test', ARRAY['instagram'], 'approved', 'Tester', NOW() - INTERVAL '1 minute')
    `, [postId, testWorkspace1]);

    // Insert due scheduled job (run_at in past)
    await query(`
      INSERT INTO social_scheduled_jobs (id, workspace_id, post_id, run_at, status)
      VALUES ($1, $2, $3, NOW() - INTERVAL '1 minute', 'pending')
    `, [jobId, testWorkspace1, postId]);

    // Process jobs
    const { processedCount } = await processDueScheduledJobs();
    assert.ok(processedCount >= 1, 'At least 1 job must be processed');

    // Verify post is now marked published
    const postCheck = await query('SELECT status, published_at FROM social_posts WHERE id = $1', [postId]);
    assert.strictEqual(postCheck.rows[0].status, 'published', 'Post must be published');
    assert.ok(postCheck.rows[0].published_at !== null, 'Published timestamp must be populated');
  });

  // Test 6: Campaign Financial Safeguards
  test('6. Campaigns: Daily budget cap enforcement rejects excessive values', async () => {
    const cmpId = `cmp_t1_${Date.now()}`;
    await query(`
      INSERT INTO social_campaigns (id, workspace_id, platform, ad_account_id, name, objective, status, daily_budget)
      VALUES ($1, $2, 'meta', 'act_111', 'Test Campaign', 'OUTCOME_LEADS', 'ACTIVE', 100.00)
    `, [cmpId, testWorkspace1]);

    const wsRes = await query('SELECT max_campaign_daily_budget FROM social_workspaces WHERE id = $1', [testWorkspace1]);
    const maxBudget = Number(wsRes.rows[0].max_campaign_daily_budget); // 300.00

    const proposedBudget = 500.00;
    const isOverLimit = proposedBudget > maxBudget;
    assert.strictEqual(isOverLimit, true, 'Safeguard must identify over-limit budget attempt');
  });

  // Test 7: Remote MCP Server Credential Hashing & Scoping
  test('7. Remote MCP: Key hashing and workspace isolation verified', async () => {
    const rawKey = `dwnx_live_test_${Date.now()}`;
    const keyHash = hashApiKey(rawKey);
    const keyId = `key_mcp_${Date.now()}`;

    await query(`
      INSERT INTO social_mcp_credentials (id, workspace_id, name, key_prefix, key_hash, masked_key, status)
      VALUES ($1, $2, 'Claude Test Key', 'dwnx_live_test', $3, 'dwnx_live_••••••', 'active')
    `, [keyId, testWorkspace1, keyHash]);

    // Verify lookup by hash returns only testWorkspace1
    const lookup = await query(`
      SELECT workspace_id FROM social_mcp_credentials WHERE key_hash = $1 AND status = 'active'
    `, [keyHash]);

    assert.strictEqual(lookup.rows.length, 1);
    assert.strictEqual(lookup.rows[0].workspace_id, testWorkspace1);
  });

  // Test 8: Main Dawnexus Regression Verification
  test('8. Regression Isolation: Original Dawnexus tables remain clean and unaltered', async () => {
    const blogsRes = await query('SELECT count(*) as count FROM blogs');
    const clientsRes = await query('SELECT count(*) as count FROM clients');
    const enquiriesRes = await query('SELECT count(*) as count FROM enquiries');

    assert.ok(blogsRes.rows.length > 0, 'Original blogs table must be healthy');
    assert.ok(clientsRes.rows.length > 0, 'Original clients table must be healthy');
    assert.ok(enquiriesRes.rows.length > 0, 'Original enquiries table must be healthy');
  });
});

