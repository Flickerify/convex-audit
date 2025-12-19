import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server.js";
import {
  actorValidator,
  targetValidator,
  contextValidator,
  auditEventValidator,
} from "./schema.js";

// =============================================================================
// Validators
// =============================================================================

const auditEventDocValidator = auditEventValidator.extend({
  _id: v.id("auditEvents"),
  _creationTime: v.number(),
});

// =============================================================================
// Core Functions - Writing Audit Events
// =============================================================================

/**
 * Log a new audit event
 *
 * This is the primary function for creating audit log entries.
 * It supports idempotency to prevent duplicate events.
 */
export const log = mutation({
  args: {
    action: v.string(),
    actor: actorValidator,
    targets: v.array(targetValidator),
    context: v.optional(contextValidator),
    metadata: v.optional(v.record(v.string(), v.any())),
    organizationId: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    idempotencyKey: v.optional(v.string()),
    result: v.optional(
      v.union(v.literal("success"), v.literal("failure"), v.literal("pending")),
    ),
    error: v.optional(
      v.object({
        code: v.optional(v.string()),
        message: v.optional(v.string()),
      }),
    ),
    tags: v.optional(v.array(v.string())),
    version: v.optional(v.number()),
  },
  returns: v.object({
    eventId: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Check for idempotency
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("auditEvents")
        .withIndex("by_idempotencyKey", (q) =>
          q.eq("idempotencyKey", args.idempotencyKey),
        )
        .first();

      if (existing) {
        return { eventId: existing._id, created: false };
      }
    }

    const occurredAt = args.occurredAt ?? Date.now();

    const eventId = await ctx.db.insert("auditEvents", {
      action: args.action,
      actor: args.actor,
      targets: args.targets,
      context: args.context,
      metadata: args.metadata,
      organizationId: args.organizationId,
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      result: args.result ?? "success",
      error: args.error,
      tags: args.tags,
      version: args.version ?? 1,
    });

    return { eventId, created: true };
  },
});

/**
 * Log multiple audit events in a single transaction
 */
export const logBatch = mutation({
  args: {
    events: v.array(
      v.object({
        action: v.string(),
        actor: actorValidator,
        targets: v.array(targetValidator),
        context: v.optional(contextValidator),
        metadata: v.optional(v.record(v.string(), v.any())),
        organizationId: v.optional(v.string()),
        occurredAt: v.optional(v.number()),
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
        version: v.optional(v.number()),
      }),
    ),
  },
  returns: v.array(
    v.object({
      eventId: v.string(),
      created: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const results: Array<{ eventId: string; created: boolean }> = [];

    for (const event of args.events) {
      // Check for idempotency
      if (event.idempotencyKey) {
        const existing = await ctx.db
          .query("auditEvents")
          .withIndex("by_idempotencyKey", (q) =>
            q.eq("idempotencyKey", event.idempotencyKey),
          )
          .first();

        if (existing) {
          results.push({ eventId: existing._id, created: false });
          continue;
        }
      }

      const occurredAt = event.occurredAt ?? Date.now();

      const eventId = await ctx.db.insert("auditEvents", {
        action: event.action,
        actor: event.actor,
        targets: event.targets,
        context: event.context,
        metadata: event.metadata,
        organizationId: event.organizationId,
        occurredAt,
        idempotencyKey: event.idempotencyKey,
        result: event.result ?? "success",
        error: event.error,
        tags: event.tags,
        version: event.version ?? 1,
      });

      results.push({ eventId, created: true });
    }

    return results;
  },
});

// =============================================================================
// Core Functions - Reading Audit Events
// =============================================================================

/**
 * Get a single audit event by ID
 */
export const get = query({
  args: {
    eventId: v.string(),
  },
  returns: v.union(v.null(), auditEventDocValidator),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId as any);
    return event;
  },
});

/**
 * List audit events with filtering and pagination
 */
export const list = query({
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
  returns: v.object({
    events: v.array(auditEventDocValidator),
    nextCursor: v.union(v.null(), v.string()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const startTime = args.startTime ?? 0;
    const endTime = args.endTime ?? Date.now() + 1000 * 60 * 60 * 24; // Default to 24h in the future

    let query;

    // Choose the best index based on provided filters
    if (args.organizationId) {
      query = ctx.db
        .query("auditEvents")
        .withIndex("by_organizationId_and_occurredAt", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .gte("occurredAt", startTime)
            .lte("occurredAt", endTime),
        );
    } else if (args.action) {
      const action = args.action;
      query = ctx.db
        .query("auditEvents")
        .withIndex("by_action_and_occurredAt", (q) =>
          q
            .eq("action", action)
            .gte("occurredAt", startTime)
            .lte("occurredAt", endTime),
        );
    } else if (args.actorType && args.actorId) {
      const actorType = args.actorType;
      const actorId = args.actorId;
      query = ctx.db
        .query("auditEvents")
        .withIndex("by_actor_and_occurredAt", (q) =>
          q
            .eq("actor.type", actorType as any)
            .eq("actor.id", actorId)
            .gte("occurredAt", startTime)
            .lte("occurredAt", endTime),
        );
    } else {
      // Default: query by creation time (most recent first)
      query = ctx.db.query("auditEvents");
    }

    // Apply ordering (most recent first)
    query = query.order("desc");

    // Take one extra to determine if there are more results
    const events = await query.take(limit + 1);

    const hasMore = events.length > limit;
    const resultEvents = hasMore ? events.slice(0, limit) : events;
    const nextCursor =
      hasMore && resultEvents.length > 0
        ? resultEvents[resultEvents.length - 1]._id
        : null;

    return {
      events: resultEvents,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Search audit events by action text
 */
export const search = query({
  args: {
    searchQuery: v.string(),
    organizationId: v.optional(v.string()),
    actorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(auditEventDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const searchResults = ctx.db
      .query("auditEvents")
      .withSearchIndex("search_action", (q) => {
        let searchQuery = q.search("action", args.searchQuery);
        if (args.organizationId) {
          searchQuery = searchQuery.eq("organizationId", args.organizationId);
        }
        if (args.actorId) {
          searchQuery = searchQuery.eq("actor.id", args.actorId);
        }
        return searchQuery;
      });

    return await searchResults.take(limit);
  },
});

/**
 * Get audit events for a specific actor
 */
export const listByActor = query({
  args: {
    actorType: v.string(),
    actorId: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(auditEventDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const startTime = args.startTime ?? 0;
    const endTime = args.endTime ?? Date.now() + 1000 * 60 * 60 * 24;

    const events = await ctx.db
      .query("auditEvents")
      .withIndex("by_actor_and_occurredAt", (q) =>
        q
          .eq("actor.type", args.actorType as any)
          .eq("actor.id", args.actorId)
          .gte("occurredAt", startTime)
          .lte("occurredAt", endTime),
      )
      .order("desc")
      .take(limit);

    return events;
  },
});

/**
 * Get audit events for a specific action type
 */
export const listByAction = query({
  args: {
    action: v.string(),
    organizationId: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(auditEventDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const startTime = args.startTime ?? 0;
    const endTime = args.endTime ?? Date.now() + 1000 * 60 * 60 * 24;

    let events = await ctx.db
      .query("auditEvents")
      .withIndex("by_action_and_occurredAt", (q) =>
        q
          .eq("action", args.action)
          .gte("occurredAt", startTime)
          .lte("occurredAt", endTime),
      )
      .order("desc")
      .take(limit * 2); // Take more to filter

    // Filter by organization if provided
    if (args.organizationId) {
      events = events.filter((e) => e.organizationId === args.organizationId);
    }

    return events.slice(0, limit);
  },
});

/**
 * Get audit event statistics
 */
export const getStats = query({
  args: {
    organizationId: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  returns: v.object({
    totalEvents: v.number(),
    eventsByAction: v.record(v.string(), v.number()),
    eventsByActorType: v.record(v.string(), v.number()),
    eventsByResult: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const startTime = args.startTime ?? Date.now() - 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const endTime = args.endTime ?? Date.now();

    let query;

    if (args.organizationId) {
      query = ctx.db
        .query("auditEvents")
        .withIndex("by_organizationId_and_occurredAt", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .gte("occurredAt", startTime)
            .lte("occurredAt", endTime),
        );
    } else {
      query = ctx.db.query("auditEvents");
    }

    const events = await query.collect();

    // Filter by time range if no organization filter
    const filteredEvents = args.organizationId
      ? events
      : events.filter(
          (e) => e.occurredAt >= startTime && e.occurredAt <= endTime,
        );

    const eventsByAction: Record<string, number> = {};
    const eventsByActorType: Record<string, number> = {};
    const eventsByResult: Record<string, number> = {};

    for (const event of filteredEvents) {
      // Count by action
      eventsByAction[event.action] = (eventsByAction[event.action] ?? 0) + 1;

      // Count by actor type
      eventsByActorType[event.actor.type] =
        (eventsByActorType[event.actor.type] ?? 0) + 1;

      // Count by result
      const result = event.result ?? "success";
      eventsByResult[result] = (eventsByResult[result] ?? 0) + 1;
    }

    return {
      totalEvents: filteredEvents.length,
      eventsByAction,
      eventsByActorType,
      eventsByResult,
    };
  },
});

// =============================================================================
// Internal Functions
// =============================================================================

/**
 * Internal function to get an event (for use by other component functions)
 */
export const getEvent = internalQuery({
  args: {
    eventId: v.id("auditEvents"),
  },
  returns: v.union(v.null(), auditEventDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Internal function to delete old events (for retention policies)
 */
export const deleteOldEvents = internalMutation({
  args: {
    olderThan: v.number(), // Unix timestamp in milliseconds
    organizationId: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    deleted: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    let query;

    if (args.organizationId) {
      query = ctx.db
        .query("auditEvents")
        .withIndex("by_organizationId_and_occurredAt", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .lt("occurredAt", args.olderThan),
        );
    } else {
      // Use the action index as a workaround to query by time
      query = ctx.db.query("auditEvents");
    }

    const events = await query.take(batchSize + 1);

    // Filter by time if no organization filter
    const toDelete = args.organizationId
      ? events.slice(0, batchSize)
      : events.filter((e) => e.occurredAt < args.olderThan).slice(0, batchSize);

    for (const event of toDelete) {
      await ctx.db.delete(event._id);
    }

    return {
      deleted: toDelete.length,
      hasMore: events.length > batchSize,
    };
  },
});

/**
 * Internal function to update an event (e.g., to mark as exported)
 */
export const updateEvent = internalMutation({
  args: {
    eventId: v.id("auditEvents"),
    metadata: v.optional(v.record(v.string(), v.any())),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {};

    if (args.metadata !== undefined) {
      const existing = await ctx.db.get(args.eventId);
      if (existing) {
        updates.metadata = { ...existing.metadata, ...args.metadata };
      }
    }

    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.eventId, updates);
    }

    return null;
  },
});
