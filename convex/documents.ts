import { mutation, query, action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    source_type: v.union(v.literal('file'), v.literal('url')),
    source_url: v.optional(v.string()),
    file_size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert('documents', {
      title: args.title,
      content: args.content,
      source_type: args.source_type,
      source_url: args.source_url,
      file_size: args.file_size,
      processing_status: 'completed',
      upload_timestamp: now,
      processed_timestamp: now,
    })
  },
})

export const updateDocumentStatus = mutation({
  args: {
    id: v.id('documents'),
    processing_status: v.union(
      v.literal('uploading'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      processing_status: args.processing_status,
    }
    
    if (args.processing_status === 'completed' || args.processing_status === 'failed') {
      updates.processed_timestamp = Date.now()
    }
    
    if (args.error_message) {
      updates.error_message = args.error_message
    }
    
    return await ctx.db.patch(args.id, updates)
  },
})

export const updateDocumentContent = mutation({
  args: {
    id: v.id('documents'),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
    })
  },
})

export const getDocuments = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('documents')
      .withIndex('by_upload_timestamp')
      .order('desc')
      .collect()
  },
})

export const getDocumentById = query({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const scrapeUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<{
    success: boolean;
    title: string;
    content: string;
    error?: string;
    documentId?: any;
  }> => {
    try {
      // Validate URL format
      const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
      if (!urlRegex.test(args.url)) {
        return {
          success: false,
          error: 'Invalid URL format',
          title: '',
          content: '',
        }
      }

      // Create document with processing status
      const documentId: any = await ctx.runMutation(api.documents.createDocument, {
        title: 'Processing...',
        content: '',
        source_type: 'url',
        source_url: args.url,
      })

      // Update status to processing
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        id: documentId,
        processing_status: 'processing',
      })

      // Simulate content extraction (replace with actual Playwright scraping)
      const title = `Document from ${new URL(args.url).hostname}`
      const content = `Content scraped from ${args.url}\n\nThis is placeholder content. In a real implementation, this would use Playwright MCP to extract actual content from the webpage.`

      // Update document with scraped content
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        id: documentId,
        processing_status: 'completed',
      })

      // Update the document with the actual content and completed status
      await ctx.runMutation(api.documents.updateDocumentContent, {
        id: documentId,
        title,
        content,
      })

      return {
        success: true,
        title,
        content,
        documentId,
      }
    } catch (error) {
      console.error('URL scraping error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URL',
        title: '',
        content: '',
      }
    }
  },
})