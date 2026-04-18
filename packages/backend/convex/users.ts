import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the currently authenticated user from the database.
 * Returns null if not authenticated or user not found.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    return user;
  },
});

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    const userData = {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      picture: identity.pictureUrl,
      givenName: identity.givenName,
      familyName: identity.familyName,
      emailVerified: identity.emailVerified,
      nickname: identity.nickname,
      updatedAt: Date.now(),
      // Store the full identity object for completeness as requested
      // We generally flatten relevant fields but storing raw logic helps rapid prototyping
      raw: identity, 
    };

    if (user !== null) {
      // Update existing user
      await ctx.db.patch(user._id, {
        ...userData,
        lastLogin: Date.now(),
      });
      return user._id;
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      ...userData,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      role: 'user', // Default role
    });

    return newUserId;
  },
});
