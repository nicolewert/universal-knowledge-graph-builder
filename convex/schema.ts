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

  concepts: defineTable({
    name: v.string(),
    description: v.string(),
    document_ids: v.array(v.id('documents')),
    confidence_score: v.number(),
    category: v.optional(v.string()),
    aliases: v.array(v.string()),
    created_timestamp: v.number(),
  }).index('by_name', ['name'])
    .index('by_created_timestamp', ['created_timestamp'])
    .index('by_confidence', ['confidence_score']),

  relationships: defineTable({
    source_concept_id: v.id('concepts'),
    target_concept_id: v.id('concepts'),
    relationship_type: v.string(),
    strength: v.number(),
    context: v.string(),
    document_id: v.id('documents'),
    created_timestamp: v.number(),
  }).index('by_source', ['source_concept_id'])
    .index('by_target', ['target_concept_id'])
    .index('by_document', ['document_id'])
    .index('by_strength', ['strength'])
    .index('by_source_target', ['source_concept_id', 'target_concept_id']),

  deduplication_locks: defineTable({
    process_id: v.string(),
    operation_type: v.string(), // 'deduplication' | 'merge'
    status: v.union(v.literal('active'), v.literal('completed'), v.literal('failed')),
    created_timestamp: v.number(),
    completed_timestamp: v.optional(v.number()),
    document_id: v.optional(v.id('documents')), // For document-specific locks
    error_message: v.optional(v.string()),
    concepts_processed: v.optional(v.number()),
  }).index('by_status', ['status'])
    .index('by_operation', ['operation_type', 'status'])
    .index('by_created', ['created_timestamp']),

  chat_sessions: defineTable({
    user_id: v.id('users'),
    title: v.string(),
    created_timestamp: v.number(),
    last_message_timestamp: v.number(),
  }).index('by_user', ['user_id'])
    .index('by_created', ['created_timestamp'])
    .index('by_last_message', ['last_message_timestamp']),

  chat_messages: defineTable({
    session_id: v.id('chat_sessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
    context_concepts: v.optional(v.array(v.id('concepts'))),
    context_documents: v.optional(v.array(v.id('documents'))),
  }).index('by_session', ['session_id'])
    .index('by_timestamp', ['timestamp'])
    .index('by_session_timestamp', ['session_id', 'timestamp']),
})