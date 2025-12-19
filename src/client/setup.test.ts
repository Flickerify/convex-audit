import { expect, test, describe } from "vitest";

describe("Audit Log Client Setup", () => {
  test("exports are available", async () => {
    const client = await import("./index.js");

    // Check class export
    expect(client.AuditLog).toBeDefined();

    // Check helper functions
    expect(client.logAuditEvent).toBeDefined();
    expect(client.logAuditEventBatch).toBeDefined();
    expect(client.getAuditEvent).toBeDefined();
    expect(client.listAuditEvents).toBeDefined();
    expect(client.searchAuditEvents).toBeDefined();
    expect(client.getAuditStats).toBeDefined();

    // Check exposeAuditApi
    expect(client.exposeAuditApi).toBeDefined();

    // Check HTTP routes
    expect(client.registerAuditRoutes).toBeDefined();

    // Check standard actions
    expect(client.STANDARD_ACTIONS).toBeDefined();
    expect(client.STANDARD_ACTIONS.USER_SIGNED_IN).toBe("user.signed_in");
    expect(client.STANDARD_ACTIONS.USER_SIGNED_OUT).toBe("user.signed_out");
    expect(client.STANDARD_ACTIONS.RESOURCE_CREATED).toBe("resource.created");

    // Check validators
    expect(client.actorValidator).toBeDefined();
    expect(client.targetValidator).toBeDefined();
    expect(client.contextValidator).toBeDefined();
  });
});
