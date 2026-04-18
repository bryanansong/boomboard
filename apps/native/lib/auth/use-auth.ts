/**
 * Unified authentication hook.
 * Single source of truth that syncs Clerk and Convex states.
 */

import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useConvexAuth, useQuery } from "convex/react";

import { api } from "@boomboard/backend/convex/_generated/api";

import type { AuthState, AuthUser } from "./auth-types";
import { UserRole } from "./auth-types";

/**
 * Maps Convex user document to AuthUser interface.
 */
function mapToAuthUser(
  convexUser: NonNullable<
    ReturnType<typeof useQuery<typeof api.users.current>>
  >,
): AuthUser {
  return {
    id: convexUser._id,
    email: convexUser.email ?? undefined,
    name: convexUser.name ?? undefined,
    picture: convexUser.picture ?? undefined,
    role: (convexUser.role as UserRole) ?? UserRole.USER,
  };
}

/**
 * Unified auth hook that syncs Clerk and Convex states.
 * Returns complete user context - consumers destructure what they need.
 */
export function useAuth(): AuthState {
  const clerk = useClerkAuth();
  const convex = useConvexAuth();
  const convexUser = useQuery(api.users.current);

  // Wait for both providers to be ready
  if (!clerk.isLoaded || convex.isLoading) {
    return { status: "loading", user: null };
  }

  // Both must agree on authentication state
  const isAuthenticated = clerk.isSignedIn && convex.isAuthenticated;

  if (!isAuthenticated) {
    return { status: "unauthenticated", user: null };
  }

  // User is authenticated - return with user data if available
  return {
    status: "authenticated",
    user: convexUser ? mapToAuthUser(convexUser) : null,
  };
}
