import {
  httpActionGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import type {
  Auth,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  HttpRouter,
} from "convex/server";
import { v } from "convex/values";
import type { ComponentApi } from "../component/_generated/component.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Actor types for audit events
 */
export type ActorType = "user" | "system" | "api_key" | "service";

/**
 * Actor who performed the action
 */
export interface Actor {
  type: ActorType;
  id: string;
  name?: string;
  email?: string;
  metadata?: Record<string, any>;
}

/**
 * Target resource affected by the action
 */
export interface Target {
  type: string;
  id: string;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Context of where/how the action occurred
 */
export interface Context {
  location?: string;
  userAgent?: string;
  geoLocation?: {
    city?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  requestId?: string;
  sessionId?: string;
}

/**
 * Audit event input for logging
 */
export interface AuditEventInput {
  action: string;
  actor: Actor;
  targets: Target[];
  context?: Context;
  metadata?: Record<string, any>;
  organizationId?: string;
  occurredAt?: number;
  idempotencyKey?: string;
  result?: "success" | "failure" | "pending";
  error?: {
    code?: string;
    message?: string;
  };
  tags?: string[];
  version?: number;
}

/**
 * Standard action categories for audit events
 */
export const STANDARD_ACTIONS = {
  // Authentication events
  USER_SIGNED_IN: "user.signed_in",
  USER_SIGNED_OUT: "user.signed_out",
  USER_SIGN_IN_FAILED: "user.sign_in_failed",
  USER_PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_MFA_ENABLED: "user.mfa_enabled",
  USER_MFA_DISABLED: "user.mfa_disabled",
  USER_SESSION_EXPIRED: "user.session_expired",
  USER_SESSION_REVOKED: "user.session_revoked",

  // User management events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_INVITED: "user.invited",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_EMAIL_VERIFIED: "user.email_verified",
  USER_ACTIVATED: "user.activated",
  USER_DEACTIVATED: "user.deactivated",

  // Organization events
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_DELETED: "organization.deleted",
  MEMBER_ADDED: "member.added",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_INVITED: "member.invited",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_REVOKED: "invitation.revoked",

  // Resource/Data events
  RESOURCE_CREATED: "resource.created",
  RESOURCE_READ: "resource.read",
  RESOURCE_UPDATED: "resource.updated",
  RESOURCE_DELETED: "resource.deleted",
  RESOURCE_EXPORTED: "resource.exported",
  RESOURCE_IMPORTED: "resource.imported",
  RESOURCE_SHARED: "resource.shared",
  RESOURCE_UNSHARED: "resource.unshared",

  // Security events
  ACCESS_DENIED: "access.denied",
  PERMISSION_GRANTED: "permission.granted",
  PERMISSION_REVOKED: "permission.revoked",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  API_KEY_USED: "api_key.used",
  SECURITY_ALERT: "security.alert",
  SUSPICIOUS_ACTIVITY: "security.suspicious_activity",

  // Settings events
  SETTINGS_UPDATED: "settings.updated",
  NOTIFICATION_PREFERENCES_CHANGED: "notification.preferences_changed",
  BILLING_UPDATED: "billing.updated",
  SUBSCRIPTION_CHANGED: "subscription.changed",
} as const;

export type StandardAction =
  (typeof STANDARD_ACTIONS)[keyof typeof STANDARD_ACTIONS];

// =============================================================================
// Validators (for use in user's code)
// =============================================================================

export const actorValidator = v.object({
  type: v.union(
    v.literal("user"),
    v.literal("system"),
    v.literal("api_key"),
    v.literal("service"),
  ),
  id: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
});

export const targetValidator = v.object({
  type: v.string(),
  id: v.string(),
  name: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
});

export const contextValidator = v.object({
  location: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  geoLocation: v.optional(
    v.object({
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      region: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),
  ),
  requestId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Log an audit event using the component
 *
 * @example
 * ```typescript
 * import { logAuditEvent, STANDARD_ACTIONS } from "@flickeriy/convex-audit";
 *
 * export const myMutation = mutation({
 *   handler: async (ctx) => {
 *     // ... do something ...
 *
 *     await logAuditEvent(ctx, components.convexAudit, {
 *       action: STANDARD_ACTIONS.USER_CREATED,
 *       actor: { type: "user", id: userId },
 *       targets: [{ type: "user", id: newUserId }],
 *     });
 *   },
 * });
 * ```
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  component: ComponentApi,
  event: AuditEventInput,
) {
  return await ctx.runMutation(component.lib.log, {
    ...event,
    occurredAt: event.occurredAt ?? Date.now(),
  });
}

/**
 * Log multiple audit events in a batch
 */
export async function logAuditEventBatch(
  ctx: MutationCtx,
  component: ComponentApi,
  events: AuditEventInput[],
) {
  return await ctx.runMutation(component.lib.logBatch, {
    events: events.map((event) => ({
      ...event,
      occurredAt: event.occurredAt ?? Date.now(),
    })),
  });
}

/**
 * Get a single audit event by ID
 */
export async function getAuditEvent(
  ctx: QueryCtx,
  component: ComponentApi,
  eventId: string,
) {
  return await ctx.runQuery(component.lib.get, { eventId });
}

/**
 * List audit events with filtering
 */
export async function listAuditEvents(
  ctx: QueryCtx,
  component: ComponentApi,
  options?: {
    organizationId?: string;
    action?: string;
    actorId?: string;
    actorType?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    cursor?: string;
  },
) {
  return await ctx.runQuery(component.lib.list, options ?? {});
}

/**
 * Search audit events
 */
export async function searchAuditEvents(
  ctx: QueryCtx,
  component: ComponentApi,
  searchQuery: string,
  options?: {
    organizationId?: string;
    actorId?: string;
    limit?: number;
  },
) {
  return await ctx.runQuery(component.lib.search, {
    searchQuery,
    ...options,
  });
}

/**
 * Get audit statistics
 */
export async function getAuditStats(
  ctx: QueryCtx,
  component: ComponentApi,
  options?: {
    organizationId?: string;
    startTime?: number;
    endTime?: number;
  },
) {
  return await ctx.runQuery(component.lib.getStats, options ?? {});
}

// =============================================================================
// Class-based Client
// =============================================================================

/**
 * AuditLog client for interacting with the audit component
 *
 * @example
 * ```typescript
 * import { AuditLog } from "@flickeriy/convex-audit";
 *
 * const audit = new AuditLog(components.convexAudit);
 *
 * export const myMutation = mutation({
 *   handler: async (ctx) => {
 *     await audit.log(ctx, {
 *       action: "user.created",
 *       actor: { type: "user", id: userId },
 *       targets: [{ type: "user", id: newUserId }],
 *     });
 *   },
 * });
 * ```
 */
export class AuditLog {
  constructor(
    public component: ComponentApi,
    public options?: {
      defaultOrganizationId?: string;
    },
  ) {}

  /**
   * Log a single audit event
   */
  async log(ctx: MutationCtx, event: AuditEventInput) {
    return await logAuditEvent(ctx, this.component, {
      ...event,
      organizationId:
        event.organizationId ?? this.options?.defaultOrganizationId,
    });
  }

  /**
   * Log multiple audit events in a batch
   */
  async logBatch(ctx: MutationCtx, events: AuditEventInput[]) {
    return await logAuditEventBatch(
      ctx,
      this.component,
      events.map((e) => ({
        ...e,
        organizationId: e.organizationId ?? this.options?.defaultOrganizationId,
      })),
    );
  }

  /**
   * Get a single audit event by ID
   */
  async get(ctx: QueryCtx, eventId: string) {
    return await getAuditEvent(ctx, this.component, eventId);
  }

  /**
   * List audit events with filtering
   */
  async list(
    ctx: QueryCtx,
    options?: {
      organizationId?: string;
      action?: string;
      actorId?: string;
      actorType?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
      cursor?: string;
    },
  ) {
    return await listAuditEvents(ctx, this.component, {
      ...options,
      organizationId:
        options?.organizationId ?? this.options?.defaultOrganizationId,
    });
  }

  /**
   * Search audit events
   */
  async search(
    ctx: QueryCtx,
    searchQuery: string,
    options?: {
      organizationId?: string;
      actorId?: string;
      limit?: number;
    },
  ) {
    return await searchAuditEvents(ctx, this.component, searchQuery, {
      ...options,
      organizationId:
        options?.organizationId ?? this.options?.defaultOrganizationId,
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(
    ctx: QueryCtx,
    options?: {
      organizationId?: string;
      startTime?: number;
      endTime?: number;
    },
  ) {
    return await getAuditStats(ctx, this.component, {
      ...options,
      organizationId:
        options?.organizationId ?? this.options?.defaultOrganizationId,
    });
  }

  /**
   * List events by a specific actor
   */
  async listByActor(
    ctx: QueryCtx,
    actorType: ActorType,
    actorId: string,
    options?: {
      startTime?: number;
      endTime?: number;
      limit?: number;
    },
  ) {
    return await ctx.runQuery(this.component.lib.listByActor, {
      actorType,
      actorId,
      ...options,
    });
  }

  /**
   * List events by a specific action type
   */
  async listByAction(
    ctx: QueryCtx,
    action: string,
    options?: {
      organizationId?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    },
  ) {
    return await ctx.runQuery(this.component.lib.listByAction, {
      action,
      ...options,
      organizationId:
        options?.organizationId ?? this.options?.defaultOrganizationId,
    });
  }
}

// =============================================================================
// Expose API (for re-exporting)
// =============================================================================

/**
 * Operation types for authorization
 */
export type AuditOperation =
  | { type: "log"; action: string; organizationId?: string }
  | { type: "read"; organizationId?: string }
  | { type: "search"; organizationId?: string }
  | { type: "stats"; organizationId?: string };

/**
 * Expose the audit log API for direct use from React clients
 *
 * @example
 * ```typescript
 * // convex/audit.ts
 * import { exposeAuditApi } from "@flickeriy/convex-audit";
 * import { components } from "./_generated/api";
 *
 * export const { log, list, get, search, getStats } = exposeAuditApi(
 *   components.convexAudit,
 *   {
 *     auth: async (ctx, operation) => {
 *       const identity = await ctx.auth.getUserIdentity();
 *       if (!identity) throw new Error("Unauthorized");
 *       return {
 *         actorId: identity.subject,
 *         actorType: "user" as const,
 *         actorName: identity.name,
 *         actorEmail: identity.email,
 *       };
 *     },
 *   }
 * );
 * ```
 */
export function exposeAuditApi(
  component: ComponentApi,
  options: {
    /**
     * Authentication function that returns actor information
     * This should verify the user is authorized to perform the operation
     */
    auth: (
      ctx: { auth: Auth },
      operation: AuditOperation,
    ) => Promise<{
      actorId: string;
      actorType: ActorType;
      actorName?: string;
      actorEmail?: string;
      organizationId?: string;
    }>;
  },
) {
  return {
    /**
     * Log an audit event
     */
    log: mutationGeneric({
      args: {
        action: v.string(),
        targets: v.array(targetValidator),
        context: v.optional(contextValidator),
        metadata: v.optional(v.record(v.string(), v.any())),
        organizationId: v.optional(v.string()),
        idempotencyKey: v.optional(v.string()),
        result: v.optional(
          v.union(
            v.literal("success"),
            v.literal("failure"),
            v.literal("pending"),
          ),
        ),
        error: v.optional(
          v.object({
            code: v.optional(v.string()),
            message: v.optional(v.string()),
          }),
        ),
        tags: v.optional(v.array(v.string())),
      },
      handler: async (ctx, args) => {
        const authResult = await options.auth(ctx, {
          type: "log",
          action: args.action,
          organizationId: args.organizationId,
        });

        return await ctx.runMutation(component.lib.log, {
          action: args.action,
          actor: {
            type: authResult.actorType,
            id: authResult.actorId,
            name: authResult.actorName,
            email: authResult.actorEmail,
          },
          targets: args.targets,
          context: args.context,
          metadata: args.metadata,
          organizationId: args.organizationId ?? authResult.organizationId,
          idempotencyKey: args.idempotencyKey,
          result: args.result,
          error: args.error,
          tags: args.tags,
        });
      },
    }),

    /**
     * List audit events
     */
    list: queryGeneric({
      args: {
        organizationId: v.optional(v.string()),
        action: v.optional(v.string()),
        actorId: v.optional(v.string()),
        actorType: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, {
          type: "read",
          organizationId: args.organizationId,
        });

        return await ctx.runQuery(component.lib.list, args);
      },
    }),

    /**
     * Get a single audit event
     */
    get: queryGeneric({
      args: {
        eventId: v.string(),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read" });
        return await ctx.runQuery(component.lib.get, args);
      },
    }),

    /**
     * Search audit events
     */
    search: queryGeneric({
      args: {
        searchQuery: v.string(),
        organizationId: v.optional(v.string()),
        actorId: v.optional(v.string()),
        limit: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, {
          type: "search",
          organizationId: args.organizationId,
        });

        return await ctx.runQuery(component.lib.search, args);
      },
    }),

    /**
     * Get audit statistics
     */
    getStats: queryGeneric({
      args: {
        organizationId: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, {
          type: "stats",
          organizationId: args.organizationId,
        });

        return await ctx.runQuery(component.lib.getStats, args);
      },
    }),

    /**
     * List events by actor
     */
    listByActor: queryGeneric({
      args: {
        actorType: v.string(),
        actorId: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        limit: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, { type: "read" });
        return await ctx.runQuery(component.lib.listByActor, args);
      },
    }),

    /**
     * List events by action
     */
    listByAction: queryGeneric({
      args: {
        action: v.string(),
        organizationId: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        limit: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        await options.auth(ctx, {
          type: "read",
          organizationId: args.organizationId,
        });
        return await ctx.runQuery(component.lib.listByAction, args);
      },
    }),
  };
}

// =============================================================================
// HTTP Routes
// =============================================================================

/**
 * Register HTTP routes for the audit log component
 *
 * @example
 * ```typescript
 * // convex/http.ts
 * import { httpRouter } from "convex/server";
 * import { registerAuditRoutes } from "@flickeriy/convex-audit";
 * import { components } from "./_generated/api";
 *
 * const http = httpRouter();
 *
 * registerAuditRoutes(http, components.convexAudit, {
 *   pathPrefix: "/audit",
 * });
 *
 * export default http;
 * ```
 */
export function registerAuditRoutes(
  http: HttpRouter,
  component: ComponentApi,
  { pathPrefix = "/audit" }: { pathPrefix?: string } = {},
) {
  // GET /audit/events - List recent events
  http.route({
    path: `${pathPrefix}/events`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const organizationId =
        url.searchParams.get("organizationId") ?? undefined;
      const action = url.searchParams.get("action") ?? undefined;
      const limit = url.searchParams.get("limit");

      const result = await ctx.runQuery(component.lib.list, {
        organizationId,
        action,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }),
  });

  // GET /audit/events/:id - Get a single event
  http.route({
    path: `${pathPrefix}/event`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const eventId = url.searchParams.get("id");

      if (!eventId) {
        return new Response(
          JSON.stringify({ error: "id parameter required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const event = await ctx.runQuery(component.lib.get, { eventId });

      if (!event) {
        return new Response(JSON.stringify({ error: "Event not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(event), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });

  // GET /audit/stats - Get audit statistics
  http.route({
    path: `${pathPrefix}/stats`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const organizationId =
        url.searchParams.get("organizationId") ?? undefined;
      const startTime = url.searchParams.get("startTime");
      const endTime = url.searchParams.get("endTime");

      const stats = await ctx.runQuery(component.lib.getStats, {
        organizationId,
        startTime: startTime ? parseInt(startTime, 10) : undefined,
        endTime: endTime ? parseInt(endTime, 10) : undefined,
      });

      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });

  // GET /audit/search - Search events
  http.route({
    path: `${pathPrefix}/search`,
    method: "GET",
    handler: httpActionGeneric(async (ctx, request) => {
      const url = new URL(request.url);
      const searchQuery = url.searchParams.get("q");

      if (!searchQuery) {
        return new Response(
          JSON.stringify({ error: "q (search query) parameter required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const organizationId =
        url.searchParams.get("organizationId") ?? undefined;
      const actorId = url.searchParams.get("actorId") ?? undefined;
      const limit = url.searchParams.get("limit");

      const events = await ctx.runQuery(component.lib.search, {
        searchQuery,
        organizationId,
        actorId,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      return new Response(JSON.stringify({ events }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  });
}

// =============================================================================
// Context Types
// =============================================================================

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runQuery" | "runMutation"
>;
