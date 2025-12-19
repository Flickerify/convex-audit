/**
 * React hooks for the Convex Audit Log component
 *
 * @example
 * ```tsx
 * import { useAuditEvents, useAuditStats } from "@flickeriy/convex-audit/react";
 * import { api } from "../convex/_generated/api";
 *
 * function AuditLogPage() {
 *   const { events, hasMore, loadMore, isLoading } = useAuditEvents(
 *     api.example.list,
 *     { organizationId: "org_123" }
 *   );
 *
 *   const stats = useAuditStats(api.example.getStats, {
 *     organizationId: "org_123",
 *   });
 *
 *   return (
 *     <div>
 *       <h1>Audit Log</h1>
 *       {stats && (
 *         <div>
 *           <p>Total Events: {stats.totalEvents}</p>
 *         </div>
 *       )}
 *       <ul>
 *         {events.map((event) => (
 *           <li key={event._id}>
 *             {event.action} by {event.actor.id}
 *           </li>
 *         ))}
 *       </ul>
 *       {hasMore && (
 *         <button onClick={loadMore} disabled={isLoading}>
 *           Load More
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

// =============================================================================
// Types
// =============================================================================

export interface AuditEvent {
  _id: string;
  _creationTime: number;
  action: string;
  occurredAt: number;
  actor: {
    type: "user" | "system" | "api_key" | "service";
    id: string;
    name?: string;
    email?: string;
    metadata?: Record<string, any>;
  };
  targets: Array<{
    type: string;
    id: string;
    name?: string;
    metadata?: Record<string, any>;
  }>;
  context?: {
    location?: string;
    userAgent?: string;
    geoLocation?: {
      city?: string;
      country?: string;
      countryCode?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
    };
    requestId?: string;
    sessionId?: string;
  };
  metadata?: Record<string, any>;
  organizationId?: string;
  result?: "success" | "failure" | "pending";
  error?: {
    code?: string;
    message?: string;
  };
  tags?: string[];
  version?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByActorType: Record<string, number>;
  eventsByResult: Record<string, number>;
}

export interface ListResponse {
  events: AuditEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook for listing audit events with pagination
 *
 * @param listFn - The list function reference (e.g., api.example.list)
 * @param args - Arguments for the list function
 * @returns Object with events, loading state, and pagination controls
 */
export function useAuditEvents<
  ListFn extends FunctionReference<"query", "public", any, ListResponse>
>(
  listFn: ListFn,
  args: Omit<FunctionArgs<ListFn>, "cursor">
) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const result = useQuery(listFn, { ...args, cursor } as FunctionArgs<ListFn>);

  const loadMore = useCallback(() => {
    if (result?.nextCursor) {
      setCursor(result.nextCursor);
    }
  }, [result?.nextCursor]);

  const reset = useCallback(() => {
    setCursor(undefined);
  }, []);

  return {
    events: result?.events ?? [],
    hasMore: result?.hasMore ?? false,
    nextCursor: result?.nextCursor ?? null,
    isLoading: result === undefined,
    loadMore,
    reset,
  };
}

/**
 * Hook for getting audit statistics
 *
 * @param statsFn - The stats function reference (e.g., api.example.getStats)
 * @param args - Arguments for the stats function
 * @returns Audit statistics or undefined if loading
 */
export function useAuditStats<
  StatsFn extends FunctionReference<"query", "public", any, AuditStats>
>(
  statsFn: StatsFn,
  args: FunctionArgs<StatsFn>
): AuditStats | undefined {
  return useQuery(statsFn, args);
}

/**
 * Hook for searching audit events
 *
 * @param searchFn - The search function reference (e.g., api.example.search)
 * @param searchQuery - The search query string
 * @param args - Additional arguments for the search function
 * @returns Array of matching events or undefined if loading
 */
export function useAuditSearch<
  SearchFn extends FunctionReference<"query", "public", any, AuditEvent[]>
>(
  searchFn: SearchFn,
  args: FunctionArgs<SearchFn>
): AuditEvent[] | undefined {
  return useQuery(searchFn, args);
}

/**
 * Hook for getting a single audit event
 *
 * @param getFn - The get function reference (e.g., api.example.get)
 * @param eventId - The ID of the event to get
 * @returns The audit event or null/undefined
 */
export function useAuditEvent<
  GetFn extends FunctionReference<"query", "public", any, AuditEvent | null>
>(
  getFn: GetFn,
  eventId: string
): AuditEvent | null | undefined {
  return useQuery(getFn, { eventId } as FunctionArgs<GetFn>);
}

/**
 * Hook for logging audit events
 *
 * @param logFn - The log mutation function reference (e.g., api.example.log)
 * @returns A function to log audit events
 */
export function useLogAuditEvent<
  LogFn extends FunctionReference<
    "mutation",
    "public",
    any,
    { eventId: string; created: boolean }
  >
>(logFn: LogFn) {
  return useMutation(logFn);
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format an audit event action for display
 *
 * @param action - The action string (e.g., "user.signed_in")
 * @returns Formatted action string (e.g., "User Signed In")
 */
export function formatAction(action: string): string {
  return action
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" - ");
}

/**
 * Format a timestamp for display
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatTimestamp(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

/**
 * Format a relative time (e.g., "2 hours ago")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/**
 * Get an icon/emoji for an action type
 *
 * @param action - The action string
 * @returns An emoji representing the action
 */
export function getActionIcon(action: string): string {
  const category = action.split(".")[0];

  const icons: Record<string, string> = {
    user: "👤",
    organization: "🏢",
    member: "👥",
    invitation: "✉️",
    resource: "📄",
    access: "🔒",
    permission: "🔑",
    api_key: "🔐",
    security: "🛡️",
    settings: "⚙️",
    notification: "🔔",
    billing: "💳",
    subscription: "📋",
  };

  return icons[category] ?? "📝";
}

/**
 * Get a color for an event result
 *
 * @param result - The event result
 * @returns A CSS color string
 */
export function getResultColor(result?: "success" | "failure" | "pending"): string {
  switch (result) {
    case "success":
      return "#22c55e"; // green
    case "failure":
      return "#ef4444"; // red
    case "pending":
      return "#f59e0b"; // amber
    default:
      return "#6b7280"; // gray
  }
}
