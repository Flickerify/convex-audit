import { httpRouter } from "convex/server";
import { registerAuditRoutes } from "@flickeriy/convex-audit";
import { components } from "./_generated/api";

const http = httpRouter();

// Register audit log HTTP routes
// This exposes endpoints like:
// - GET /audit/events - List recent events
// - GET /audit/event?id=xxx - Get a single event
// - GET /audit/stats - Get audit statistics
// - GET /audit/search?q=xxx - Search events
registerAuditRoutes(http, components.convexAudit, {
  pathPrefix: "/audit",
});

export default http;
