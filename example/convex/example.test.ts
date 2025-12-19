import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api.js";
import auditTest from "@flickeriy/convex-audit/test";
import schema from "./schema.js";

const modules = import.meta.glob("./**/*.ts");

describe("Audit Log Example App", () => {
  test("log user sign-in creates audit event", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    const result = await t.mutation(api.example.logUserSignIn, {
      userId: "user_123",
      email: "test@example.com",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    });

    expect(result.created).toBe(true);

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events.length).toBe(1);
    expect(events.events[0].action).toBe("user.signed_in");
    expect(events.events[0].actor.email).toBe("test@example.com");
    expect(events.events[0].context?.location).toBe("192.168.1.1");
  });

  test("log failed sign-in tracks security events", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logFailedSignIn, {
      email: "hacker@example.com",
      reason: "Invalid credentials",
      ipAddress: "10.0.0.1",
    });

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events[0].action).toBe("user.sign_in_failed");
    expect(events.events[0].result).toBe("failure");
  });

  test("log resource creation with organization", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logResourceCreated, {
      userId: "user_123",
      resourceType: "document",
      resourceId: "doc_456",
      resourceName: "My Document",
      organizationId: "org_789",
    });

    const events = await t.query(api.example.listAuditEvents, {
      organizationId: "org_789",
    });

    expect(events.events.length).toBe(1);
    expect(events.events[0].targets[0].type).toBe("document");
    expect(events.events[0].targets[0].name).toBe("My Document");
  });

  test("log permission grant tracks both granter and grantee", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logPermissionGranted, {
      granterId: "admin_1",
      granteeId: "user_2",
      permission: "read",
      resourceType: "document",
      resourceId: "doc_123",
    });

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events[0].action).toBe("permission.granted");
    expect(events.events[0].actor.id).toBe("admin_1");
    expect(events.events[0].targets.length).toBe(2);
  });

  test("statistics aggregation works correctly", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    // Create various events
    await t.mutation(api.example.logUserSignIn, {
      userId: "user_1",
      email: "user1@example.com",
    });

    await t.mutation(api.example.logUserSignIn, {
      userId: "user_2",
      email: "user2@example.com",
    });

    await t.mutation(api.example.logFailedSignIn, {
      email: "attacker@example.com",
      reason: "Brute force attempt",
    });

    const stats = await t.query(api.example.getAuditStats, {});

    expect(stats.totalEvents).toBe(3);
    expect(stats.eventsByAction["user.signed_in"]).toBe(2);
    expect(stats.eventsByAction["user.sign_in_failed"]).toBe(1);
  });

  test("get events for specific user filters correctly", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logUserSignIn, {
      userId: "target_user",
      email: "target@example.com",
    });

    await t.mutation(api.example.logUserSignIn, {
      userId: "other_user",
      email: "other@example.com",
    });

    const events = await t.query(api.example.getEventsForUser, {
      userId: "target_user",
    });

    expect(events.length).toBe(1);
    expect(events[0].actor.id).toBe("target_user");
  });

  test("custom events can have arbitrary metadata", async () => {
    const t = convexTest(schema, modules);
    auditTest.register(t);

    await t.mutation(api.example.logCustomEvent, {
      action: "payment.processed",
      actorId: "user_123",
      actorType: "user",
      targetType: "payment",
      targetId: "pay_456",
      metadata: {
        amount: 99.99,
        currency: "USD",
        method: "credit_card",
      },
    });

    const events = await t.query(api.example.listAuditEvents, {});
    expect(events.events[0].action).toBe("payment.processed");
    expect(events.events[0].metadata?.amount).toBe(99.99);
  });
});
