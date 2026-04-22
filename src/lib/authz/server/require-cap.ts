import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import type { Capability, Principal, Resource } from "@/lib/authz/types";
import { can } from "@/lib/authz/engine";
import { loadPrincipal } from "./principal-loader";
import { auditDenial } from "./audit";

type RouteHandler<Ctx> = (
  req: NextRequest,
  ctx: Ctx,
  principal: Principal,
) => Promise<Response> | Response;

type ResourceResolver<Ctx> = (
  req: NextRequest,
  ctx: Ctx,
) => Promise<Resource | undefined> | Resource | undefined;

/**
 * Wraps a Next.js route handler with a capability gate.
 *
 *   export const POST = requireCap(C.listings.create)(async (req, ctx, p) => {...})
 *
 * For ownership-gated routes, pass a `getResource` resolver as the second arg.
 * The resolver's output is handed to the engine for the `ownsResource` check.
 */
export function requireCap<Ctx = unknown>(
  capability: Capability,
  getResource?: ResourceResolver<Ctx>,
) {
  return (handler: RouteHandler<Ctx>) => {
    return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
      const principal = await loadPrincipal();
      const resource = getResource ? await getResource(req, ctx) : undefined;
      const decision = can(principal, capability, resource);

      if (!decision.allowed) {
        await auditDenial({
          principal_id: principal?.id ?? null,
          capability,
          resource_type: resource?.type ?? null,
          resource_id: resource?.id ?? null,
          reason: decision.reason,
          request_path: req.nextUrl.pathname,
        });
        return NextResponse.json(
          { error: decision.reason },
          { status: principal ? 403 : 401 },
        );
      }

      return handler(req, ctx, principal!);
    };
  };
}
