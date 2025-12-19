import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api.js";
import schema from "./schema.js";

const modules = import.meta.glob("./**/*.ts");

describe("Audit Log Component", () => {
  test("log creates an audit event", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: {
        type: "user",
        id: "user_123",
        email: "test@example.com",
      },
      targets: [],
    });

    expect(result.created).toBe(true);
    expect(result.eventId).toBeDefined();
  });

  test("log with idempotency key prevents duplicates", async () => {
    const t = convexTest(schema, modules);

    const first = await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_123" },
      targets: [],
      idempotencyKey: "unique-key-123",
    });

    expect(first.created).toBe(true);

    const second = await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_123" },
      targets: [],
      idempotencyKey: "unique-key-123",
    });

    expect(second.created).toBe(false);
    expect(second.eventId).toBe(first.eventId);
  });

  test("list returns events in descending order", async () => {
    const t = convexTest(schema, modules);

    // Create multiple events
    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [],
      occurredAt: 1000,
    });

    await t.mutation(api.lib.log, {
      action: "user.signed_out",
      actor: { type: "user", id: "user_1" },
      targets: [],
      occurredAt: 2000,
    });

    const result = await t.query(api.lib.list, {});

    expect(result.events.length).toBe(2);
    expect(result.events[0].action).toBe("user.signed_out"); // More recent first
    expect(result.events[1].action).toBe("user.signed_in");
  });

  test("list filters by organization", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [],
      organizationId: "org_1",
    });

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_2" },
      targets: [],
      organizationId: "org_2",
    });

    const result = await t.query(api.lib.list, {
      organizationId: "org_1",
    });

    expect(result.events.length).toBe(1);
    expect(result.events[0].actor.id).toBe("user_1");
  });

  test("listByActor filters events by actor", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [],
    });

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_2" },
      targets: [],
    });

    const result = await t.query(api.lib.listByActor, {
      actorType: "user",
      actorId: "user_1",
    });

    expect(result.length).toBe(1);
    expect(result[0].actor.id).toBe("user_1");
  });

  test("listByAction filters events by action", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [],
    });

    await t.mutation(api.lib.log, {
      action: "user.signed_out",
      actor: { type: "user", id: "user_1" },
      targets: [],
    });

    const result = await t.query(api.lib.listByAction, {
      action: "user.signed_in",
    });

    expect(result.length).toBe(1);
    expect(result[0].action).toBe("user.signed_in");
  });

  test("get retrieves a single event", async () => {
    const t = convexTest(schema, modules);

    const { eventId } = await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [{ type: "session", id: "session_1" }],
    });

    const event = await t.query(api.lib.get, { eventId });

    expect(event).toBeDefined();
    expect(event?.action).toBe("user.signed_in");
    expect(event?.targets[0].type).toBe("session");
  });

  test("getStats returns correct statistics", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "user", id: "user_1" },
      targets: [],
      result: "success",
      occurredAt: now - 1000,
    });

    await t.mutation(api.lib.log, {
      action: "user.signed_in",
      actor: { type: "system", id: "system" },
      targets: [],
      result: "failure",
      occurredAt: now - 500,
    });

    const stats = await t.query(api.lib.getStats, {
      startTime: now - 2000,
      endTime: now,
    });

    expect(stats.totalEvents).toBe(2);
    expect(stats.eventsByAction["user.signed_in"]).toBe(2);
    expect(stats.eventsByActorType["user"]).toBe(1);
    expect(stats.eventsByActorType["system"]).toBe(1);
    expect(stats.eventsByResult["success"]).toBe(1);
    expect(stats.eventsByResult["failure"]).toBe(1);
  });

  test("logBatch creates multiple events", async () => {
    const t = convexTest(schema, modules);

    const results = await t.mutation(api.lib.logBatch, {
      events: [
        {
          action: "user.signed_in",
          actor: { type: "user", id: "user_1" },
          targets: [],
        },
        {
          action: "user.signed_out",
          actor: { type: "user", id: "user_2" },
          targets: [],
        },
      ],
    });

    expect(results.length).toBe(2);
    expect(results[0].created).toBe(true);
    expect(results[1].created).toBe(true);

    const list = await t.query(api.lib.list, {});
    expect(list.events.length).toBe(2);
  });
});
