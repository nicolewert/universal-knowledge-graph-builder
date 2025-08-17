import { query } from './_generated/server';
import { v } from 'convex/values';

export const getGraphData = query({
  handler: async (ctx) => {
    // Fetch all concepts
    const concepts = await ctx.db.query('concepts').collect();
    
    // Fetch all relationships
    const relationships = await ctx.db.query('relationships').collect();

    // Transform concepts to graph nodes
    const nodes = concepts.map(concept => ({
      id: concept._id,
      name: concept.name,
      category: concept.category || 'Default',
      size: concept.document_ids.length, // Node size based on document count
      description: concept.description,
      confidence: concept.confidence_score
    }));

    // Transform relationships to graph edges
    const edges = relationships.map(relationship => ({
      source: relationship.source_concept_id,
      target: relationship.target_concept_id,
      strength: relationship.strength,
      type: relationship.relationship_type,
      context: relationship.context
    }));

    return { nodes, edges };
  }
});