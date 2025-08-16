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

      try {
        // Use WebFetch with timeout handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        const response = await fetch(args.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URLScraper/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        
        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
        let pageTitle = titleMatch ? titleMatch[1].trim() : `Document from ${new URL(args.url).hostname}`
        
        // Decode HTML entities in title
        pageTitle = pageTitle
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        
        // Remove HTML tags and extract text content
        let cleanContent = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove scripts
          .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove styles
          .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '') // Remove noscript
          .replace(/<!--.*?-->/gis, '') // Remove comments
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        
        // Remove excessive whitespace and normalize
        cleanContent = cleanContent
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim()

        // Truncate if too long (max 50KB)
        const maxContentLength = 50 * 1024
        if (cleanContent.length > maxContentLength) {
          cleanContent = cleanContent.substring(0, maxContentLength) + '\n... [Content truncated]'
        }

        // Validate we got meaningful content
        if (!cleanContent || cleanContent.length < 50) {
          throw new Error('Unable to extract meaningful content from the webpage')
        }

        // Update document with scraped content
        await ctx.runMutation(api.documents.updateDocumentStatus, {
          id: documentId,
          processing_status: 'completed',
        })

        // Update the document with the actual content
        await ctx.runMutation(api.documents.updateDocumentContent, {
          id: documentId,
          title: pageTitle,
          content: cleanContent,
        })

        return {
          success: true,
          title: pageTitle,
          content: cleanContent,
          documentId,
        }

      } catch (scrapeError) {
        // Provide more specific error messages
        let errorMessage = 'Failed to scrape content from URL'
        
        if (scrapeError instanceof Error) {
          if (scrapeError.name === 'AbortError' || scrapeError.message.includes('aborted')) {
            errorMessage = 'Request timed out after 30 seconds'
          } else if (scrapeError.message.includes('Failed to fetch') || scrapeError.message.includes('fetch')) {
            errorMessage = 'Network error - unable to reach the URL'
          } else {
            errorMessage = scrapeError.message
          }
        }

        // Update document status to failed
        await ctx.runMutation(api.documents.updateDocumentStatus, {
          id: documentId,
          processing_status: 'failed',
          error_message: errorMessage,
        })

        return {
          success: false,
          error: errorMessage,
          title: '',
          content: '',
          documentId,
        }
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