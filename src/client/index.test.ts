import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, components } from "../../example/convex/_generated/api.js";
import auditTest from "../test.js";
import schema from "../../example/convex/schema.js";

const modules = import.meta.glob("../../example/convex/**/*.ts");

describe("Audit Log Client", () => {
  test("can log events through example mutations", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    const result = await t.mutation(api.example.logUserSignIn, {
      userId: "user_123",
      email: "test@example.com",
    });

    expect(result.created).toBe(true);
    expect(result.eventId).toBeDefined();
  });

  test("can list events through example queries", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_123",
      email: "test@example.com",
    });

    const result = await t.query(api.example.listAuditEvents, {});

    expect(result.events.length).toBe(1);
    expect(result.events[0].action).toBe("user.signed_in");
  });

  test("can log custom events", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    const result = await t.mutation(api.example.logCustomEvent, {
      action: "custom.action",
      actorId: "user_123",
      actorType: "user",
      targetType: "document",
      targetId: "doc_456",
      metadata: { key: "value" },
    });

    expect(result.created).toBe(true);

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events[0].action).toBe("custom.action");
    expect(events.events[0].metadata).toEqual({ key: "value" });
  });

  test("can log failed sign-in attempts", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    const result = await t.mutation(api.example.logFailedSignIn, {
      email: "attacker@example.com",
      reason: "Invalid password",
      ipAddress: "192.168.1.1",
    });

    expect(result.created).toBe(true);

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events[0].action).toBe("user.sign_in_failed");
    expect(events.events[0].result).toBe("failure");
    expect(events.events[0].error?.message).toBe("Invalid password");
  });

  test("can get audit statistics", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_1",
      email: "user1@example.com",
    });

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_2",
      email: "user2@example.com",
    });

    const stats = await t.query(api.example.getAuditStats, {});

    expect(stats.totalEvents).toBe(2);
    expect(stats.eventsByAction["user.signed_in"]).toBe(2);
  });

  test("can get events for a specific user", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_1",
      email: "user1@example.com",
    });

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_2",
      email: "user2@example.com",
    });

    const events = await t.query(api.example.getEventsForUser, {
      userId: "user_1",
    });

    expect(events.length).toBe(1);
    expect(events[0].actor.id).toBe("user_1");
  });
});
