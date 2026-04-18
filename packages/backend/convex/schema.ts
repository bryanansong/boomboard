import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    createdAt: v.float64(),
    email: v.string(),
    emailVerified: v.boolean(),
    familyName: v.string(),
    givenName: v.string(),
    lastLogin: v.float64(),
    name: v.string(),
    picture: v.string(),
    role: v.string(),
    tokenIdentifier: v.string(),
    updatedAt: v.float64(),
  }),
});