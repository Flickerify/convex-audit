# Convex Audit Log

[![npm version](https://badge.fury.io/js/@flickeriy%2Fconvex-audit.svg)](https://badge.fury.io/js/@flickeriy%2Fconvex-audit)

A comprehensive audit logging component for Convex applications. Built with best practices from enterprise audit systems like WorkOS, this component provides a robust, customizable, and performant audit trail for your application.

## Features

- 📝 **Comprehensive Event Logging** - Track user actions, system events, and security incidents
- 🔍 **Full-Text Search** - Search through audit events by action type
- 📊 **Statistics & Analytics** - Get insights into your audit data
- 🏢 **Multi-Tenant Support** - Scope events to organizations
- 🔐 **Idempotency** - Prevent duplicate events with idempotency keys
- ⚡ **Real-Time** - Events are immediately queryable (it's Convex!)
- 🎯 **Type-Safe** - Full TypeScript support with validators

## Installation

```bash
npm install @flickeriy/convex-audit
```

Create a `convex.config.ts` file in your app's `convex/` folder:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import convexAudit from "@flickeriy/convex-audit/convex.config";

const app = defineApp();
app.use(convexAudit);

export default app;
```

## Quick Start

### Option 1: Using the AuditLog Class (Recommended)

```typescript
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { AuditLog, STANDARD_ACTIONS } from "@flickeriy/convex-audit";

// Create an instance
const audit = new AuditLog(components.convexAudit);

export const createDocument = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const docId = await ctx.db.insert("documents", { title: args.title });

    // Log the audit event
    await audit.log(ctx, {
      action: STANDARD_ACTIONS.RESOURCE_CREATED,
      actor: {
        type: "user",
        id: identity.subject,
        email: identity.email,
      },
      targets: [{ type: "document", id: docId, name: args.title }],
      result: "success",
    });

    return docId;
  },
});

export const listAuditEvents = query({
  args: {},
  handler: async (ctx) => {
    return await audit.list(ctx);
  },
});
```

### Option 2: Using Helper Functions

```typescript
import { logAuditEvent, STANDARD_ACTIONS } from "@flickeriy/convex-audit";
import { components } from "./_generated/api";

export const logUserSignIn = mutation({
  args: { userId: v.string(), ipAddress: v.string() },
  handler: async (ctx, args) => {
    await logAuditEvent(ctx, components.convexAudit, {
      action: STANDARD_ACTIONS.USER_SIGNED_IN,
      actor: { type: "user", id: args.userId },
      targets: [],
      context: { location: args.ipAddress },
    });
  },
});
```

### Option 3: Expose API for React Clients

```typescript
// convex/audit.ts
import { exposeAuditApi } from "@flickeriy/convex-audit";
import { components } from "./_generated/api";

export const { log, list, get, search, getStats } = exposeAuditApi(
  components.convexAudit,
  {
    auth: async (ctx, operation) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");
      return {
        actorId: identity.subject,
        actorType: "user",
        actorName: identity.name,
        actorEmail: identity.email,
      };
    },
  }
);
```

## Standard Actions

The component includes a comprehensive set of standard actions:

### Authentication Events

| Action | Description |
|--------|-------------|
| `user.signed_in` | User successfully signed in |
| `user.signed_out` | User signed out |
| `user.sign_in_failed` | Failed sign-in attempt |
| `user.password_reset_requested` | Password reset requested |
| `user.password_changed` | Password was changed |
| `user.mfa_enabled` | MFA was enabled |
| `user.mfa_disabled` | MFA was disabled |
| `user.session_expired` | Session expired |
| `user.session_revoked` | Session was revoked |

### User Management Events

| Action | Description |
|--------|-------------|
| `user.created` | New user created |
| `user.updated` | User profile updated |
| `user.deleted` | User deleted |
| `user.invited` | User invitation sent |
| `user.role_changed` | User role changed |
| `user.email_verified` | Email address verified |
| `user.activated` | User account activated |
| `user.deactivated` | User account deactivated |

### Organization Events

| Action | Description |
|--------|-------------|
| `organization.created` | Organization created |
| `organization.updated` | Organization updated |
| `organization.deleted` | Organization deleted |
| `member.added` | Member added to organization |
| `member.removed` | Member removed from organization |
| `member.role_changed` | Member role changed |
| `member.invited` | Member invitation sent |
| `invitation.accepted` | Invitation accepted |
| `invitation.revoked` | Invitation revoked |

### Resource Events

| Action | Description |
|--------|-------------|
| `resource.created` | Resource created |
| `resource.read` | Resource accessed/viewed |
| `resource.updated` | Resource updated |
| `resource.deleted` | Resource deleted |
| `resource.exported` | Resource exported |
| `resource.imported` | Resource imported |
| `resource.shared` | Resource shared |
| `resource.unshared` | Resource sharing removed |

### Security Events

| Action | Description |
|--------|-------------|
| `access.denied` | Access was denied |
| `permission.granted` | Permission granted |
| `permission.revoked` | Permission revoked |
| `api_key.created` | API key created |
| `api_key.revoked` | API key revoked |
| `api_key.used` | API key used |
| `security.alert` | Security alert triggered |
| `security.suspicious_activity` | Suspicious activity detected |

## Event Structure

Each audit event contains:

```typescript
interface AuditEvent {
  // Core fields
  action: string;           // e.g., "user.signed_in"
  occurredAt: number;       // Unix timestamp in ms
  version?: number;         // Schema version

  // Who performed the action
  actor: {
    type: "user" | "system" | "api_key" | "service";
    id: string;
    name?: string;
    email?: string;
    metadata?: Record<string, any>;
  };

  // What was affected
  targets: Array<{
    type: string;           // e.g., "document", "user", "team"
    id: string;
    name?: string;
    metadata?: Record<string, any>;
  }>;

  // Context
  context?: {
    location?: string;      // IP address
    userAgent?: string;
    geoLocation?: { city, country, region, etc. };
    requestId?: string;
    sessionId?: string;
  };

  // Additional data
  metadata?: Record<string, any>;
  organizationId?: string;
  result?: "success" | "failure" | "pending";
  error?: { code?: string; message?: string };
  tags?: string[];
  idempotencyKey?: string;
}
```

## React Hooks

```tsx
import {
  useAuditEvents,
  useAuditStats,
  useAuditSearch,
  formatAction,
  formatRelativeTime,
  getActionIcon,
} from "@flickeriy/convex-audit/react";
import { api } from "../convex/_generated/api";

function AuditLogPage() {
  const { events, hasMore, loadMore, isLoading } = useAuditEvents(
    api.audit.list,
    { organizationId: "org_123" }
  );

  const stats = useAuditStats(api.audit.getStats, {
    organizationId: "org_123",
  });

  return (
    <div>
      <h1>Audit Log</h1>
      
      {stats && (
        <div className="stats">
          <p>Total Events: {stats.totalEvents}</p>
        </div>
      )}
      
      <ul>
        {events.map((event) => (
          <li key={event._id}>
            <span>{getActionIcon(event.action)}</span>
            <span>{formatAction(event.action)}</span>
            <span>{formatRelativeTime(event.occurredAt)}</span>
            <span>by {event.actor.name || event.actor.id}</span>
          </li>
        ))}
      </ul>
      
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      )}
    </div>
  );
}
```

## HTTP Routes

Expose HTTP endpoints for external integrations:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerAuditRoutes } from "@flickeriy/convex-audit";
import { components } from "./_generated/api";

const http = httpRouter();

registerAuditRoutes(http, components.convexAudit, {
  pathPrefix: "/audit",
});

export default http;
```

This exposes:
- `GET /audit/events` - List events
- `GET /audit/event?id=xxx` - Get single event
- `GET /audit/stats` - Get statistics
- `GET /audit/search?q=xxx` - Search events

## Multi-Tenant Usage

Scope events to organizations:

```typescript
const audit = new AuditLog(components.convexAudit, {
  defaultOrganizationId: "org_123",
});

// All events will include organizationId: "org_123"
await audit.log(ctx, {
  action: STANDARD_ACTIONS.RESOURCE_CREATED,
  actor: { type: "user", id: userId },
  targets: [{ type: "document", id: docId }],
});

// Query events for a specific organization
const events = await audit.list(ctx, {
  organizationId: "org_123",
});
```

## Idempotency

Prevent duplicate events with idempotency keys:

```typescript
await audit.log(ctx, {
  action: STANDARD_ACTIONS.USER_SIGNED_IN,
  actor: { type: "user", id: userId },
  targets: [],
  idempotencyKey: `signin-${userId}-${sessionId}`,
});

// Calling again with the same key won't create a duplicate
const { eventId, created } = await audit.log(ctx, {
  action: STANDARD_ACTIONS.USER_SIGNED_IN,
  actor: { type: "user", id: userId },
  targets: [],
  idempotencyKey: `signin-${userId}-${sessionId}`,
});
// created === false (event already exists)
```

## Testing

```typescript
import { convexTest } from "convex-test";
import { test, expect } from "vitest";
import auditTest from "@flickeriy/convex-audit/test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

test("audit logging", async () => {
  const t = convexTest(schema, modules);
  auditTest.register(t, "convexAudit");

  await t.mutation(api.example.logUserSignIn, {
    userId: "user_123",
    email: "test@example.com",
  });

  const events = await t.query(api.example.listAuditEvents, {});
  expect(events.events.length).toBe(1);
  expect(events.events[0].action).toBe("user.signed_in");
});
```

## API Reference

### AuditLog Class

| Method | Description |
|--------|-------------|
| `log(ctx, event)` | Log a single audit event |
| `logBatch(ctx, events)` | Log multiple events |
| `get(ctx, eventId)` | Get event by ID |
| `list(ctx, options)` | List events with filters |
| `search(ctx, query, options)` | Search events |
| `getStats(ctx, options)` | Get statistics |
| `listByActor(ctx, actorType, actorId, options)` | List events by actor |
| `listByAction(ctx, action, options)` | List events by action |

### Helper Functions

| Function | Description |
|----------|-------------|
| `logAuditEvent(ctx, component, event)` | Log a single event |
| `logAuditEventBatch(ctx, component, events)` | Log multiple events |
| `getAuditEvent(ctx, component, eventId)` | Get event by ID |
| `listAuditEvents(ctx, component, options)` | List events |
| `searchAuditEvents(ctx, component, query, options)` | Search events |
| `getAuditStats(ctx, component, options)` | Get statistics |

### React Hooks

| Hook | Description |
|------|-------------|
| `useAuditEvents(listFn, args)` | List events with pagination |
| `useAuditStats(statsFn, args)` | Get audit statistics |
| `useAuditSearch(searchFn, args)` | Search events |
| `useAuditEvent(getFn, eventId)` | Get single event |
| `useLogAuditEvent(logFn)` | Get mutation to log events |

### Formatting Utilities

| Function | Description |
|----------|-------------|
| `formatAction(action)` | Format action for display |
| `formatTimestamp(ts, options)` | Format timestamp |
| `formatRelativeTime(ts)` | Format relative time |
| `getActionIcon(action)` | Get emoji for action type |
| `getResultColor(result)` | Get color for result |

## Best Practices

1. **Be Specific with Actions** - Use the standard actions or create custom ones that clearly describe what happened.

2. **Include Context** - Always capture IP address and user agent when available for security analysis.

3. **Use Targets Effectively** - Include all resources affected by an action, not just the primary one.

4. **Add Metadata** - Include relevant details that would help investigate security incidents.

5. **Use Idempotency Keys** - Prevent duplicate events when retrying failed requests.

6. **Scope to Organizations** - In multi-tenant apps, always include the organizationId.

7. **Log Failures** - Don't just log successful actions; failed attempts are often more important for security.

## License

Apache-2.0
