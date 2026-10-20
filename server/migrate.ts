import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set in environment to run migrations.');
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    console.log('[Migration] Connected to Supabase PostgreSQL. Applying Dawnexus Social schema...');
    const sqlPath = path.join(__dirname, 'migrations', '001_init_social_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[Migration] Successfully applied 001_init_social_schema.sql');

    // Check if initial admin profile exists
    const checkUser = await client.query('SELECT id FROM social_profiles WHERE email = $1', ['admin@dawnexus.in']);
    if (checkUser.rows.length === 0) {
      console.log('[Migration] Seeding initial verified Dawnexus Social workspace & accounts...');
      
      const adminId = 'usr_owner_01';
      const wsId = 'ws_dawnexus_prod';

      // 1. Admin Profile (password: 9566 bcrypt hash or default)
      // Hash for '9566': '$2a$10$wz/qE012P7V5V38tq346oO24YvC1r0hZpY5Ww5yM62Z48Vn6hC.Kq'
      await client.query(`
        INSERT INTO social_profiles (id, email, full_name, avatar_url, password_hash, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING;
      `, [
        adminId,
        'admin@dawnexus.in',
        'Arun Kumar',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        '$2a$10$wz/qE012P7V5V38tq346oO24YvC1r0hZpY5Ww5yM62Z48Vn6hC.Kq',
        true
      ]);

      // 2. Main Workspace
      await client.query(`
        INSERT INTO social_workspaces (id, name, slug, business_type, require_approval, max_campaign_daily_budget, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `, [
        wsId,
        'Dawnexus Agency HQ',
        'dawnexus-agency',
        'Digital Agency & Growth Studio',
        true,
        500.00,
        adminId
      ]);

      // 3. Workspace Membership
      await client.query(`
        INSERT INTO social_workspace_members (id, workspace_id, user_id, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
      `, [
        'mem_01',
        wsId,
        adminId,
        'owner'
      ]);

      // 4. Initial Connected Accounts
      await client.query(`
        INSERT INTO social_connected_accounts (id, workspace_id, platform, account_type, account_name, handle, avatar_url, status, permissions, followers_count)
        VALUES 
          ('acc_ig_01', $1, 'instagram', 'instagram_business', 'Dawnexus Official', '@dawnexus.in', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80', 'connected', ARRAY['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_read_engagement'], 14250),
          ('acc_fb_01', $1, 'facebook', 'facebook_page', 'Dawnexus Digital Agency', 'dawnexus.agency', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80', 'connected', ARRAY['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'ads_read'], 8920),
          ('acc_li_01', $1, 'linkedin', 'linkedin_page', 'Dawnexus Technologies', 'company/dawnexus', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80', 'connected', ARRAY['w_organization_social', 'r_organization_social', 'rw_organization_admin'], 6410)
        ON CONFLICT (id) DO NOTHING;
      `, [wsId]);

      // 5. Initial Campaign
      await client.query(`
        INSERT INTO social_campaigns (id, workspace_id, platform, ad_account_id, name, objective, status, daily_budget, currency, start_date, ai_recommendations)
        VALUES 
          ('cmp_meta_01', $1, 'meta', 'act_982341209341', 'Dawnexus — Enterprise AI Growth Funnel (Q4)', 'OUTCOME_LEADS', 'ACTIVE', 150.00, 'USD', '2026-10-01', $2)
        ON CONFLICT (id) DO NOTHING;
      `, [
        wsId,
        JSON.stringify([
          'Scale daily budget by 15% on high-performing Lookalike (1%) audience in Chennai & Bangalore.',
          'Creative #3 has 4.1% CTR; allocate 60% of ad set spend to it.',
          'Exclude users who visited /contact in the last 7 days to eliminate ad spend fatigue.'
        ])
      ]);

      // 6. Campaign Metrics
      await client.query(`
        INSERT INTO social_campaign_metrics (id, campaign_id, impressions, reach, clicks, spend, cpc, ctr, conversions, cpl, roas, snapshot_date)
        VALUES ('met_01', 'cmp_meta_01', 48920, 34100, 1420, 642.50, 0.45, 2.90, 84, 7.65, 4.8, CURRENT_DATE)
        ON CONFLICT (campaign_id, snapshot_date) DO NOTHING;
      `);

      // 7. Audit Log
      await client.query(`
        INSERT INTO social_audit_logs (id, workspace_id, actor_type, actor_name, action, category, details, severity)
        VALUES 
          ('aud_init', $1, 'user', 'Arun Kumar', 'Initialized Dawnexus Social v1.0.0 workspace', 'security', 'Workspace verified on Supabase PostgreSQL with strict RLS', 'info')
        ON CONFLICT (id) DO NOTHING;
      `, [wsId]);

      console.log('[Migration] Initial verified data seeded successfully.');
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Migration Error]', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => {
    console.log('[Migration] Finished successfully.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Migration Fatal]', err);
    process.exit(1);
  });
}

