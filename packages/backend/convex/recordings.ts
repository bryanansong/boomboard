import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Type for file metadata returned from the _storage system table.
 */
type FileMetadata = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

/**
 * Generate a short-lived upload URL for storing an audio file.
 * The client must POST the file to this URL, then call `create` with the storageId.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a new recording document after the client has uploaded the audio file.
 * The client provides the storageId returned from the upload URL.
 */
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the storageId exists by fetching its metadata
    const metadata: FileMetadata | null = await ctx.db.system.get(
      "_storage",
      args.storageId
    );
    if (!metadata) {
      throw new Error("Uploaded file not found in storage");
    }

    const recordingId = await ctx.db.insert("recordings", {
      userId: user._id,
      name: args.name,
      storageId: args.storageId,
      durationMs: args.durationMs,
      fileSize: metadata.size,
      mimeType: metadata.contentType ?? "audio/mpeg",
    });

    return recordingId;
  },
});

/**
 * List the authenticated user's recordings with their file URLs.
 * Returns up to 50 most recent recordings.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const recordings = await ctx.db
      .query("recordings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return Promise.all(
      recordings.map(async (recording) => ({
        ...recording,
        url: await ctx.storage.getUrl(recording.storageId),
      }))
    );
  },
});

/**
 * Get a single recording by ID with its file URL.
 * Only returns the recording if it belongs to the authenticated user.
 */
export const get = query({
  args: {
    recordingId: v.id("recordings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const recording = await ctx.db.get("recordings", args.recordingId);
    if (!recording) {
      return null;
    }

    if (recording.userId !== user._id) {
      throw new Error("Not authorized to access this recording");
    }

    const url = await ctx.storage.getUrl(recording.storageId);

    return {
      ...recording,
      url,
    };
  },
});

/**
 * Delete a recording and its associated file from storage.
 * Only the owner can delete their recordings.
 */
export const remove = mutation({
  args: {
    recordingId: v.id("recordings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const recording = await ctx.db.get("recordings", args.recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    if (recording.userId !== user._id) {
      throw new Error("Not authorized to delete this recording");
    }

    // Delete the file from storage first, then the document
    await ctx.storage.delete(recording.storageId);
    await ctx.db.delete(args.recordingId);

    return { success: true };
  },
});

/**
 * Get the file metadata (size, contentType, sha256) for a recording's stored file.
 */
export const getFileMetadata = query({
  args: {
    recordingId: v.id("recordings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const recording = await ctx.db.get("recordings", args.recordingId);
    if (!recording) {
      return null;
    }

    if (recording.userId !== user._id) {
      throw new Error("Not authorized to access this recording");
    }

    const metadata: FileMetadata | null = await ctx.db.system.get(
      "_storage",
      recording.storageId
    );

    return metadata;
  },
});

/**
 * Internal mutation to store a recording when generated from an action.
 * This is used when audio is processed or generated server-side.
 */
export const storeFromAction = internalMutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
    name: v.string(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const metadata: FileMetadata | null = await ctx.db.system.get(
      "_storage",
      args.storageId
    );

    await ctx.db.insert("recordings", {
      userId: args.userId,
      name: args.name,
      storageId: args.storageId,
      durationMs: args.durationMs,
      fileSize: metadata?.size ?? 0,
      mimeType: metadata?.contentType ?? "audio/mpeg",
    });
  },
});
