import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

export const getByEmail = query({
  args: { 
    email: v.string() 
  },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
  },
})

// For demo purposes - get first user or create demo user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get first user (for demo)
    let user = await ctx.db.query('users').first()
    
    // If no users exist, we'll return null and let the frontend handle it
    if (!user) {
      return null
    }
    
    return user
  },
})

// Create demo user if needed
export const createDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo user already exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', 'demo@example.com'))
      .first()
    
    if (existing) {
      return existing._id
    }

    const userId = await ctx.db.insert('users', {
      name: 'Demo User',
      email: 'demo@example.com',
      avatarUrl: undefined,
      createdAt: Date.now(),
    })
    return userId
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, avatarUrl }) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const userId = await ctx.db.insert('users', {
      name,
      email,
      avatarUrl,
      createdAt: Date.now(),
    })
    return userId
  },
})