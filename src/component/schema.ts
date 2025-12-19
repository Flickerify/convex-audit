import { defineSchema, defineTable } from "convex/server";
import { v, type Infer } from "convex/values";

/**
 * Actor types for audit events
 */
export const actorTypeValidator = v.union(
  v.literal("user"),
  v.literal("system"),
  v.literal("api_key"),
  v.literal("service"),
);

/**
 * Actor who performed the action
 */
export const actorValidator = v.object({
  type: actorTypeValidator,
  id: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
});

/**
 * Target resource affected by the action
 */
export const targetValidator = v.object({
  type: v.string(), // e.g., "user", "document", "team", "organization"
  id: v.string(),
  name: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
});

/**
 * Context of where/how the action occurred
 */
export const contextValidator = v.object({
  location: v.optional(v.string()), // IP address
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

/**
 * Audit event schema
 */
export const auditEventValidator = v.object({
  // Core fields
  action: v.string(), // The action that was performed (e.g., "user.signed_in")
  occurredAt: v.number(), // Unix timestamp in milliseconds
  version: v.optional(v.number()), // Schema version for this event type

  // Actor - who performed the action
  actor: actorValidator,

  // Targets - resources affected by the action
  targets: v.array(targetValidator),

  // Context - location and client information
  context: v.optional(contextValidator),

  // Custom metadata
  metadata: v.optional(v.record(v.string(), v.any())),

  // Organization scope (optional - for multi-tenant apps)
  organizationId: v.optional(v.string()),

  // Idempotency key to prevent duplicate events
  idempotencyKey: v.optional(v.string()),

  // Result of the action
  result: v.optional(
    v.union(v.literal("success"), v.literal("failure"), v.literal("pending")),
  ),

  // Error information if the action failed
  error: v.optional(
    v.object({
      code: v.optional(v.string()),
      message: v.optional(v.string()),
    }),
  ),

  // Tags for categorization and filtering
  tags: v.optional(v.array(v.string())),
});

export default defineSchema({
  auditEvents: defineTable(auditEventValidator)
    // Index by organization for multi-tenant queries
    .index("by_organizationId_and_occurredAt", ["organizationId", "occurredAt"])
    // Index by action type
    .index("by_action_and_occurredAt", ["action", "occurredAt"])
    // Index by actor
    .index("by_actor_and_occurredAt", ["actor.type", "actor.id", "occurredAt"])
    // Index by idempotency key for deduplication
    .index("by_idempotencyKey", ["idempotencyKey"])
    // Full-text search on action and metadata
    .searchIndex("search_action", {
      searchField: "action",
      filterFields: ["organizationId", "actor.id"],
    }),
});

export type ActorType = Infer<typeof actorTypeValidator>;
export type Actor = Infer<typeof actorValidator>;
export type Target = Infer<typeof targetValidator>;
export type Context = Infer<typeof contextValidator>;

export type AuditEvent = Infer<typeof auditEventValidator>;
export type AuditEventWithoutSystemFields = Omit<
  AuditEvent,
  "_id" | "_creationTime"
>;
