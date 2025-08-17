import { query } from './_generated/server'

export const getRelationshipTypes = query({
  handler: async (ctx) => {
    const relationships = await ctx.db.query('relationships').collect()
    const types = new Set<string>()
    
    relationships.forEach(rel => {
      types.add(rel.relationship_type)
    })
    
    return Array.from(types).sort()
  },
})