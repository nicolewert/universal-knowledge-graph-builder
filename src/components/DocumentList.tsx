'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, Brain, ChevronDown, ChevronUp, Play, Square } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from "../../convex/_generated/dataModel";
import { ProcessingIndicator } from './ProcessingIndicator';
import { ConceptPreview } from './ConceptPreview';

// Import the actual Convex document type
type Document = {
  _id: string;
  title: string;
  content: string;
  source_type: 'file' | 'url';
  source_url?: string;
  file_size?: number;
  processing_status: 'uploading' | 'processing' | 'completed' | 'failed';
  upload_timestamp: number;
  processed_timestamp?: number;
  error_message?: string;
};

interface DocumentListProps {
  onRetry?: (documentId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ 
  onRetry 
}) => {
  const documents = useQuery(api.documents.getDocuments) ?? [];
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<Record<string, { success: boolean; error?: string; conceptsCount?: number; relationshipsCount?: number }>>({});
  
  const processDocument = useAction(api.concepts.processDocument);

  const getStatusVariant = (status: Document['processing_status']) => {
    switch (status) {
      case 'uploading': return 'secondary';
      case 'processing': return 'outline';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
    }
  };

  const handleExtractConcepts = async (documentId: string) => {
    try {
      setProcessingDocuments(prev => new Set([...prev, documentId]));
      const result = await processDocument({ documentId: documentId as Id<"documents"> });
      
      if (result.success) {
        // Automatically expand to show results
        setExpandedDocuments(prev => new Set([...prev, documentId]));
      } else {
        console.error('Concept extraction failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to extract concepts:', error);
    } finally {
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (documentId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleBatchExtraction = async () => {
    const completedDocuments = documents.filter(doc => 
      doc.processing_status === 'completed'
    ).map(doc => doc._id);

    if (completedDocuments.length === 0) {
      return;
    }

    setBatchProcessing(true);
    setBatchQueue(completedDocuments);
    setBatchResults({});

    // Process documents one by one to avoid overwhelming the API
    for (const documentId of completedDocuments) {
      try {
        setProcessingDocuments(prev => new Set([...prev, documentId]));
        
        const result = await processDocument({ documentId: documentId as Id<"documents"> });
        
        setBatchResults(prev => ({
          ...prev,
          [documentId]: {
            success: result.success,
            error: result.error,
            conceptsCount: result.conceptsCount,
            relationshipsCount: result.relationshipsCount,
          }
        }));

        if (result.success) {
          setExpandedDocuments(prev => new Set([...prev, documentId]));
        }

        // Add delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        setBatchResults(prev => ({
          ...prev,
          [documentId]: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      } finally {
        setProcessingDocuments(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
        
        setBatchQueue(prev => prev.filter(id => id !== documentId));
      }
    }

    setBatchProcessing(false);
  };

  const stopBatchProcessing = () => {
    setBatchProcessing(false);
    setBatchQueue([]);
    setProcessingDocuments(new Set());
  };

  // Get batch processing statistics
  const completedDocuments = documents.filter(doc => doc.processing_status === 'completed');
  const totalBatchResults = Object.keys(batchResults).length;
  const successfulExtractions = Object.values(batchResults).filter(result => result.success).length;

  // Helper component to handle concept and relationship queries
  const ConceptPreviewWrapper: React.FC<{ documentId: string }> = ({ documentId }) => {
    const concepts = useQuery(api.concepts.getConceptsByDocument, { documentId: documentId as Id<"documents"> }) ?? [];
    const relationships = useQuery(api.concepts.getRelationshipsByDocument, { documentId: documentId as Id<"documents"> }) ?? [];
    
    // Transform data to match ConceptPreview expectations
    const transformedConcepts = concepts.map(concept => ({
      id: concept._id,
      name: concept.name,
      description: concept.description,
      confidenceScore: concept.confidence_score,
      category: concept.category,
    }));
    
    const transformedRelationships = relationships.map(rel => ({
      id: rel._id,
      sourceConcept: concepts.find(c => c._id === rel.source_concept_id)?.name || 'Unknown',
      targetConcept: concepts.find(c => c._id === rel.target_concept_id)?.name || 'Unknown',
      type: rel.relationship_type,
      confidenceScore: rel.strength,
    }));
    
    return (
      <ConceptPreview 
        concepts={transformedConcepts}
        relationships={transformedRelationships}
        isLoading={false}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Uploaded Documents</h2>
        
        {completedDocuments.length > 0 && (
          <div className="flex items-center gap-3">
            {batchProcessing && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <ProcessingIndicator 
                  status="processing"
                  conceptsCount={Object.values(batchResults).reduce((sum, result) => sum + (result.conceptsCount || 0), 0)}
                  relationshipsCount={Object.values(batchResults).reduce((sum, result) => sum + (result.relationshipsCount || 0), 0)}
                />
                <span>{totalBatchResults}/{completedDocuments.length} processed</span>
              </div>
            )}
            
            <Button
              size="sm"
              variant={batchProcessing ? "destructive" : "default"}
              onClick={batchProcessing ? stopBatchProcessing : handleBatchExtraction}
              disabled={completedDocuments.length === 0}
              className="flex items-center gap-1"
            >
              {batchProcessing ? (
                <>
                  <Square className="h-3 w-3" />
                  Stop Batch
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Extract All ({completedDocuments.length})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      {documents.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Documents</AlertTitle>
          <AlertDescription>
            You haven&apos;t uploaded any documents yet.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const isExpanded = expandedDocuments.has(doc._id);
            const isProcessing = processingDocuments.has(doc._id);
            
            return (
              <Card key={doc._id} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {doc.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getStatusVariant(doc.processing_status)}
                      className="capitalize"
                    >
                      {doc.processing_status}
                    </Badge>
                    {doc.processing_status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpanded(doc._id)}
                        className="p-1 h-6"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Uploaded: {new Date(doc.upload_timestamp).toLocaleString()}</div>
                    <div>Source: {doc.source_type === 'file' ? 'File Upload' : 'URL Scrape'}</div>
                    {doc.source_url && (
                      <div className="truncate">URL: {doc.source_url}</div>
                    )}
                    {doc.file_size && (
                      <div>Size: {(doc.file_size / 1024).toFixed(1)} KB</div>
                    )}
                  </div>
                  
                  {doc.processing_status === 'completed' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExtractConcepts(doc._id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1"
                      >
                        <Brain className="h-3 w-3" />
                        {isProcessing ? 'Extracting...' : 'Extract Concepts'}
                      </Button>
                    </div>
                  )}
                  
                  {doc.processing_status === 'failed' && doc.error_message && (
                    <div className="mt-2">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Processing Error</AlertTitle>
                        <AlertDescription>
                          {doc.error_message}
                          {onRetry && (
                            <button 
                              onClick={() => onRetry(doc._id)}
                              className="ml-2 text-sm underline"
                            >
                              Retry
                            </button>
                          )}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="mt-4">
                      <ProcessingIndicator 
                        status="processing"
                        conceptsCount={batchResults[doc._id]?.conceptsCount || 0}
                        relationshipsCount={batchResults[doc._id]?.relationshipsCount || 0}
                      />
                    </div>
                  )}
                  
                  {batchResults[doc._id] && !isProcessing && (
                    <div className="mt-3">
                      {batchResults[doc._id].success ? (
                        <Alert>
                          <Brain className="h-4 w-4" />
                          <AlertTitle>Extraction Complete</AlertTitle>
                          <AlertDescription>
                            Extracted {batchResults[doc._id].conceptsCount || 0} concepts and {batchResults[doc._id].relationshipsCount || 0} relationships
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Extraction Failed</AlertTitle>
                          <AlertDescription>
                            {batchResults[doc._id].error || 'Unknown error during concept extraction'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  {isExpanded && (
                    <div className="mt-4">
                      <ConceptPreviewWrapper documentId={doc._id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};