# Dawnexus Social — Multi-Tenant Social Media Management & MCP SaaS Suite

**Live Target Domain:** [https://social.dawnexus.in](https://social.dawnexus.in)  
**Main Agency Website (Isolated):** [https://dawnexus.in](https://dawnexus.in)  

---

## 1. Brand Identity Compliance

Built following the official Dawnexus visual guidelines and brand specifications:

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Primary Background** | `#050505` | Main application background, canvas |
| **Secondary Background & Cards** | `#0B0B0B` | Navigation sidebar, cards, modals |
| **Tertiary Elevated Surface** | `#141414` | Inner list items, input fields, badges |
| **Primary Text** | `#FFFFFF` | Headings, primary labels, values |
| **Accent Colour** | `#C7FF4D` | Neon lime primary actions, active navigation, indicators |
| **Secondary Text** | `#A5A5A5` | Descriptions, timestamps, metadata |
| **Borders & Dividers** | `#252525` | Card outlines, dividers, subtle separators |
| **Typography** | Inter | Sans-serif with fallback stack |
| **Logo Lockup** | Original Dawnexus Logo | High-resolution brand mark with `#C7FF4D` `SOCIAL` product badge |

---

## 2. Platform Capabilities

1. **Overview Dashboard**: Connected channels health, 30-day scheduled queues, Meta advertising snapshot, governance approvals, and system telemetry.
2. **Social Media Account Management**: Official OAuth 2.0 connection engine for Instagram Professional, Facebook Pages, and LinkedIn Company/Personal accounts with AES-256 token encryption.
3. **Posts Studio**: Multi-platform composer with AI caption generation, authentic customer photo/video uploads, live responsive mockups (Instagram, LinkedIn, Facebook), and approval workflows (Draft → Pending Approval → Approved → Scheduled → Published).
4. **30-Day Content Calendar**: Visual interactive matrix tracking publishing cadence, platform distribution, and scheduled queues.
5. **Campaigns & Financial Safeguards**: Meta advertising dashboard reporting real-time metrics (impressions, clicks, spend, conversions, ROAS) with two-step confirmation modals before any budget change or status toggle.
6. **Cross-Channel Analytics**: Transparent performance reporting with official API attribution notes.
7. **Remote MCP Server (`/mcp/sse`)**: Model Context Protocol endpoint for Claude Desktop, Claude Enterprise, and ChatGPT Custom GPTs with customer-specific Bearer token isolation.
8. **Help Centre & Onboarding**: 5-step checklist, platform permission guides, searchable FAQs, and troubleshooting directory.
9. **Settings & Governance**: Mandatory administrative sign-off toggle, daily ad spend limit caps, and immutable audit trail logs.

---

## 3. Development & Production Scripts

```bash
# Start full-stack development environment (Frontend on :3005, Backend on :3006)
npm run dev

# Build client for production
npm run build

# Start backend & MCP server
npm start
```

---

## 4. Remote MCP Endpoint Configuration

- **SSE Transport URL**: `https://social.dawnexus.in/mcp/sse`
- **Messages Endpoint**: `https://social.dawnexus.in/mcp/messages`
- **OpenAPI Schema (ChatGPT)**: `https://social.dawnexus.in/mcp/openapi.json`
- **Authentication**: `Authorization: Bearer dwnx_live_<workspace_secret>`

