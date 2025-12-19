import { action, mutation, query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import {
  AuditLog,
  exposeAuditApi,
  STANDARD_ACTIONS,
  logAuditEvent,
} from "@flickeriy/convex-audit";
import { v } from "convex/values";
import { Auth } from "convex/server";

// =============================================================================
// Option 1: Using the AuditLog class (recommended for most use cases)
// =============================================================================

// Create an instance of the audit log client
const audit = new AuditLog(components.convexAudit);

/**
 * Example: Log a user sign-in event
 */
export const logUserSignIn = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await audit.log(ctx, {
      action: STANDARD_ACTIONS.USER_SIGNED_IN,
      actor: {
        type: "user",
        id: args.userId,
        email: args.email,
      },
      targets: [
        {
          type: "session",
          id: crypto.randomUUID(),
        },
      ],
      context: {
        location: args.ipAddress,
        userAgent: args.userAgent,
      },
      result: "success",
    });
  },
});

/**
 * Example: Log a failed sign-in attempt
 */
export const logFailedSignIn = mutation({
  args: {
    email: v.string(),
    reason: v.string(),
    ipAddress: v.optional(v.string()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await audit.log(ctx, {
      action: STANDARD_ACTIONS.USER_SIGN_IN_FAILED,
      actor: {
        type: "user",
        id: "unknown",
        email: args.email,
      },
      targets: [],
      context: {
        location: args.ipAddress,
      },
      result: "failure",
      error: {
        message: args.reason,
      },
      metadata: {
        attemptedEmail: args.email,
      },
    });
  },
});

/**
 * Example: Log a resource creation event
 */
export const logResourceCreated = mutation({
  args: {
    userId: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    resourceName: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await audit.log(ctx, {
      action: STANDARD_ACTIONS.RESOURCE_CREATED,
      actor: {
        type: "user",
        id: args.userId,
      },
      targets: [
        {
          type: args.resourceType,
          id: args.resourceId,
          name: args.resourceName,
        },
      ],
      organizationId: args.organizationId,
      result: "success",
    });
  },
});

/**
 * Example: Log a permission change
 */
export const logPermissionGranted = mutation({
  args: {
    granterId: v.string(),
    granteeId: v.string(),
    permission: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await audit.log(ctx, {
      action: STANDARD_ACTIONS.PERMISSION_GRANTED,
      actor: {
        type: "user",
        id: args.granterId,
      },
      targets: [
        {
          type: "user",
          id: args.granteeId,
          metadata: {
            permission: args.permission,
          },
        },
        {
          type: args.resourceType,
          id: args.resourceId,
        },
      ],
      organizationId: args.organizationId,
      metadata: {
        permission: args.permission,
      },
      result: "success",
    });
  },
});

// =============================================================================
// Option 2: Using the helper function directly
// =============================================================================

/**
 * Example: Log a member invitation using the helper function
 */
export const logMemberInvited = mutation({
  args: {
    inviterId: v.string(),
    inviteeEmail: v.string(),
    role: v.string(),
    organizationId: v.string(),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await logAuditEvent(ctx, components.convexAudit, {
      action: STANDARD_ACTIONS.MEMBER_INVITED,
      actor: {
        type: "user",
        id: args.inviterId,
      },
      targets: [
        {
          type: "invitation",
          id: crypto.randomUUID(),
          metadata: {
            email: args.inviteeEmail,
            role: args.role,
          },
        },
      ],
      organizationId: args.organizationId,
      metadata: {
        inviteeEmail: args.inviteeEmail,
        role: args.role,
      },
      result: "success",
    });
  },
});

// =============================================================================
// Option 3: Calling component functions directly
// =============================================================================

/**
 * Example: Log a custom event by calling the component directly
 */
export const logCustomEvent = mutation({
  args: {
    action: v.string(),
    actorId: v.string(),
    actorType: v.union(
      v.literal("user"),
      v.literal("system"),
      v.literal("api_key"),
      v.literal("service")
    ),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    organizationId: v.optional(v.string()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.convexAudit.lib.log, {
      action: args.action,
      actor: {
        type: args.actorType,
        id: args.actorId,
      },
      targets: [
        {
          type: args.targetType,
          id: args.targetId,
        },
      ],
      metadata: args.metadata,
      organizationId: args.organizationId,
    });
  },
});

// =============================================================================
// Query Functions
// =============================================================================

/**
 * List recent audit events
 */
export const listAuditEvents = query({
  args: {
    organizationId: v.optional(v.string()),
    action: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await audit.list(ctx, args);
  },
});

/**
 * Get audit events for a specific user
 */
export const getEventsForUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await audit.listByActor(ctx, "user", args.userId, {
      limit: args.limit,
    });
  },
});

/**
 * Get audit statistics
 */
export const getAuditStats = query({
  args: {
    organizationId: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await audit.getStats(ctx, args);
  },
});

/**
 * Search audit events
 */
export const searchEvents = query({
  args: {
    query: v.string(),
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await audit.search(ctx, args.query, {
      organizationId: args.organizationId,
      limit: args.limit,
    });
  },
});

// =============================================================================
// Option 4: Re-export the API for direct client access
// =============================================================================

/**
 * Expose the audit API with authentication
 * These functions can be called directly from React clients
 */
export const { log, list, get, search, getStats, listByActor, listByAction } =
  exposeAuditApi(components.convexAudit, {
    auth: async (ctx, operation) => {
      const identity = await ctx.auth.getUserIdentity();

      // For read operations, allow anonymous access (or require auth)
      if (operation.type === "read" || operation.type === "search" || operation.type === "stats") {
        return {
          actorId: identity?.subject ?? "anonymous",
          actorType: "user" as const,
          actorName: identity?.name ?? undefined,
          actorEmail: identity?.email ?? undefined,
        };
      }

      // For write operations, require authentication
      if (!identity) {
        throw new Error("Authentication required to log audit events");
      }

      return {
        actorId: identity.subject,
        actorType: "user" as const,
        actorName: identity.name ?? undefined,
        actorEmail: identity.email ?? undefined,
      };
    },
  });
