import { defineApp } from "convex/server";
import convexAudit from "@flickeriy/convex-audit/convex.config.js";

const app = defineApp();
app.use(convexAudit);

export default app;
