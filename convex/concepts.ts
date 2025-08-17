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

// Lock management mutations
export const createDeduplicationLock = mutation({
  args: {
    operation_type: v.string(),
    document_id: v.optional(v.id('documents')),
  },
  handler: async (ctx, args) => {
    const processId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return await ctx.db.insert('deduplication_locks', {
      process_id: processId,
      operation_type: args.operation_type,
      status: 'active',
      created_timestamp: Date.now(),
      document_id: args.document_id,
      concepts_processed: 0,
    });
  },
});

export const updateDeduplicationLock = mutation({
  args: {
    id: v.id('deduplication_locks'),
    status: v.union(v.literal('active'), v.literal('completed'), v.literal('failed')),
    error_message: v.optional(v.string()),
    concepts_processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, status, ...updates } = args;
    
    const updateData: any = {
      status,
      ...updates,
    };
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_timestamp = Date.now();
    }
    
    return await ctx.db.patch(id, updateData);
  },
});

export const getActiveLocks = query({
  args: { operation_type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query('deduplication_locks')
      .withIndex('by_status', (q) => q.eq('status', 'active'));
    
    const locks = await query.collect();
    
    if (args.operation_type) {
      return locks.filter(lock => lock.operation_type === args.operation_type);
    }
    
    return locks;
  },
});

export const cleanupOldLocks = mutation({
  handler: async (ctx) => {
    const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes ago
    
    const oldLocks = await ctx.db
      .query('deduplication_locks')
      .withIndex('by_created')
      .filter((q) => q.lt(q.field('created_timestamp'), cutoffTime))
      .collect();
    
    for (const lock of oldLocks) {
      if (lock.status === 'active') {
        await ctx.db.patch(lock._id, {
          status: 'failed',
          error_message: 'Lock timeout - process may have crashed',
          completed_timestamp: Date.now(),
        });
      }
    }
    
    return oldLocks.length;
  },
});

export const deduplicateConcepts = action({
  args: { 
    documentId: v.optional(v.id('documents')),
    threshold: v.optional(v.number()), // similarity threshold (0-1), default 0.8
    maxConcepts: v.optional(v.number()), // processing limit, default 1000
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const threshold = args.threshold ?? 0.8;
    const maxConcepts = args.maxConcepts ?? 1000;
    let lockId: any = null;
    
    try {
      // Step 1: Check for existing locks and create new lock
      console.log('[DEDUP] Starting concept deduplication with enhanced safety measures...');
      
      // Clean up old locks first
      await ctx.runMutation(api.concepts.cleanupOldLocks, {});
      
      // Check for active deduplication processes
      const activeLocks = await ctx.runQuery(api.concepts.getActiveLocks, { 
        operation_type: 'deduplication' 
      });
      
      if (activeLocks.length > 0) {
        console.log(`[DEDUP] Found ${activeLocks.length} active deduplication processes. Aborting.`);
        return {
          success: false,
          error: `Deduplication already in progress (${activeLocks.length} active processes). Please wait for completion.`,
          errorType: 'CONCURRENT_OPERATION',
        };
      }
      
      // Create lock
      lockId = await ctx.runMutation(api.concepts.createDeduplicationLock, {
        operation_type: 'deduplication',
        document_id: args.documentId,
      });
      
      console.log(`[DEDUP] Created lock ${lockId} for deduplication process`);
      
      // Step 2: Load concepts with limits
      const allConcepts = args.documentId 
        ? await ctx.runQuery(api.concepts.getConceptsByDocument, { documentId: args.documentId })
        : await ctx.runQuery(api.concepts.getConcepts, {});

      if (allConcepts.length > maxConcepts) {
        console.log(`[DEDUP] Too many concepts (${allConcepts.length}). Processing first ${maxConcepts} by confidence score.`);
      }
      
      // Sort by confidence and limit processing
      const concepts = allConcepts
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, maxConcepts);
      
      console.log(`[DEDUP] Processing ${concepts.length} concepts (threshold: ${threshold})`);
      
      await ctx.runMutation(api.concepts.updateDeduplicationLock, {
        id: lockId,
        status: 'active',
        concepts_processed: concepts.length,
      });
      
      // Step 3: Find duplicates with batch processing
      const BATCH_SIZE = 50;
      const mergeOperations: Array<{
        primary: any;
        duplicates: any[];
        similarity: number;
      }> = [];
      
      const processedIds = new Set<string>();
      
      for (let batchStart = 0; batchStart < concepts.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, concepts.length);
        console.log(`[DEDUP] Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(concepts.length / BATCH_SIZE)}`);
        
        for (let i = batchStart; i < batchEnd; i++) {
          const primary = concepts[i];
          
          if (processedIds.has(primary._id)) continue;
          
          const duplicates: any[] = [];
          
          for (let j = i + 1; j < concepts.length; j++) {
            const candidate = concepts[j];
            
            if (processedIds.has(candidate._id)) continue;
            
            const similarity = calculateConceptSimilarity(primary, candidate);
            
            if (similarity >= threshold) {
              duplicates.push(candidate);
              processedIds.add(candidate._id);
              console.log(`[DEDUP] Found duplicate: "${primary.name}" <-> "${candidate.name}" (${similarity.toFixed(2)})`);
            }
          }
          
          if (duplicates.length > 0) {
            mergeOperations.push({
              primary,
              duplicates,
              similarity: Math.max(...duplicates.map(d => calculateConceptSimilarity(primary, d)))
            });
            processedIds.add(primary._id);
          }
        }
      }
      
      console.log(`[DEDUP] Found ${mergeOperations.length} merge operations`);
      
      // Step 4: Execute merge operations with safety checks and rollback
      let mergedCount = 0;
      let aliasesAdded = 0;
      const failedMerges: string[] = [];
      const successfulMerges: Array<{ primaryId: any; duplicateIds: any[] }> = [];
      
      for (const [index, operation] of mergeOperations.entries()) {
        try {
          console.log(`[DEDUP] Processing merge ${index + 1}/${mergeOperations.length}: "${operation.primary.name}"`);
          
          // Validate concepts still exist before merging
          const primaryExists = await ctx.runQuery(api.concepts.getConcepts, {}).then(
            concepts => concepts.some(c => c._id === operation.primary._id)
          );
          
          if (!primaryExists) {
            console.warn(`[DEDUP] Primary concept "${operation.primary.name}" no longer exists, skipping merge`);
            continue;
          }
          
          // Pre-merge relationship safety check
          const duplicateIds = operation.duplicates.map(d => d._id);
          const existingRelationships = await getExistingRelationshipsForMerge(ctx, operation.primary._id, duplicateIds);
          
          // Collect merged data
          const allAliases = new Set([
            ...operation.primary.aliases,
            ...operation.duplicates.flatMap(d => [...d.aliases, d.name])
          ]);
          allAliases.delete(operation.primary.name); // Don't add primary name as alias
          
          const mergedDocumentIds = Array.from(new Set([
            ...operation.primary.document_ids,
            ...operation.duplicates.flatMap(d => d.document_ids)
          ]));
          
          const totalConcepts = 1 + operation.duplicates.length;
          const weightedConfidence = (
            operation.primary.confidence_score +
            operation.duplicates.reduce((sum, d) => sum + d.confidence_score, 0)
          ) / totalConcepts;
          
          // Update primary concept
          await ctx.runMutation(api.concepts.updateConcept, {
            id: operation.primary._id,
            aliases: Array.from(allAliases),
            document_ids: mergedDocumentIds,
            confidence_score: Math.min(1, weightedConfidence * 1.1),
            description: operation.primary.description
          });
          
          // Safely merge relationships
          await mergeRelationshipsWithSafetyChecks(ctx, operation.primary._id, duplicateIds, existingRelationships);
          
          // Delete duplicate concepts
          for (const duplicate of operation.duplicates) {
            await ctx.runMutation(api.concepts.deleteConcept, {
              id: duplicate._id
            });
          }
          
          successfulMerges.push({
            primaryId: operation.primary._id,
            duplicateIds
          });
          
          mergedCount += operation.duplicates.length;
          aliasesAdded += Array.from(allAliases).length - operation.primary.aliases.length;
          
          console.log(`[DEDUP] Successfully merged ${operation.duplicates.length} concepts into "${operation.primary.name}"`);
          
        } catch (error) {
          const errorMsg = `Failed to merge "${operation.primary.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[DEDUP] ${errorMsg}`);
          failedMerges.push(errorMsg);
        }
      }
      
      // Step 5: Complete lock and return results
      await ctx.runMutation(api.concepts.updateDeduplicationLock, {
        id: lockId,
        status: 'completed',
        concepts_processed: concepts.length,
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`[DEDUP] Deduplication completed in ${duration}ms: ${mergedCount} concepts merged, ${aliasesAdded} aliases added`);
      
      if (failedMerges.length > 0) {
        console.warn(`[DEDUP] ${failedMerges.length} merges failed:`, failedMerges);
      }
      
      return {
        success: true,
        mergedCount,
        aliasesAdded,
        totalOperations: mergeOperations.length,
        failedMerges: failedMerges.length,
        processingTime: duration,
        conceptsProcessed: concepts.length,
        warning: failedMerges.length > 0 ? `${failedMerges.length} merge operations failed` : undefined,
      };
      
    } catch (error) {
      console.error('[DEDUP] Critical deduplication error:', error);
      
      // Update lock with failure
      if (lockId) {
        try {
          await ctx.runMutation(api.concepts.updateDeduplicationLock, {
            id: lockId,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        } catch (lockError) {
          console.error('[DEDUP] Failed to update lock status:', lockError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deduplication error',
        errorType: 'CRITICAL_ERROR',
      };
    }
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

      // Automatically run deduplication after document processing
      console.log('Running automatic concept deduplication...');
      const deduplicationResult = await ctx.runAction(api.concepts.deduplicateConcepts, {
        documentId: args.documentId,
        threshold: 0.8
      });
      
      if (deduplicationResult.success) {
        console.log(`Deduplication: ${deduplicationResult.mergedCount} concepts merged, ${deduplicationResult.aliasesAdded} aliases added`);
      } else {
        console.warn('Deduplication failed:', deduplicationResult.error);
      }

      return {
        success: true,
        conceptsCount: conceptsCreated,
        relationshipsCount: relationshipsCreated,
        deduplicationResult,
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

// Helper functions for concept deduplication

function calculateConceptSimilarity(concept1: any, concept2: any): number {
  // Name similarity (Levenshtein distance normalized)
  const nameSimilarity = calculateStringSimilarity(concept1.name, concept2.name);
  
  // Description similarity (simple word overlap)
  const descriptionSimilarity = calculateStringSimilarity(concept1.description, concept2.description);
  
  // Alias overlap check
  const aliases1 = new Set([concept1.name, ...concept1.aliases]);
  const aliases2 = new Set([concept2.name, ...concept2.aliases]);
  const aliasOverlap = calculateSetOverlap(aliases1, aliases2);
  
  // Category match bonus
  const categoryBonus = concept1.category && concept2.category && concept1.category === concept2.category ? 0.1 : 0;
  
  // Weighted combination
  return Math.min(1, (nameSimilarity * 0.5 + descriptionSimilarity * 0.3 + aliasOverlap * 0.2 + categoryBonus));
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateSetOverlap(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Enhanced relationship safety functions
async function getExistingRelationshipsForMerge(ctx: any, primaryId: any, duplicateIds: any[]) {
  const allIds = [primaryId, ...duplicateIds];
  const existingRelationships = new Map<string, any>();
  
  for (const conceptId of allIds) {
    const relationships = await ctx.runQuery(api.concepts.getRelationshipsByConcept, { 
      conceptId 
    });
    
    for (const rel of relationships) {
      const key = `${rel.source_concept_id}-${rel.target_concept_id}-${rel.relationship_type}`;
      if (!existingRelationships.has(key)) {
        existingRelationships.set(key, rel);
      }
    }
  }
  
  return existingRelationships;
}

async function mergeRelationshipsWithSafetyChecks(ctx: any, primaryId: any, duplicateIds: any[], existingRelationships: Map<string, any>) {
  console.log(`[DEDUP] Merging relationships for ${duplicateIds.length} duplicate concepts`);
  
  const processedRelationships = new Set<string>();
  const duplicateRelationships: any[] = [];
  
  // Collect all relationships from duplicates
  for (const duplicateId of duplicateIds) {
    const relationships = await ctx.runQuery(api.concepts.getRelationshipsByConcept, { 
      conceptId: duplicateId 
    });
    
    for (const rel of relationships) {
      // Determine new source and target after merge
      const newSourceId = rel.source_concept_id === duplicateId ? primaryId : 
                         duplicateIds.includes(rel.source_concept_id) ? primaryId : rel.source_concept_id;
      const newTargetId = rel.target_concept_id === duplicateId ? primaryId : 
                         duplicateIds.includes(rel.target_concept_id) ? primaryId : rel.target_concept_id;
      
      // Skip self-relationships
      if (newSourceId === newTargetId) {
        console.log(`[DEDUP] Skipping self-relationship: ${rel.relationship_type}`);
        duplicateRelationships.push(rel._id);
        continue;
      }
      
      // Check for existing relationship with same source, target, and type
      const relationshipKey = `${newSourceId}-${newTargetId}-${rel.relationship_type}`;
      const reverseKey = `${newTargetId}-${newSourceId}-${rel.relationship_type}`;
      
      if (processedRelationships.has(relationshipKey) || processedRelationships.has(reverseKey)) {
        console.log(`[DEDUP] Duplicate relationship found: ${rel.relationship_type}`);
        duplicateRelationships.push(rel._id);
        continue;
      }
      
      // Check if this would create a duplicate relationship
      const existingRel = existingRelationships.get(relationshipKey) || existingRelationships.get(reverseKey);
      
      if (existingRel && existingRel._id !== rel._id) {
        console.log(`[DEDUP] Merging duplicate relationship: ${rel.relationship_type}`);
        
        // Keep the relationship with higher strength
        if (rel.strength > existingRel.strength) {
          await ctx.runMutation(api.concepts.updateRelationship, {
            id: existingRel._id,
            source_concept_id: newSourceId,
            target_concept_id: newTargetId,
          });
          
          // Update the strength and context if this one is stronger
          await ctx.runMutation(api.concepts.updateRelationshipStrength, {
            id: existingRel._id,
            strength: rel.strength,
            context: `${existingRel.context}; ${rel.context}`.trim(),
          });
        }
        
        duplicateRelationships.push(rel._id);
      } else {
        // Update relationship to point to primary concept
        await ctx.runMutation(api.concepts.updateRelationship, {
          id: rel._id,
          source_concept_id: newSourceId,
          target_concept_id: newTargetId,
        });
        
        processedRelationships.add(relationshipKey);
      }
    }
  }
  
  // Clean up duplicate relationships
  for (const relId of duplicateRelationships) {
    try {
      await ctx.runMutation(api.concepts.deleteRelationship, { id: relId });
    } catch (error) {
      console.warn(`[DEDUP] Failed to delete duplicate relationship ${relId}:`, error);
    }
  }
  
  console.log(`[DEDUP] Processed ${processedRelationships.size} unique relationships, removed ${duplicateRelationships.length} duplicates`);
}

// Additional mutations needed for deduplication

export const updateConcept = mutation({
  args: {
    id: v.id('concepts'),
    aliases: v.optional(v.array(v.string())),
    document_ids: v.optional(v.array(v.id('documents'))),
    confidence_score: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const deleteConcept = mutation({
  args: { id: v.id('concepts') },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const updateRelationship = mutation({
  args: {
    id: v.id('relationships'),
    source_concept_id: v.optional(v.id('concepts')),
    target_concept_id: v.optional(v.id('concepts')),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const updateRelationshipStrength = mutation({
  args: {
    id: v.id('relationships'),
    strength: v.number(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteRelationship = mutation({
  args: { id: v.id('relationships') },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Graph visualization queries

export const getGraphData = query({
  handler: async (ctx) => {
    // Get all concepts
    const concepts = await ctx.db.query('concepts').collect();
    
    // Get all relationships
    const relationships = await ctx.db.query('relationships').collect();
    
    // Transform concepts to nodes
    const nodes = concepts.map(concept => ({
      id: concept._id,
      name: concept.name,
      category: concept.category || 'default',
      size: concept.document_ids.length || 1,
      description: concept.description,
      confidence: concept.confidence_score,
    }));
    
    // Transform relationships to edges
    const edges = relationships.map(rel => ({
      source: rel.source_concept_id,
      target: rel.target_concept_id,
      strength: rel.strength,
      type: rel.relationship_type,
      context: rel.context,
    }));
    
    return { nodes, edges };
  },
});

export const getConcept = query({
  args: { conceptId: v.id('concepts') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conceptId);
  },
});

export const getConceptRelationships = query({
  args: { conceptId: v.id('concepts') },
  handler: async (ctx, args) => {
    const relationships = await ctx.runQuery(api.concepts.getRelationshipsByConcept, {
      conceptId: args.conceptId,
    });
    
    // Get related concept details
    const relatedConceptIds = new Set<string>();
    relationships.forEach(rel => {
      if (rel.source_concept_id !== args.conceptId) {
        relatedConceptIds.add(rel.source_concept_id);
      }
      if (rel.target_concept_id !== args.conceptId) {
        relatedConceptIds.add(rel.target_concept_id);
      }
    });
    
    const relatedConcepts = await Promise.all(
      Array.from(relatedConceptIds).map(id => ctx.db.get(id as any))
    );
    
    return {
      relationships,
      relatedConcepts: relatedConcepts.filter(Boolean),
    };
  },
});