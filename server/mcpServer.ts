import { Router, Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { query, hashApiKey } from './db.js';

export const mcpRouter = Router();

// Track active SSE transports by session ID
const activeTransports = new Map<string, SSEServerTransport>();

export const MCP_TOOLS: Tool[] = [
  {
    name: 'get_connected_accounts',
    description: 'Retrieve all connected social media accounts (Instagram, Facebook, LinkedIn) for the authorized workspace.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_draft_post',
    description: 'Create a draft post with captions, platform tags, and target channels in the workspace content studio.',
    inputSchema: {
      type: 'object',
      properties: {
        caption: {
          type: 'string',
          description: 'The body text and copy for the post.'
        },
        target_platforms: {
          type: 'array',
          items: { type: 'string', enum: ['instagram', 'facebook', 'linkedin'] },
          description: 'Target publishing channels.'
        }
      },
      required: ['caption', 'target_platforms']
    }
  },
  {
    name: 'generate_post_captions',
    description: 'Generate platform-tailored captions and relevant hashtags following the Dawnexus brand identity.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The core subject, project milestone, or promotional theme.'
        },
        platform: {
          type: 'string',
          enum: ['instagram', 'facebook', 'linkedin'],
          description: 'The target channel format.'
        }
      },
      required: ['topic', 'platform']
    }
  },
  {
    name: 'get_content_calendar',
    description: 'Retrieve scheduled and published posts within an upcoming date window.',
    inputSchema: {
      type: 'object',
      properties: {
        days_ahead: {
          type: 'number',
          description: 'Number of days to inspect ahead (default: 30).'
        }
      }
    }
  },
  {
    name: 'get_advertising_metrics',
    description: 'Retrieve real-time Meta advertising campaign metrics including impressions, clicks, spend, conversions, and ROAS.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_campaign_recommendations',
    description: 'Retrieve AI optimization insights and audience suggestions for active advertising funnels.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'schedule_approved_post',
    description: 'Schedule a pre-approved post draft for publishing to official social APIs.',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'string',
          description: 'The ID of the pre-approved post draft.'
        },
        publish_time: {
          type: 'string',
          description: 'ISO 8601 datetime string for scheduled execution.'
        }
      },
      required: ['post_id', 'publish_time']
    }
  }
];

// Helper to authenticate Bearer key against Supabase PostgreSQL
async function authenticateMcpRequest(req: Request): Promise<{ workspaceId: string; credentialId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const keyHash = hashApiKey(token);
    const result = await query(
      `SELECT id, workspace_id, status FROM social_mcp_credentials WHERE key_hash = $1 AND status = 'active'`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { id, workspace_id: workspaceId } = result.rows[0];

    // Update last_used_at timestamp
    await query(`UPDATE social_mcp_credentials SET last_used_at = NOW() WHERE id = $1`, [id]);

    return { workspaceId, credentialId: id };
  } catch (err) {
    console.error('[MCP Auth Error]', err);
    return null;
  }
}

// SSE Transport Endpoint for Claude Desktop & Remote MCP Clients
mcpRouter.get('/sse', async (req: Request, res: Response) => {
  const auth = await authenticateMcpRequest(req);
  if (!auth) {
    res.status(401).json({
      error: 'Unauthorized MCP Client. Please provide a valid Bearer token generated in Dawnexus Social portal.'
    });
    return;
  }

  const { workspaceId, credentialId } = auth;

  // Instantiate isolated MCP Server instance for this session
  const server = new Server(
    {
      name: 'dawnexus-social-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Expose tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: MCP_TOOLS };
  });

  // Handle tool calls strictly scoped to the workspace in Supabase PostgreSQL
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();
    let status = 'success';

    try {
      if (name === 'get_connected_accounts') {
        const accRes = await query(`
          SELECT platform, account_type, account_name, handle, status, followers_count, last_sync_at
          FROM social_connected_accounts
          WHERE workspace_id = $1
        `, [workspaceId]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workspace_id: workspaceId,
                accounts: accRes.rows.map(r => ({
                  platform: r.platform,
                  type: r.account_type,
                  name: r.account_name,
                  handle: r.handle,
                  status: r.status,
                  followers: r.followers_count,
                  last_synced: r.last_sync_at
                }))
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'create_draft_post') {
        const { caption, target_platforms } = args as { caption: string; target_platforms: string[] };
        const postId = `post_${Date.now()}`;

        await query(`
          INSERT INTO social_posts (id, workspace_id, caption, target_platforms, status, author_name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'draft', 'Claude/ChatGPT MCP', NOW(), NOW())
        `, [postId, workspaceId, caption, target_platforms || ['instagram']]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                post_id: postId,
                status: 'draft',
                workspace_id: workspaceId,
                caption,
                target_platforms,
                message: 'Draft post stored in Dawnexus Social studio awaiting approval.'
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'generate_post_captions') {
        const { topic, platform } = args as { topic: string; platform: string };
        const caption = platform === 'linkedin' 
          ? `In today's fast-moving market, ${topic || 'accelerating growth'} requires moving beyond traditional playbooks.\n\nAt Dawnexus, we've observed that high-performing teams combine automated workflows with rigorous human oversight to drive sustainable scale.\n\nKey takeaways:\n• Streamlined multi-channel deployment\n• Unified attribution across Meta & professional networks\n• Measurable efficiency gains without losing brand integrity\n\nWhat are your priorities for this quarter? Let's discuss in the comments.`
          : `Elevate your digital footprint with ${topic || 'next-generation brand experiences'}. ✨\n\nSwipe to see our methodology in action. From automated content scheduling to precision audience segmentation, we build systems that scale effortlessly. 🚀\n\nDrop a comment or link in bio to learn more.`;

        const hashtags = ['#Dawnexus', '#B2BGrowth', '#DigitalAgency', '#Automation'];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                platform,
                suggested_caption: caption,
                hashtags
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'get_content_calendar') {
        const postRes = await query(`
          SELECT id, caption, target_platforms, status, scheduled_for, published_at
          FROM social_posts
          WHERE workspace_id = $1
          ORDER BY scheduled_for ASC NULLS LAST
          LIMIT 20
        `, [workspaceId]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workspace_id: workspaceId,
                calendar: postRes.rows
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'get_advertising_metrics') {
        const cmpRes = await query(`
          SELECT c.id, c.name, c.status, c.daily_budget,
                 COALESCE(m.impressions, 0) as impressions,
                 COALESCE(m.clicks, 0) as clicks,
                 COALESCE(m.spend, 0) as spend,
                 COALESCE(m.conversions, 0) as conversions,
                 COALESCE(m.roas, 0) as roas
          FROM social_campaigns c
          LEFT JOIN social_campaign_metrics m ON m.campaign_id = c.id
          WHERE c.workspace_id = $1
        `, [workspaceId]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workspace_id: workspaceId,
                campaigns: cmpRes.rows
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'get_campaign_recommendations') {
        const cmpRes = await query(`
          SELECT name, ai_recommendations FROM social_campaigns WHERE workspace_id = $1
        `, [workspaceId]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workspace_id: workspaceId,
                insights: cmpRes.rows.flatMap(r => r.ai_recommendations || [])
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'schedule_approved_post') {
        const { post_id, publish_time } = args as { post_id: string; publish_time: string };

        // Verify post is approved
        const postRes = await query(`
          SELECT id, status FROM social_posts WHERE id = $1 AND workspace_id = $2
        `, [post_id, workspaceId]);

        if (postRes.rows.length === 0) {
          throw new Error(`Post #${post_id} not found in workspace.`);
        }

        if (postRes.rows[0].status !== 'approved') {
          throw new Error(`Post #${post_id} cannot be scheduled directly via MCP because it has status '${postRes.rows[0].status}'. Administrative approval in the portal is required.`);
        }

        await query(`
          UPDATE social_posts SET status = 'scheduled', scheduled_for = $1, updated_at = NOW() WHERE id = $2
        `, [publish_time, post_id]);

        await query(`
          INSERT INTO social_scheduled_jobs (id, workspace_id, post_id, run_at, status)
          VALUES ($1, $2, $3, $4, 'pending')
        `, [`job_${Date.now()}`, workspaceId, post_id, publish_time]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                post_id,
                scheduled_for: publish_time,
                status: 'scheduled',
                message: 'Post scheduled successfully in Dawnexus publishing queue.'
              }, null, 2)
            }
          ]
        };
      }

      throw new Error(`Unknown MCP tool requested: ${name}`);
    } catch (toolErr: any) {
      status = 'failed';
      throw toolErr;
    } finally {
      // Audit log the tool execution
      const durationMs = Date.now() - startTime;
      await query(`
        INSERT INTO social_mcp_audit_logs (id, workspace_id, credential_id, tool_name, parameters, status, execution_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        `mcp_log_${Date.now()}`,
        workspaceId,
        credentialId,
        name,
        JSON.stringify(args || {}),
        status,
        durationMs
      ]);
    }
  });

  const transport = new SSEServerTransport('/mcp/messages', res);
  const sessionId = Math.random().toString(36).substring(2);
  activeTransports.set(sessionId, transport);

  req.on('close', () => {
    activeTransports.delete(sessionId);
  });

  await server.connect(transport);
});

// Message endpoint for SSE communication
mcpRouter.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = activeTransports.get(sessionId) || Array.from(activeTransports.values())[0];
  if (!transport) {
    res.status(404).json({ error: 'SSE session not found or expired.' });
    return;
  }
  await transport.handlePostMessage(req, res);
});

// OpenAPI Spec for ChatGPT Custom GPT Actions
mcpRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'Dawnexus Social MCP API',
      description: 'Model Context Protocol OpenAPI bridge for Dawnexus Social multi-tenant workspace.',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'https://social.dawnexus.in'
      }
    ],
    paths: {
      '/api/workspaces/{workspaceId}/accounts': {
        get: {
          summary: 'Get connected social accounts',
          operationId: 'getConnectedAccounts',
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Successful response' }
          }
        }
      },
      '/api/workspaces/{workspaceId}/posts': {
        get: {
          summary: 'Get scheduled content calendar',
          operationId: 'getContentCalendar',
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Successful response' }
          }
        }
      },
      '/api/workspaces/{workspaceId}/campaigns': {
        get: {
          summary: 'Get Meta advertising metrics',
          operationId: 'getAdvertisingMetrics',
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Successful response' }
          }
        }
      }
    }
  });
});
