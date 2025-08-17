import { query, mutation, action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

// Queries
export const getChatSessions = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('chat_sessions')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .collect()
    
    return sessions
  },
})

export const getChatMessages = query({
  args: { sessionId: v.id('chat_sessions') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('chat_messages')
      .withIndex('by_session_timestamp', (q) => q.eq('session_id', args.sessionId))
      .order('asc')
      .collect()
    
    // Enrich messages with context data
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        let contextConcepts = null
        let contextDocuments = null
        
        if (message.context_concepts) {
          contextConcepts = await Promise.all(
            message.context_concepts.map(async (conceptId) => {
              return await ctx.db.get(conceptId)
            })
          )
        }
        
        if (message.context_documents) {
          contextDocuments = await Promise.all(
            message.context_documents.map(async (docId) => {
              return await ctx.db.get(docId)
            })
          )
        }
        
        return {
          ...message,
          contextConcepts: contextConcepts?.filter(Boolean),
          contextDocuments: contextDocuments?.filter(Boolean),
        }
      })
    )
    
    return enrichedMessages
  },
})

// Mutations
export const createChatSession = mutation({
  args: { 
    user_id: v.id('users'), 
    title: v.string() 
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.title || typeof args.title !== 'string') {
      throw new Error('Session title is required and must be a string')
    }
    
    const sanitizedTitle = args.title.trim()
    if (sanitizedTitle.length === 0) {
      throw new Error('Session title cannot be empty')
    }
    
    if (sanitizedTitle.length > 500) {
      throw new Error('Session title is too long (maximum 500 characters)')
    }
    
    // Verify user exists
    const user = await ctx.db.get(args.user_id)
    if (!user) {
      throw new Error('User not found')
    }
    
    const now = Date.now()
    
    const sessionId = await ctx.db.insert('chat_sessions', {
      user_id: args.user_id,
      title: sanitizedTitle,
      created_timestamp: now,
      last_message_timestamp: now,
    })
    
    return sessionId
  },
})

export const addChatMessage = mutation({
  args: {
    session_id: v.id('chat_sessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    context_concepts: v.optional(v.array(v.id('concepts'))),
    context_documents: v.optional(v.array(v.id('documents'))),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.content || typeof args.content !== 'string') {
      throw new Error('Message content is required and must be a string')
    }
    
    // Sanitize and validate content
    const sanitizedContent = args.content.trim()
    if (sanitizedContent.length === 0) {
      throw new Error('Message content cannot be empty')
    }
    
    if (sanitizedContent.length > 50000) {
      throw new Error('Message content is too long (maximum 50,000 characters)')
    }
    
    // Verify session exists
    const session = await ctx.db.get(args.session_id)
    if (!session) {
      throw new Error('Chat session not found')
    }
    
    const now = Date.now()
    
    // Insert the message
    const messageId = await ctx.db.insert('chat_messages', {
      session_id: args.session_id,
      role: args.role,
      content: sanitizedContent,
      timestamp: now,
      context_concepts: args.context_concepts,
      context_documents: args.context_documents,
    })
    
    // Update session's last message timestamp
    await ctx.db.patch(args.session_id, {
      last_message_timestamp: now,
    })
    
    return messageId
  },
})

export const updateSessionTitle = mutation({
  args: {
    session_id: v.id('chat_sessions'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.title || typeof args.title !== 'string') {
      throw new Error('Session title is required and must be a string')
    }
    
    const sanitizedTitle = args.title.trim()
    if (sanitizedTitle.length === 0) {
      throw new Error('Session title cannot be empty')
    }
    
    if (sanitizedTitle.length > 500) {
      throw new Error('Session title is too long (maximum 500 characters)')
    }
    
    // Verify session exists
    const session = await ctx.db.get(args.session_id)
    if (!session) {
      throw new Error('Chat session not found')
    }
    
    await ctx.db.patch(args.session_id, {
      title: sanitizedTitle,
    })
  },
})

export const deleteSession = mutation({
  args: { session_id: v.id('chat_sessions') },
  handler: async (ctx, args) => {
    // Delete all messages in the session
    const messages = await ctx.db
      .query('chat_messages')
      .withIndex('by_session', (q) => q.eq('session_id', args.session_id))
      .collect()
    
    await Promise.all(
      messages.map((message) => ctx.db.delete(message._id))
    )
    
    // Delete the session
    await ctx.db.delete(args.session_id)
  },
})

// Actions
export const generateAnswer = action({
  args: {
    question: v.string(),
    session_id: v.id('chat_sessions'),
  },
  handler: async (ctx, args) => {
    try {
      // Input validation
      if (!args.question || typeof args.question !== 'string') {
        throw new Error('Question is required and must be a string')
      }
      
      const sanitizedQuestion = args.question.trim()
      if (sanitizedQuestion.length === 0) {
        throw new Error('Question cannot be empty')
      }
      
      if (sanitizedQuestion.length > 10000) {
        throw new Error('Question is too long (maximum 10,000 characters)')
      }
      
      // Check rate limiting
      if (!checkRateLimit(args.session_id, 10, 60000)) {
        const errorMessage = 'You\'re sending messages too quickly. Please wait a moment before sending another message.'
        await ctx.runMutation(api.chat.addChatMessage, {
          session_id: args.session_id,
          role: 'assistant',
          content: errorMessage,
        })
        return { success: false, error: errorMessage }
      }
      
      // First, add user message
      await ctx.runMutation(api.chat.addChatMessage, {
        session_id: args.session_id,
        role: 'user',
        content: sanitizedQuestion,
      })
      
      // Get relevant context from the knowledge graph
      const contextData = await ctx.runQuery(api.chat.getRelevantContext, {
        question: sanitizedQuestion,
      })
      
      // Prepare context for Claude
      let contextPrompt = ''
      if (contextData.concepts.length > 0 || contextData.documents.length > 0) {
        contextPrompt = '\n\nRelevant context from the knowledge graph:\n'
        
        if (contextData.concepts.length > 0) {
          contextPrompt += '\nConcepts:\n'
          contextData.concepts.forEach((concept) => {
            contextPrompt += `- ${concept.name}: ${concept.description}\n`
          })
        }
        
        if (contextData.documents.length > 0) {
          contextPrompt += '\nDocuments:\n'
          contextData.documents.forEach((doc) => {
            const contentPreview = doc.content ? doc.content.substring(0, 500) : 'No content available'
            contextPrompt += `- ${doc.title}: ${contentPreview}...\n`
          })
        }
      }
      
      // Call Claude API
      const response = await generateClaudeResponse(sanitizedQuestion + contextPrompt)
      
      // Add assistant message with context
      await ctx.runMutation(api.chat.addChatMessage, {
        session_id: args.session_id,
        role: 'assistant',
        content: response,
        context_concepts: contextData.concepts.map((c) => c._id),
        context_documents: contextData.documents.map((d) => d._id),
      })
      
      return { success: true, response }
    } catch (error: any) {
      console.error('Error generating answer:', error)
      
      // Send user-friendly error message
      const errorMessage = error.message || 'I encountered an unexpected error. Please try again.'
      try {
        await ctx.runMutation(api.chat.addChatMessage, {
          session_id: args.session_id,
          role: 'assistant',
          content: errorMessage,
        })
      } catch (msgError) {
        console.error('Failed to send error message:', msgError)
      }
      
      return { success: false, error: errorMessage }
    }
  },
})

export const getRelevantContext = query({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.question || typeof args.question !== 'string') {
      return { concepts: [], documents: [] }
    }
    
    const question = args.question.toLowerCase().trim()
    if (question.length === 0) {
      return { concepts: [], documents: [] }
    }
    
    // Limit query scope by taking top concepts by confidence first
    const topConcepts = await ctx.db
      .query('concepts')
      .withIndex('by_confidence')
      .order('desc')
      .take(100) // Limit initial search scope
    
    const relevantConcepts = topConcepts.filter((concept) => {
      return (
        concept.name.toLowerCase().includes(question) ||
        concept.description.toLowerCase().includes(question) ||
        concept.aliases.some((alias) => question.includes(alias.toLowerCase()))
      )
    })
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 5) // Limit to top 5 concepts
    
    // Get documents related to relevant concepts with parallel fetching
    const relevantDocuments: any[] = []
    const documentPromises: Promise<any>[] = []
    const processedDocIds = new Set<string>()
    
    for (const concept of relevantConcepts) {
      for (const docId of concept.document_ids.slice(0, 2)) { // Max 2 docs per concept
        if (!processedDocIds.has(docId)) {
          processedDocIds.add(docId)
          documentPromises.push(ctx.db.get(docId))
        }
      }
    }
    
    // Wait for all document fetches in parallel
    const documents = await Promise.all(documentPromises)
    const validDocuments = documents.filter(doc => doc !== null)
    
    return {
      concepts: relevantConcepts,
      documents: validDocuments.slice(0, 3), // Limit to top 3 documents
    }
  },
})

// Rate limiting storage (in memory for demo - use database for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Simple rate limiting helper
function checkRateLimit(sessionId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const key = sessionId
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// Claude API integration
async function generateClaudeResponse(prompt: string): Promise<string> {
  // Input validation
  if (!prompt || typeof prompt !== 'string') {
    return 'I received an invalid request. Please try asking your question again.'
  }
  
  if (prompt.trim().length === 0) {
    return 'It looks like your message was empty. Please ask me a question and I\'ll do my best to help!'
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable not found')
    return 'I\'m currently experiencing configuration issues. Please contact support or try again later.'
  }
  
  try {
    // Add timeout for API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt.substring(0, 10000), // Limit prompt length
          },
        ],
        system: 'You are a helpful AI assistant that answers questions based on the provided knowledge graph context. When context is provided, use it to give accurate and relevant answers. If the context is insufficient, acknowledge this and provide the best answer you can with general knowledge. Keep responses concise and helpful.',
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`Claude API error: ${response.status} ${response.statusText}`, errorText)
      
      if (response.status === 429) {
        return 'I\'m experiencing high traffic right now. Please wait a moment and try again.'
      } else if (response.status === 401) {
        return 'There\'s an authentication issue on my end. Please contact support.'
      } else if (response.status >= 500) {
        return 'The AI service is temporarily unavailable. Please try again in a few minutes.'
      } else {
        return 'I encountered an error while processing your request. Please try rephrasing your question.'
      }
    }
    
    const data = await response.json()
    
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid response structure from Claude API', data)
      return 'I received an unexpected response format. Please try your question again.'
    }
    
    const responseText = data.content[0]?.text || 'I was unable to generate a proper response. Please try again.'
    return responseText
    
  } catch (error: any) {
    console.error('Error calling Claude API:', error)
    
    if (error.name === 'AbortError') {
      return 'Your request timed out. Please try asking a simpler question or try again later.'
    }
    
    if (error.message?.includes('fetch')) {
      return 'I\'m having trouble connecting to the AI service. Please check your internet connection and try again.'
    }
    
    return 'I encountered an unexpected error. Please try your question again, and if the problem persists, contact support.'
  }
}