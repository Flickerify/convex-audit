import "./App.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

// Helper to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

// Helper to get action icon
function getActionIcon(action: string): string {
  const category = action.split(".")[0];
  const icons: Record<string, string> = {
    user: "👤",
    organization: "🏢",
    member: "👥",
    resource: "📄",
    access: "🔒",
    permission: "🔑",
    security: "🛡️",
    custom: "⚡",
  };
  return icons[category] ?? "📝";
}

// Helper to get result color
function getResultColor(result?: string): string {
  switch (result) {
    case "success":
      return "#22c55e";
    case "failure":
      return "#ef4444";
    case "pending":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

function AuditEventsList() {
  const result = useQuery(api.example.listAuditEvents, {});
  const events = result?.events ?? [];

  return (
    <div
      style={{
        marginTop: "1.5rem",
        padding: "1rem",
        border: "1px solid rgba(128, 128, 128, 0.3)",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
        📋 Audit Log ({events.length} events)
      </h3>
      {events.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No events yet. Use the buttons above to generate some!
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {events.map((event) => (
            <li
              key={event._id}
              style={{
                marginBottom: "0.75rem",
                padding: "0.75rem",
                backgroundColor: "rgba(128, 128, 128, 0.1)",
                borderRadius: "8px",
                borderLeft: `4px solid ${getResultColor(event.result)}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>
                    {getActionIcon(event.action)}
                  </span>
                  <strong>{event.action}</strong>
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      padding: "0.125rem 0.5rem",
                      backgroundColor: getResultColor(event.result),
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {event.result ?? "success"}
                  </span>
                </div>
                <span style={{ color: "#888", fontSize: "0.8rem" }}>
                  {formatRelativeTime(event.occurredAt)}
                </span>
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                <strong>Actor:</strong> {event.actor.type} ({event.actor.id})
                {event.actor.email && ` - ${event.actor.email}`}
              </div>
              {event.targets.length > 0 && (
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  <strong>Targets:</strong>{" "}
                  {event.targets
                    .map(
                      (t) => `${t.type}:${t.id}${t.name ? ` (${t.name})` : ""}`,
                    )
                    .join(", ")}
                </div>
              )}
              {event.error && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#ef4444",
                    marginTop: "0.25rem",
                  }}
                >
                  <strong>Error:</strong> {event.error.message}
                </div>
              )}
              {event.context?.location && (
                <div style={{ fontSize: "0.8rem", color: "#888" }}>
                  📍 {event.context.location}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AuditStats() {
  const stats = useQuery(api.example.getAuditStats, {});

  if (!stats) return null;

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderRadius: "8px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
          {stats.totalEvents}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>Total Events</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#22c55e" }}>
          {stats.eventsByResult?.success ?? 0}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>Successful</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>
          {stats.eventsByResult?.failure ?? 0}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>Failed</div>
      </div>
    </div>
  );
}

function App() {
  const [userId] = useState(`user_${crypto.randomUUID()}`);
  const [email] = useState(`demo@example.com`);

  const logUserSignIn = useMutation(api.example.logUserSignIn);
  const logFailedSignIn = useMutation(api.example.logFailedSignIn);
  const logResourceCreated = useMutation(api.example.logResourceCreated);
  const logPermissionGranted = useMutation(api.example.logPermissionGranted);
  const logCustomEvent = useMutation(api.example.logCustomEvent);

  const handleSignIn = async () => {
    await logUserSignIn({
      userId,
      email,
      ipAddress: "192.168.1.100",
      userAgent: navigator.userAgent,
    });
  };

  const handleFailedSignIn = async () => {
    await logFailedSignIn({
      email: "hacker@evil.com",
      reason: "Invalid password - too many attempts",
      ipAddress: "10.0.0.1",
    });
  };

  const handleResourceCreated = async () => {
    const docId = `doc_${Math.random().toString(36).slice(2, 8)}`;
    await logResourceCreated({
      userId,
      resourceType: "document",
      resourceId: docId,
      resourceName: "My New Document",
      organizationId: "org_demo",
    });
  };

  const handlePermissionGranted = async () => {
    await logPermissionGranted({
      granterId: userId,
      granteeId: `user_${Math.random().toString(36).slice(2, 8)}`,
      permission: "read",
      resourceType: "document",
      resourceId: "doc_123",
    });
  };

  const handleCustomEvent = async () => {
    await logCustomEvent({
      action: "custom.payment_processed",
      actorId: userId,
      actorType: "user",
      targetType: "payment",
      targetId: `pay_${Math.random().toString(36).slice(2, 8)}`,
      metadata: {
        amount: 99.99,
        currency: "USD",
        method: "credit_card",
      },
    });
  };

  // Construct the HTTP endpoint URL
  const convexUrl = import.meta.env.VITE_CONVEX_URL.replace(".cloud", ".site");

  return (
    <>
      <h1>🔍 Convex Audit Log Demo</h1>

      <div className="card">
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Your session: <code>{userId}</code>
        </p>

        <h3>Generate Audit Events</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={handleSignIn}
            style={{ backgroundColor: "#22c55e", color: "white" }}
          >
            👤 User Sign In
          </button>
          <button
            onClick={handleFailedSignIn}
            style={{ backgroundColor: "#ef4444", color: "white" }}
          >
            ❌ Failed Sign In
          </button>
          <button
            onClick={handleResourceCreated}
            style={{ backgroundColor: "#3b82f6", color: "white" }}
          >
            📄 Create Resource
          </button>
          <button
            onClick={handlePermissionGranted}
            style={{ backgroundColor: "#8b5cf6", color: "white" }}
          >
            🔑 Grant Permission
          </button>
          <button
            onClick={handleCustomEvent}
            style={{ backgroundColor: "#f59e0b", color: "white" }}
          >
            ⚡ Custom Event
          </button>
        </div>

        <AuditStats />
        <AuditEventsList />

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "rgba(128, 128, 128, 0.1)",
            borderRadius: "8px",
          }}
        >
          <h3>HTTP Endpoints</h3>
          <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            The component exposes HTTP endpoints for external integrations:
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexDirection: "column",
            }}
          >
            <a
              href={`${convexUrl}/audit/events`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              📋 GET /audit/events - List all events
            </a>
            <a
              href={`${convexUrl}/audit/stats`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              📊 GET /audit/stats - Get statistics
            </a>
            <a
              href={`${convexUrl}/audit/search?q=user`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              🔍 GET /audit/search?q=user - Search events
            </a>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
            See <code>example/convex/http.ts</code> for the HTTP route
            configuration
          </p>
        </div>

        <p style={{ marginTop: "1rem" }}>
          See <code>example/convex/example.ts</code> for all the ways to use
          this component
        </p>
      </div>
    </>
  );
}

export default App;
