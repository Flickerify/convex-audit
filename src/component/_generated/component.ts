/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { eventId: string },
        null | {
          _creationTime: number;
          _id: string;
          action: string;
          actor: {
            email?: string;
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: "user" | "system" | "api_key" | "service";
          };
          context?: {
            geoLocation?: {
              city?: string;
              country?: string;
              countryCode?: string;
              latitude?: number;
              longitude?: number;
              region?: string;
            };
            location?: string;
            requestId?: string;
            sessionId?: string;
            userAgent?: string;
          };
          error?: { code?: string; message?: string };
          idempotencyKey?: string;
          metadata?: Record<string, any>;
          occurredAt: number;
          organizationId?: string;
          result?: "success" | "failure" | "pending";
          tags?: Array<string>;
          targets: Array<{
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: string;
          }>;
          version?: number;
        },
        Name
      >;
      getStats: FunctionReference<
        "query",
        "internal",
        { endTime?: number; organizationId?: string; startTime?: number },
        {
          eventsByAction: Record<string, number>;
          eventsByActorType: Record<string, number>;
          eventsByResult: Record<string, number>;
          totalEvents: number;
        },
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          action?: string;
          actorId?: string;
          actorType?: string;
          cursor?: string;
          endTime?: number;
          limit?: number;
          organizationId?: string;
          startTime?: number;
        },
        {
          events: Array<{
            _creationTime: number;
            _id: string;
            action: string;
            actor: {
              email?: string;
              id: string;
              metadata?: Record<string, any>;
              name?: string;
              type: "user" | "system" | "api_key" | "service";
            };
            context?: {
              geoLocation?: {
                city?: string;
                country?: string;
                countryCode?: string;
                latitude?: number;
                longitude?: number;
                region?: string;
              };
              location?: string;
              requestId?: string;
              sessionId?: string;
              userAgent?: string;
            };
            error?: { code?: string; message?: string };
            idempotencyKey?: string;
            metadata?: Record<string, any>;
            occurredAt: number;
            organizationId?: string;
            result?: "success" | "failure" | "pending";
            tags?: Array<string>;
            targets: Array<{
              id: string;
              metadata?: Record<string, any>;
              name?: string;
              type: string;
            }>;
            version?: number;
          }>;
          hasMore: boolean;
          nextCursor: null | string;
        },
        Name
      >;
      listByAction: FunctionReference<
        "query",
        "internal",
        {
          action: string;
          endTime?: number;
          limit?: number;
          organizationId?: string;
          startTime?: number;
        },
        Array<{
          _creationTime: number;
          _id: string;
          action: string;
          actor: {
            email?: string;
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: "user" | "system" | "api_key" | "service";
          };
          context?: {
            geoLocation?: {
              city?: string;
              country?: string;
              countryCode?: string;
              latitude?: number;
              longitude?: number;
              region?: string;
            };
            location?: string;
            requestId?: string;
            sessionId?: string;
            userAgent?: string;
          };
          error?: { code?: string; message?: string };
          idempotencyKey?: string;
          metadata?: Record<string, any>;
          occurredAt: number;
          organizationId?: string;
          result?: "success" | "failure" | "pending";
          tags?: Array<string>;
          targets: Array<{
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: string;
          }>;
          version?: number;
        }>,
        Name
      >;
      listByActor: FunctionReference<
        "query",
        "internal",
        {
          actorId: string;
          actorType: string;
          endTime?: number;
          limit?: number;
          startTime?: number;
        },
        Array<{
          _creationTime: number;
          _id: string;
          action: string;
          actor: {
            email?: string;
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: "user" | "system" | "api_key" | "service";
          };
          context?: {
            geoLocation?: {
              city?: string;
              country?: string;
              countryCode?: string;
              latitude?: number;
              longitude?: number;
              region?: string;
            };
            location?: string;
            requestId?: string;
            sessionId?: string;
            userAgent?: string;
          };
          error?: { code?: string; message?: string };
          idempotencyKey?: string;
          metadata?: Record<string, any>;
          occurredAt: number;
          organizationId?: string;
          result?: "success" | "failure" | "pending";
          tags?: Array<string>;
          targets: Array<{
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: string;
          }>;
          version?: number;
        }>,
        Name
      >;
      log: FunctionReference<
        "mutation",
        "internal",
        {
          action: string;
          actor: {
            email?: string;
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: "user" | "system" | "api_key" | "service";
          };
          context?: {
            geoLocation?: {
              city?: string;
              country?: string;
              countryCode?: string;
              latitude?: number;
              longitude?: number;
              region?: string;
            };
            location?: string;
            requestId?: string;
            sessionId?: string;
            userAgent?: string;
          };
          error?: { code?: string; message?: string };
          idempotencyKey?: string;
          metadata?: Record<string, any>;
          occurredAt?: number;
          organizationId?: string;
          result?: "success" | "failure" | "pending";
          tags?: Array<string>;
          targets: Array<{
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: string;
          }>;
          version?: number;
        },
        { created: boolean; eventId: string },
        Name
      >;
      logBatch: FunctionReference<
        "mutation",
        "internal",
        {
          events: Array<{
            action: string;
            actor: {
              email?: string;
              id: string;
              metadata?: Record<string, any>;
              name?: string;
              type: "user" | "system" | "api_key" | "service";
            };
            context?: {
              geoLocation?: {
                city?: string;
                country?: string;
                countryCode?: string;
                latitude?: number;
                longitude?: number;
                region?: string;
              };
              location?: string;
              requestId?: string;
              sessionId?: string;
              userAgent?: string;
            };
            error?: { code?: string; message?: string };
            idempotencyKey?: string;
            metadata?: Record<string, any>;
            occurredAt?: number;
            organizationId?: string;
            result?: "success" | "failure" | "pending";
            tags?: Array<string>;
            targets: Array<{
              id: string;
              metadata?: Record<string, any>;
              name?: string;
              type: string;
            }>;
            version?: number;
          }>;
        },
        Array<{ created: boolean; eventId: string }>,
        Name
      >;
      search: FunctionReference<
        "query",
        "internal",
        {
          actorId?: string;
          limit?: number;
          organizationId?: string;
          searchQuery: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          action: string;
          actor: {
            email?: string;
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: "user" | "system" | "api_key" | "service";
          };
          context?: {
            geoLocation?: {
              city?: string;
              country?: string;
              countryCode?: string;
              latitude?: number;
              longitude?: number;
              region?: string;
            };
            location?: string;
            requestId?: string;
            sessionId?: string;
            userAgent?: string;
          };
          error?: { code?: string; message?: string };
          idempotencyKey?: string;
          metadata?: Record<string, any>;
          occurredAt: number;
          organizationId?: string;
          result?: "success" | "failure" | "pending";
          tags?: Array<string>;
          targets: Array<{
            id: string;
            metadata?: Record<string, any>;
            name?: string;
            type: string;
          }>;
          version?: number;
        }>,
        Name
      >;
    };
  };
