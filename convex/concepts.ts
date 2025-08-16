import { mutation, query, action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

export const createConcept = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    document_ids: v.array(v.id('documents')),
    confidence_score: v.number(),
    category: v.optional(v.string()),
    aliases: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert('concepts', {
      name: args.name,
      description: args.description,
      document_ids: args.document_ids,
      confidence_score: args.confidence_score,
      category: args.category,
      aliases: args.aliases,
      created_timestamp: now,
    })
  },
})

export const createRelationship = mutation({
  args: {
    source_concept_id: v.id('concepts'),
    target_concept_id: v.id('concepts'),
    relationship_type: v.string(),
    strength: v.number(),
    context: v.string(),
    document_id: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert('relationships', {
      source_concept_id: args.source_concept_id,
      target_concept_id: args.target_concept_id,
      relationship_type: args.relationship_type,
      strength: args.strength,
      context: args.context,
      document_id: args.document_id,
      created_timestamp: now,
    })
  },
})

export const getConcepts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('concepts')
      .withIndex('by_created_timestamp')
      .order('desc')
      .collect()
  },
})

export const getConceptsByDocument = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const allConcepts = await ctx.db.query('concepts').collect()
    return allConcepts.filter(concept => 
      concept.document_ids.includes(args.documentId)
    )
  },
})

export const getRelationshipsByDocument = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('relationships')
      .withIndex('by_document', (q) => q.eq('document_id', args.documentId))
      .collect()
  },
})

export const getRelationshipsByConcept = query({
  args: { conceptId: v.id('concepts') },
  handler: async (ctx, args) => {
    const sourceRelationships = await ctx.db
      .query('relationships')
      .withIndex('by_source', (q) => q.eq('source_concept_id', args.conceptId))
      .collect()
    
    const targetRelationships = await ctx.db
      .query('relationships')
      .withIndex('by_target', (q) => q.eq('target_concept_id', args.conceptId))
      .collect()
    
    return [...sourceRelationships, ...targetRelationships]
  },
})

export const processDocument = action({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    let conceptsCreated = 0;
    let relationshipsCreated = 0;
    
    try {
      console.log(`Starting document processing for ID: ${args.documentId}`);
      
      // First, get the document
      const document = await ctx.runQuery(api.documents.getDocumentById, {
        id: args.documentId,
      });
      
      if (!document) {
        const errorMessage = `Document not found: ${args.documentId}`;
        console.error(errorMessage);
        return { 
          success: false, 
          error: errorMessage,
          errorType: ProcessingErrorType.DOCUMENT_NOT_FOUND,
        };
      }

      console.log(`Processing document: "${document.title}" (${document.content.length} characters)`);

      // Update document status to processing
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        id: args.documentId,
        processing_status: 'processing',
      });

      // Call Claude API for concept extraction
      const extractionResult = await extractConceptsFromText(document.content, document.title);
      
      if (!extractionResult.success) {
        console.error('Concept extraction failed:', extractionResult.error);
        
        await ctx.runMutation(api.documents.updateDocumentStatus, {
          id: args.documentId,
          processing_status: 'failed',
          error_message: extractionResult.error || 'Failed to extract concepts',
        });
        
        return { 
          success: false, 
          error: extractionResult.error,
          errorType: extractionResult.errorType,
        };
      }

      console.log(`Extracted ${extractionResult.concepts.length} concepts and ${extractionResult.relationships.length} relationships`);

      // Create concepts with better error handling
      const conceptIdMap = new Map<string, any>();
      const failedConcepts: string[] = [];
      
      for (const concept of extractionResult.concepts) {
        try {
          const conceptId = await ctx.runMutation(api.concepts.createConcept, {
            name: concept.name,
            description: concept.description,
            document_ids: [args.documentId],
            confidence_score: Math.max(0, Math.min(1, concept.confidence)), // Ensure 0-1 range
            category: concept.category,
            aliases: concept.aliases || [],
          });
          
          conceptIdMap.set(concept.name, conceptId);
          conceptsCreated++;
          console.log(`Created concept: "${concept.name}" (confidence: ${concept.confidence})`);
          
        } catch (error) {
          console.error(`Failed to create concept "${concept.name}":`, error);
          failedConcepts.push(concept.name);
        }
      }

      // Create relationships with better error handling
      const failedRelationships: string[] = [];
      
      for (const relationship of extractionResult.relationships) {
        try {
          const sourceId = conceptIdMap.get(relationship.source);
          const targetId = conceptIdMap.get(relationship.target);
          
          if (!sourceId || !targetId) {
            console.warn(`Skipping relationship "${relationship.source}" -> "${relationship.target}": concept(s) not found`);
            continue;
          }
          
          await ctx.runMutation(api.concepts.createRelationship, {
            source_concept_id: sourceId,
            target_concept_id: targetId,
            relationship_type: relationship.type,
            strength: Math.max(0, Math.min(1, relationship.strength)), // Ensure 0-1 range
            context: relationship.context,
            document_id: args.documentId,
          });
          
          relationshipsCreated++;
          console.log(`Created relationship: "${relationship.source}" ${relationship.type} "${relationship.target}"`);
          
        } catch (error) {
          console.error(`Failed to create relationship "${relationship.source}" -> "${relationship.target}":`, error);
          failedRelationships.push(`${relationship.source} -> ${relationship.target}`);
        }
      }

      // Update document status to completed
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        id: args.documentId,
        processing_status: 'completed',
      });

      // Log summary
      console.log(`Document processing complete: ${conceptsCreated} concepts, ${relationshipsCreated} relationships created`);
      
      if (failedConcepts.length > 0) {
        console.warn(`Failed to create ${failedConcepts.length} concepts:`, failedConcepts);
      }
      
      if (failedRelationships.length > 0) {
        console.warn(`Failed to create ${failedRelationships.length} relationships:`, failedRelationships);
      }

      return {
        success: true,
        conceptsCount: conceptsCreated,
        relationshipsCount: relationshipsCreated,
        warning: failedConcepts.length > 0 || failedRelationships.length > 0 
          ? `Some items failed to create: ${failedConcepts.length} concepts, ${failedRelationships.length} relationships`
          : undefined,
      };

    } catch (error) {
      console.error('Document processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
      const errorType = errorMessage.includes('Document not found') ? ProcessingErrorType.DOCUMENT_NOT_FOUND :
                       errorMessage.includes('Claude API') ? ProcessingErrorType.API_EXTRACTION_FAILED :
                       errorMessage.includes('create') ? ProcessingErrorType.CONCEPT_CREATION_ERROR :
                       ProcessingErrorType.API_EXTRACTION_FAILED;
      
      try {
        await ctx.runMutation(api.documents.updateDocumentStatus, {
          id: args.documentId,
          processing_status: 'failed',
          error_message: errorMessage,
        });
      } catch (updateError) {
        console.error('Failed to update document status:', updateError);
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType,
        conceptsCount: conceptsCreated,
        relationshipsCount: relationshipsCreated,
      };
    }
  },
})

enum ProcessingErrorType {
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  API_EXTRACTION_FAILED = 'API_EXTRACTION_FAILED',
  CONCEPT_CREATION_ERROR = 'CONCEPT_CREATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT'
}

async function extractConceptsFromText(content: string, title: string): Promise<{
  success: boolean;
  concepts: Array<{
    name: string;
    description: string;
    confidence: number;
    category?: string;
    aliases?: string[];
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
    context: string;
  }>;
  error?: string;
  errorType?: ProcessingErrorType;
}> {
  // Validate API key configuration
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY configuration');
    return {
      success: false,
      concepts: [],
      relationships: [],
      error: 'Claude API not configured. Please set ANTHROPIC_API_KEY environment variable.',
      errorType: ProcessingErrorType.CONFIG_ERROR,
    };
  }

  // Enhanced document chunking for large content
  const MAX_CONTENT_LENGTH = 8000;
  const processedContent = content.length > MAX_CONTENT_LENGTH 
    ? content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated for processing]'
    : content;

  const claudePrompt = `Extract key concepts and relationships from this document titled "${title}". 

Document content:
${processedContent}

Please analyze the text and return a JSON response with the following structure:
{
  "concepts": [
    {
      "name": "concept name",
      "description": "clear description of the concept",
      "confidence": 0.85,
      "category": "optional category like 'person', 'technology', 'concept'",
      "aliases": ["alternative names or synonyms"]
    }
  ],
  "relationships": [
    {
      "source": "source concept name",
      "target": "target concept name", 
      "type": "relationship type like 'causes', 'relates to', 'depends on'",
      "strength": 0.75,
      "context": "brief context explaining the relationship"
    }
  ]
}

Focus on:
- Important entities, people, places, technologies, concepts
- Clear relationships between concepts
- High confidence scores (0.7+) for well-supported concepts
- Meaningful relationship types that capture the nature of connections
- Concise but informative descriptions

Return only valid JSON, no additional text.`;

  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Concept extraction attempt ${attempt}/${MAX_RETRIES} for document: ${title}`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: claudePrompt,
            },
          ],
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        
        if (attempt === MAX_RETRIES) {
          return {
            success: false,
            concepts: [],
            relationships: [],
            error: 'Rate limit exceeded. Please try again later.',
            errorType: ProcessingErrorType.RATE_LIMIT,
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const content_text = result.content?.[0]?.text;

      if (!content_text) {
        throw new Error('No content returned from Claude API');
      }

      // Robust JSON parsing with validation
      let extractionData;
      try {
        extractionData = JSON.parse(content_text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', content_text);
        throw new Error(`Invalid JSON response from Claude API: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
      }
      
      // Validate response structure with detailed error messages
      if (!extractionData || typeof extractionData !== 'object') {
        throw new Error('Invalid response format: expected object');
      }
      
      if (!extractionData.concepts || !Array.isArray(extractionData.concepts)) {
        throw new Error('Invalid response format: missing or invalid concepts array');
      }
      
      if (!extractionData.relationships || !Array.isArray(extractionData.relationships)) {
        throw new Error('Invalid response format: missing or invalid relationships array');
      }

      // Validate concepts structure
      for (let i = 0; i < extractionData.concepts.length; i++) {
        const concept = extractionData.concepts[i];
        if (!concept.name || typeof concept.name !== 'string') {
          console.warn(`Invalid concept at index ${i}: missing or invalid name`);
          continue;
        }
        
        // Set defaults for missing fields
        concept.confidence = typeof concept.confidence === 'number' ? concept.confidence : 0.5;
        concept.description = concept.description || concept.name;
        concept.aliases = Array.isArray(concept.aliases) ? concept.aliases : [];
      }

      // Validate relationships structure
      for (let i = 0; i < extractionData.relationships.length; i++) {
        const rel = extractionData.relationships[i];
        if (!rel.source || !rel.target || typeof rel.source !== 'string' || typeof rel.target !== 'string') {
          console.warn(`Invalid relationship at index ${i}: missing source or target`);
          continue;
        }
        
        // Set defaults for missing fields
        rel.strength = typeof rel.strength === 'number' ? rel.strength : 0.5;
        rel.type = rel.type || 'related to';
        rel.context = rel.context || '';
      }

      console.log(`Successfully extracted ${extractionData.concepts.length} concepts and ${extractionData.relationships.length} relationships`);

      return {
        success: true,
        concepts: extractionData.concepts.filter((c: any) => c.name), // Filter out invalid concepts
        relationships: extractionData.relationships.filter((r: any) => r.source && r.target), // Filter out invalid relationships
      };
      
    } catch (error) {
      console.error(`Concept extraction error (attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt === MAX_RETRIES) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to extract concepts';
        const errorType = errorMessage.includes('JSON') ? ProcessingErrorType.PARSE_ERROR :
                         errorMessage.includes('network') || errorMessage.includes('fetch') ? ProcessingErrorType.NETWORK_ERROR :
                         ProcessingErrorType.API_EXTRACTION_FAILED;
        
        return {
          success: false,
          concepts: [],
          relationships: [],
          error: errorMessage,
          errorType,
        };
      }
      
      // Wait before retry
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript requires it
  return {
    success: false,
    concepts: [],
    relationships: [],
    error: 'Maximum retries exceeded',
    errorType: ProcessingErrorType.API_EXTRACTION_FAILED,
  };
}