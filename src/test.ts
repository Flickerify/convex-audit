/// <reference types="vite/client" />
import type { TestConvex } from "convex-test";
import type { GenericSchema, SchemaDefinition } from "convex/server";
import schema from "./component/schema.js";

const modules = import.meta.glob("./component/**/*.ts");

/**
 * Register the audit log component with the test convex instance.
 *
 * @param t - The test convex instance, e.g. from calling `convexTest`.
 * @param name - The name of the component, as registered in convex.config.ts.
 *
 * @example
 * ```typescript
 * import { convexTest } from "convex-test";
 * import { test, expect } from "vitest";
 * import auditTest from "@flickeriy/convex-audit/test";
 * import schema from "./schema";
 *
 * const modules = import.meta.glob("./**\/*.ts");
 *
 * test("audit logging", async () => {
 *   const t = convexTest(schema, modules);
 *   auditTest.register(t, "convexAudit");
 *
 *   // Test your audit logging
 *   await t.mutation(api.example.logUserSignIn, {
 *     userId: "user_123",
 *     email: "test@example.com",
 *   });
 *
 *   const events = await t.query(api.example.listAuditEvents, {});
 *   expect(events.events.length).toBe(1);
 *   expect(events.events[0].action).toBe("user.signed_in");
 * });
 * ```
 */
export function register(
  t: TestConvex<SchemaDefinition<GenericSchema, boolean>>,
  name: string = "convexAudit"
) {
  t.registerComponent(name, schema, modules);
}

export default { register, schema, modules };
