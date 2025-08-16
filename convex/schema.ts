import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index('by_created_at', ['createdAt']),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  notes: defineTable({
    title: v.string(),
    content: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId'])
    .index('by_created_at', ['createdAt']),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    source_type: v.union(v.literal('file'), v.literal('url')),
    source_url: v.optional(v.string()),
    file_size: v.optional(v.number()),
    processing_status: v.union(
      v.literal('uploading'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    upload_timestamp: v.number(),
    processed_timestamp: v.optional(v.number()),
    error_message: v.optional(v.string()),
  }).index('by_upload_timestamp', ['upload_timestamp'])
    .index('by_status', ['processing_status']),
})