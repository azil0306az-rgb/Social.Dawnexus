import { Router, Response } from 'express';
import { query, hashApiKey } from '../db.js';
import { 
  requireAuth, 
  requireWorkspaceAccess, 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  AuthenticatedRequest 
} from '../auth.js';
import { processDueScheduledJobs } from '../scheduler.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

// Register
apiRouter.post('/auth/register', async (req, res) => {
  const { email, password, fullName, workspaceName } = req.body;

  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Email, password, and full name are required.' });
    return;
  }

  try {
    const existing = await query('SELECT id FROM social_profiles WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await hashPassword(password);
    const wsSlug = (workspaceName || 'My Workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await query('BEGIN');

    // 1. Create Profile
    await query(`
      INSERT INTO social_profiles (id, email, full_name, password_hash, email_verified)
      VALUES ($1, $2, $3, $4, TRUE)
    `, [userId, email.toLowerCase().trim(), fullName, passwordHash]);

    // 2. Create Workspace
    await query(`
      INSERT INTO social_workspaces (id, name, slug, business_type, created_by)
      VALUES ($1, $2, $3, 'General Business', $4)
    `, [wsId, workspaceName || `${fullName}'s Workspace`, wsSlug, userId]);

    // 3. Add as Owner
    await query(`
      INSERT INTO social_workspace_members (id, workspace_id, user_id, role)
      VALUES ($1, $2, $3, 'owner')
    `, [`mem_${Date.now()}`, wsId, userId]);

    // 4. Initial Audit Log
    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, 'Account Registration', 'security', 'Created new workspace profile', 'info')
    `, [`aud_${Date.now()}`, wsId, fullName]);

    await query('COMMIT');

    const userObj = { id: userId, email, fullName };
    const token = generateToken(userObj);

    res.cookie('dawnexus_social_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      token,
      user: {
        ...userObj,
        currentWorkspaceId: wsId,
        workspaces: [
          {
            id: wsId,
            name: workspaceName || `${fullName}'s Workspace`,
            slug: wsSlug,
            role: 'owner',
            businessType: 'General Business',
            requireApprovalForPublishing: true,
            maxCampaignDailySpendLimit: 500,
          }
        ]
      }
    });
  } catch (err: any) {
    await query('ROLLBACK');
    console.error('[Register Error]', err);
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
});

// Login
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const userRes = await query(`
      SELECT id, email, full_name, avatar_url, password_hash
      FROM social_profiles
      WHERE email = $1
    `, [email.toLowerCase().trim()]);

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRes.rows[0];
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Retrieve user's workspaces
    const wsRes = await query(`
      SELECT w.id, w.name, w.slug, w.business_type, w.require_approval, w.max_campaign_daily_budget, m.role
      FROM social_workspaces w
      JOIN social_workspace_members m ON m.workspace_id = w.id
      WHERE m.user_id = $1
      ORDER BY w.created_at ASC
    `, [user.id]);

    const workspaces = wsRes.rows.map(w => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      role: w.role,
      businessType: w.business_type,
      requireApprovalForPublishing: w.require_approval,
      maxCampaignDailySpendLimit: Number(w.max_campaign_daily_budget),
    }));

    const userObj = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
    };

    const token = generateToken(userObj);

    res.cookie('dawnexus_social_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        ...userObj,
        currentWorkspaceId: workspaces[0]?.id || null,
        workspaces,
      }
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// Me (Session Check)
apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wsRes = await query(`
      SELECT w.id, w.name, w.slug, w.business_type, w.require_approval, w.max_campaign_daily_budget, m.role
      FROM social_workspaces w
      JOIN social_workspace_members m ON m.workspace_id = w.id
      WHERE m.user_id = $1
      ORDER BY w.created_at ASC
    `, [req.user!.id]);

    const workspaces = wsRes.rows.map(w => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      role: w.role,
      businessType: w.business_type,
      requireApprovalForPublishing: w.require_approval,
      maxCampaignDailySpendLimit: Number(w.max_campaign_daily_budget),
    }));

    res.json({
      user: {
        ...req.user,
        currentWorkspaceId: workspaces[0]?.id || null,
        workspaces,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve session.' });
  }
});

// Logout
apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('dawnexus_social_token');
  res.json({ message: 'Signed out successfully.' });
});

// ==========================================
// 2. SOCIAL ACCOUNTS (MULTI-TENANT)
// ==========================================

apiRouter.get('/workspaces/:workspaceId/accounts', requireAuth, requireWorkspaceAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT id, workspace_id, platform, account_type, account_name, handle, avatar_url, 
             status, permissions, followers_count, last_sync_at, token_expires_at, error_message
      FROM social_connected_accounts
      WHERE workspace_id = $1
      ORDER BY created_at ASC
    `, [req.workspaceId]);

    const accounts = result.rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      platform: r.platform,
      accountType: r.account_type,
      accountName: r.account_name,
      handle: r.handle,
      avatarUrl: r.avatar_url,
      status: r.status,
      permissions: r.permissions || [],
      followersCount: r.followers_count || 0,
      lastSyncAt: r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : 'Just now',
      tokenExpiresAt: r.token_expires_at,
      errorMessage: r.error_message,
    }));

    res.json({ accounts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query workspace accounts.' });
  }
});

apiRouter.post('/workspaces/:workspaceId/accounts', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { platform, accountType, accountName, handle, permissions, followersCount, avatarUrl } = req.body;

  if (!platform || !accountName || !handle) {
    res.status(400).json({ error: 'Platform, accountName, and handle are required.' });
    return;
  }

  const accountId = `acc_${platform}_${Date.now()}`;

  try {
    await query(`
      INSERT INTO social_connected_accounts (id, workspace_id, platform, account_type, account_name, handle, avatar_url, status, permissions, followers_count, last_sync_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'connected', $8, $9, NOW())
    `, [
      accountId,
      req.workspaceId,
      platform,
      accountType || `${platform}_page`,
      accountName,
      handle,
      avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      permissions || ['basic_read', 'content_publish'],
      followersCount || 1000
    ]);

    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'security', $5, 'info')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Connected ${platform} Account (${handle})`,
      `Authorized ${platform} integration with token credentials.`,
    ]);

    res.status(201).json({ message: 'Account connected successfully.', accountId });
  } catch (err: any) {
    console.error('[Connect Account Error]', err);
    res.status(500).json({ error: 'Failed to connect account.' });
  }
});

apiRouter.delete('/workspaces/:workspaceId/accounts/:accountId', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { accountId } = req.params;

  try {
    const accRes = await query('SELECT handle, platform FROM social_connected_accounts WHERE id = $1 AND workspace_id = $2', [accountId, req.workspaceId]);
    if (accRes.rows.length === 0) {
      res.status(404).json({ error: 'Account not found in workspace.' });
      return;
    }

    const { handle, platform } = accRes.rows[0];

    await query('DELETE FROM social_connected_accounts WHERE id = $1 AND workspace_id = $2', [accountId, req.workspaceId]);

    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'security', $5, 'warning')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Disconnected ${platform} Account (${handle})`,
      'Revoked publishing tokens and paused associated platform jobs.',
    ]);

    res.json({ message: 'Account disconnected successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to disconnect account.' });
  }
});

// ==========================================
// 3. POSTS & CONTENT WORKFLOW (MULTI-TENANT)
// ==========================================

apiRouter.get('/workspaces/:workspaceId/posts', requireAuth, requireWorkspaceAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT id, workspace_id, caption, target_platforms, status, scheduled_for, 
             published_at, author_name, approver_name, approved_at, rejection_reason,
             media_assets, publish_errors, created_at, updated_at
      FROM social_posts
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `, [req.workspaceId]);

    const posts = result.rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      caption: r.caption,
      targetPlatforms: r.target_platforms || [],
      status: r.status,
      scheduledFor: r.scheduled_for,
      publishedAt: r.published_at,
      authorName: r.author_name,
      approverName: r.approver_name,
      approvedAt: r.approved_at,
      rejectionReason: r.rejection_reason,
      media: r.media_assets || [],
      publishErrors: r.publish_errors,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ posts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

apiRouter.post('/workspaces/:workspaceId/posts', requireAuth, requireWorkspaceAccess(['owner', 'admin', 'editor']), async (req: AuthenticatedRequest, res: Response) => {
  const { caption, targetPlatforms, status, scheduledFor, media } = req.body;

  if (!caption || !caption.trim()) {
    res.status(400).json({ error: 'Post caption cannot be empty.' });
    return;
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;

  try {
    // Check if workspace requires approval
    const wsRes = await query('SELECT require_approval FROM social_workspaces WHERE id = $1', [req.workspaceId]);
    const requireApproval = wsRes.rows[0]?.require_approval ?? true;

    let targetStatus = status || 'draft';
    if (requireApproval && (targetStatus === 'scheduled' || targetStatus === 'published')) {
      targetStatus = 'pending_approval';
    }

    await query('BEGIN');

    await query(`
      INSERT INTO social_posts (id, workspace_id, caption, target_platforms, status, scheduled_for, author_id, author_name, media_assets, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `, [
      postId,
      req.workspaceId,
      caption,
      targetPlatforms || ['instagram', 'linkedin'],
      targetStatus,
      scheduledFor || null,
      req.user!.id,
      req.user!.fullName,
      JSON.stringify(media || [])
    ]);

    // If scheduled directly, create scheduled job record
    if (targetStatus === 'scheduled' && scheduledFor) {
      const jobId = `job_${Date.now()}`;
      await query(`
        INSERT INTO social_scheduled_jobs (id, workspace_id, post_id, run_at, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [jobId, req.workspaceId, postId, scheduledFor]);
    }

    // Audit log
    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'social_publish', $5, 'info')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Created post #${postId.slice(-4)} (${targetStatus})`,
      `Targeted channels: [${(targetPlatforms || []).join(', ')}]`,
    ]);

    await query('COMMIT');

    res.status(201).json({ message: 'Post created successfully.', postId, status: targetStatus });
  } catch (err: any) {
    await query('ROLLBACK');
    console.error('[Create Post Error]', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

apiRouter.patch('/workspaces/:workspaceId/posts/:postId/status', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { status, scheduledFor } = req.body;

  try {
    const postRes = await query('SELECT id, target_platforms, caption FROM social_posts WHERE id = $1 AND workspace_id = $2', [postId, req.workspaceId]);
    if (postRes.rows.length === 0) {
      res.status(404).json({ error: 'Post not found in workspace.' });
      return;
    }

    await query('BEGIN');

    await query(`
      UPDATE social_posts
      SET status = $1,
          approver_name = $2,
          approved_at = CASE WHEN $1 = 'approved' OR $1 = 'scheduled' THEN NOW() ELSE approved_at END,
          scheduled_for = COALESCE($3, scheduled_for),
          updated_at = NOW()
      WHERE id = $4 AND workspace_id = $5
    `, [status, req.user!.fullName, scheduledFor || null, postId, req.workspaceId]);

    if (status === 'scheduled' && scheduledFor) {
      await query(`
        INSERT INTO social_scheduled_jobs (id, workspace_id, post_id, run_at, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [`job_${Date.now()}`, req.workspaceId, postId, scheduledFor]);
    }

    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'approval', $5, 'info')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Approved post #${postId.slice(-4)} for publishing`,
      `Status updated to '${status}'.`,
    ]);

    await query('COMMIT');

    res.json({ message: 'Post status updated successfully.' });
  } catch (err: any) {
    await query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update post status.' });
  }
});

apiRouter.delete('/workspaces/:workspaceId/posts/:postId', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;

  try {
    await query('DELETE FROM social_posts WHERE id = $1 AND workspace_id = $2', [postId, req.workspaceId]);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// ==========================================
// 4. CAMPAIGNS & GUARANTEES (MULTI-TENANT)
// ==========================================

apiRouter.get('/workspaces/:workspaceId/campaigns', requireAuth, requireWorkspaceAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT c.id, c.workspace_id, c.platform, c.ad_account_id, c.name, c.objective, c.status,
             c.daily_budget, c.currency, c.start_date, c.ai_recommendations,
             COALESCE(m.impressions, 0) as impressions,
             COALESCE(m.reach, 0) as reach,
             COALESCE(m.clicks, 0) as clicks,
             COALESCE(m.spend, 0) as spend,
             COALESCE(m.cpc, 0) as cpc,
             COALESCE(m.ctr, 0) as ctr,
             COALESCE(m.conversions, 0) as conversions,
             COALESCE(m.cpl, 0) as cpl,
             COALESCE(m.roas, 0) as roas
      FROM social_campaigns c
      LEFT JOIN social_campaign_metrics m ON m.campaign_id = c.id
      WHERE c.workspace_id = $1
      ORDER BY c.created_at DESC
    `, [req.workspaceId]);

    const campaigns = result.rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      platform: r.platform,
      adAccountId: r.ad_account_id,
      adAccountName: 'Dawnexus Agency Ads',
      name: r.name,
      objective: r.objective,
      status: r.status,
      dailyBudget: Number(r.daily_budget),
      currency: r.currency,
      startDate: r.start_date ? new Date(r.start_date).toISOString().substring(0, 10) : '2026-10-01',
      lastUpdated: 'Live API Sync',
      metrics: {
        impressions: Number(r.impressions),
        reach: Number(r.reach),
        clicks: Number(r.clicks),
        spend: Number(r.spend),
        cpc: Number(r.cpc),
        ctr: Number(r.ctr),
        conversions: Number(r.conversions),
        cpl: Number(r.cpl),
        roas: Number(r.roas),
      },
      aiRecommendations: r.ai_recommendations || [],
    }));

    res.json({ campaigns });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve campaigns.' });
  }
});

apiRouter.patch('/workspaces/:workspaceId/campaigns/:campaignId', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { campaignId } = req.params;
  const { status, dailyBudget } = req.body;

  try {
    // 1. Fetch current campaign & workspace limits
    const cmpRes = await query(`
      SELECT c.name, c.daily_budget, c.status, w.max_campaign_daily_budget
      FROM social_campaigns c
      JOIN social_workspaces w ON w.id = c.workspace_id
      WHERE c.id = $1 AND c.workspace_id = $2
    `, [campaignId, req.workspaceId]);

    if (cmpRes.rows.length === 0) {
      res.status(404).json({ error: 'Campaign not found in workspace.' });
      return;
    }

    const cmp = cmpRes.rows[0];
    const maxBudget = Number(cmp.max_campaign_daily_budget);

    // Safeguard check
    if (dailyBudget !== undefined && dailyBudget > maxBudget) {
      res.status(400).json({ 
        error: `Daily budget $${dailyBudget} exceeds workspace limit of $${maxBudget}/day. Request rejected by server safeguard.` 
      });
      return;
    }

    await query(`
      UPDATE social_campaigns
      SET status = COALESCE($1, status),
          daily_budget = COALESCE($2, daily_budget),
          updated_at = NOW()
      WHERE id = $3 AND workspace_id = $4
    `, [status || null, dailyBudget || null, campaignId, req.workspaceId]);

    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'campaign_change', $5, 'warning')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Modified Meta Campaign "${cmp.name}"`,
      dailyBudget ? `Budget adjusted to $${dailyBudget}/day.` : `Status toggled to ${status}.`,
    ]);

    res.json({ message: 'Campaign modified successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update campaign.' });
  }
});

// ==========================================
// 5. WORKSPACE MCP API KEYS
// ==========================================

apiRouter.get('/workspaces/:workspaceId/mcp-keys', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT id, workspace_id, name, key_prefix, masked_key, status, last_used_at, revoked_at, created_at
      FROM social_mcp_credentials
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `, [req.workspaceId]);

    res.json({ keys: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query MCP credentials.' });
  }
});

apiRouter.post('/workspaces/:workspaceId/mcp-keys', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Key name is required.' });
    return;
  }

  const rawSecret = `dwnx_live_${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
  const keyHash = hashApiKey(rawSecret);
  const keyPrefix = rawSecret.substring(0, 14);
  const maskedKey = `${keyPrefix}••••••••••••••••••••${rawSecret.slice(-4)}`;
  const keyId = `key_${Date.now()}`;

  try {
    await query(`
      INSERT INTO social_mcp_credentials (id, workspace_id, name, key_prefix, key_hash, masked_key, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
    `, [keyId, req.workspaceId, name.trim(), keyPrefix, keyHash, maskedKey]);

    await query(`
      INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
      VALUES ($1, $2, 'user', $3, $4, 'mcp_access', $5, 'info')
    `, [
      `aud_${Date.now()}`,
      req.workspaceId,
      req.user!.fullName,
      `Generated MCP API Key: "${name}"`,
      `Authorized AI assistant access for workspace ${req.workspaceId}.`,
    ]);

    res.status(201).json({
      key: {
        id: keyId,
        workspaceId: req.workspaceId,
        name: name.trim(),
        keyPrefix,
        maskedKey,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      fullSecret: rawSecret
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate MCP credential.' });
  }
});

apiRouter.delete('/workspaces/:workspaceId/mcp-keys/:keyId', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { keyId } = req.params;

  try {
    await query(`
      UPDATE social_mcp_credentials
      SET status = 'revoked',
          revoked_at = NOW()
      WHERE id = $1 AND workspace_id = $2
    `, [keyId, req.workspaceId]);

    res.json({ message: 'MCP API key revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke MCP key.' });
  }
});

// ==========================================
// 6. WORKSPACE SETTINGS & AUDIT LOGS
// ==========================================

apiRouter.patch('/workspaces/:workspaceId/settings', requireAuth, requireWorkspaceAccess(['owner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { name, businessType, requireApproval, maxDailyBudget } = req.body;

  try {
    await query(`
      UPDATE social_workspaces
      SET name = COALESCE($1, name),
          business_type = COALESCE($2, business_type),
          require_approval = COALESCE($3, require_approval),
          max_campaign_daily_budget = COALESCE($4, max_campaign_daily_budget),
          updated_at = NOW()
      WHERE id = $5
    `, [name || null, businessType || null, requireApproval, maxDailyBudget || null, req.workspaceId]);

    res.json({ message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update workspace settings.' });
  }
});

apiRouter.get('/workspaces/:workspaceId/audit-logs', requireAuth, requireWorkspaceAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT id, workspace_id, actor_type, actor_name, action, category, details, severity, created_at
      FROM social_audit_logs
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [req.workspaceId]);

    const logs = result.rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      actorType: r.actor_type,
      actorName: r.actor_name,
      action: r.action,
      category: r.category,
      details: r.details,
      timestamp: new Date(r.created_at).toLocaleString(),
      severity: r.severity,
    }));

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query audit logs.' });
  }
});

// ==========================================
// 7. EXTERNAL CRON TRIGGER
// ==========================================

apiRouter.post('/cron/process-jobs', async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized cron trigger.' });
    return;
  }

  const result = await processDueScheduledJobs();
  res.json({
    status: 'ok',
    processedJobs: result.processedCount,
    errors: result.errors,
    timestamp: new Date().toISOString()
  });
});

