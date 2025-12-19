import { expect, test, describe } from "vitest";

describe("Audit Log Component Setup", () => {
  test("schema exports are available", async () => {
    const schema = await import("./schema.js");

    expect(schema.default).toBeDefined();
    expect(schema.STANDARD_ACTIONS).toBeDefined();
    expect(schema.actorValidator).toBeDefined();
    expect(schema.targetValidator).toBeDefined();
    expect(schema.contextValidator).toBeDefined();
    expect(schema.auditEventValidator).toBeDefined();
  });

  test("standard actions are defined", async () => {
    const { STANDARD_ACTIONS } = await import("./schema.js");

    // Authentication events
    expect(STANDARD_ACTIONS.USER_SIGNED_IN).toBe("user.signed_in");
    expect(STANDARD_ACTIONS.USER_SIGNED_OUT).toBe("user.signed_out");
    expect(STANDARD_ACTIONS.USER_SIGN_IN_FAILED).toBe("user.sign_in_failed");
    expect(STANDARD_ACTIONS.USER_PASSWORD_CHANGED).toBe("user.password_changed");

    // User management events
    expect(STANDARD_ACTIONS.USER_CREATED).toBe("user.created");
    expect(STANDARD_ACTIONS.USER_UPDATED).toBe("user.updated");
    expect(STANDARD_ACTIONS.USER_DELETED).toBe("user.deleted");

    // Organization events
    expect(STANDARD_ACTIONS.ORGANIZATION_CREATED).toBe("organization.created");
    expect(STANDARD_ACTIONS.MEMBER_ADDED).toBe("member.added");
    expect(STANDARD_ACTIONS.MEMBER_REMOVED).toBe("member.removed");

    // Resource events
    expect(STANDARD_ACTIONS.RESOURCE_CREATED).toBe("resource.created");
    expect(STANDARD_ACTIONS.RESOURCE_UPDATED).toBe("resource.updated");
    expect(STANDARD_ACTIONS.RESOURCE_DELETED).toBe("resource.deleted");

    // Security events
    expect(STANDARD_ACTIONS.ACCESS_DENIED).toBe("access.denied");
    expect(STANDARD_ACTIONS.PERMISSION_GRANTED).toBe("permission.granted");
    expect(STANDARD_ACTIONS.API_KEY_CREATED).toBe("api_key.created");
  });

  test("lib exports are available", async () => {
    const lib = await import("./lib.js");

    // Public functions
    expect(lib.log).toBeDefined();
    expect(lib.logBatch).toBeDefined();
    expect(lib.get).toBeDefined();
    expect(lib.list).toBeDefined();
    expect(lib.search).toBeDefined();
    expect(lib.listByActor).toBeDefined();
    expect(lib.listByAction).toBeDefined();
    expect(lib.getStats).toBeDefined();

    // Internal functions
    expect(lib.getEvent).toBeDefined();
    expect(lib.deleteOldEvents).toBeDefined();
    expect(lib.updateEvent).toBeDefined();
  });
});
