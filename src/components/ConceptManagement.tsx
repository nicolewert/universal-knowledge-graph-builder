import React, { useState } from 'react';
import { api } from '~/convex/_generated/api';
import { useQuery, useMutation, useAction } from 'convex/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '~/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { LoaderIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

// Interfaces for type safety
interface Concept {
  _id: string;
  name: string;
  description: string;
  confidence_score: number;
  aliases: string[];
  document_ids: string[];
}

interface DeduplicationResult {
  success: boolean;
  mergedCount?: number;
  aliasesAdded?: number;
  totalOperations?: number;
  failedMerges?: number;
  processingTime?: number;
  conceptsProcessed?: number;
  error?: string;
  errorType?: string;
  warning?: string;
}

export function ConceptManagement() {
  const concepts = useQuery(api.concepts.getConcepts) || [];
  const deduplicateConcepts = useAction(api.concepts.deduplicateConcepts);

  const [threshold, setThreshold] = useState(0.8);
  const [maxConcepts, setMaxConcepts] = useState(1000);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDeduplication = async () => {
    setIsDeduplicating(true);
    setDeduplicationResult(null);

    try {
      console.log(`Starting deduplication with threshold ${threshold}, max concepts ${maxConcepts}`);
      const startTime = Date.now();
      
      const result = await deduplicateConcepts({ 
        threshold,
        maxConcepts
      });
      
      const clientProcessingTime = Date.now() - startTime;
      console.log(`Deduplication completed in ${clientProcessingTime}ms`);
      
      setDeduplicationResult({
        ...result,
        processingTime: result.processingTime || clientProcessingTime
      });
    } catch (error) {
      console.error('Deduplication error:', error);
      setDeduplicationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'CLIENT_ERROR'
      });
    } finally {
      setIsDeduplicating(false);
    }
  };

  // Format processing time for display
  const formatProcessingTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get error message with context
  const getErrorMessage = (result: DeduplicationResult) => {
    const baseMessage = result.error || 'An unknown error occurred during deduplication.';
    
    if (result.errorType === 'CONCURRENT_OPERATION') {
      return `${baseMessage} This is a safety feature to prevent data corruption.`;
    }
    
    if (result.errorType === 'CRITICAL_ERROR') {
      return `${baseMessage} The operation was safely aborted to prevent data corruption.`;
    }
    
    return baseMessage;
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Concept Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Concept Statistics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Concept Statistics</h3>
              <p>Total Concepts: {concepts.length}</p>
              <p>Average Confidence: {(concepts.reduce((sum, c) => sum + c.confidence_score, 0) / concepts.length || 0).toFixed(2)}</p>
            </div>

            {/* Deduplication Controls */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Concept Deduplication</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Similarity Threshold</label>
                  <Select 
                    value={threshold.toString()} 
                    onValueChange={(value) => setThreshold(parseFloat(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Similarity Threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0.5, 0.6, 0.7, 0.8, 0.9, 0.95].map((val) => (
                        <SelectItem key={val} value={val.toString()}>
                          {val} ({val >= 0.9 ? 'Very Strict' : val >= 0.8 ? 'Strict' : val >= 0.7 ? 'Moderate' : 'Loose'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>

                {showAdvanced && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Concepts to Process</label>
                    <Select 
                      value={maxConcepts.toString()} 
                      onValueChange={(value) => setMaxConcepts(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Processing Limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[100, 500, 1000, 2000, 5000].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val} concepts max
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher limits may take longer to process
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleDeduplication} 
                  disabled={isDeduplicating || concepts.length === 0}
                  className="w-full"
                  variant={concepts.length === 0 ? "secondary" : "default"}
                >
                  {isDeduplicating ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> 
                      Processing {concepts.length} concepts...
                    </>
                  ) : concepts.length === 0 ? (
                    'No Concepts to Deduplicate'
                  ) : (
                    `Deduplicate ${concepts.length} Concepts`
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Deduplication Result Display */}
          {deduplicationResult && (
            <div className="mt-4 space-y-3">
              {deduplicationResult.success ? (
                <>
                  <Alert variant="default">
                    <CheckCircleIcon className="h-4 w-4" />
                    <AlertTitle>Deduplication Completed Successfully</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Concepts Merged:</strong> {deduplicationResult.mergedCount || 0}
                          </div>
                          <div>
                            <strong>Aliases Added:</strong> {deduplicationResult.aliasesAdded || 0}
                          </div>
                          <div>
                            <strong>Merge Operations:</strong> {deduplicationResult.totalOperations || 0}
                          </div>
                          <div>
                            <strong>Processing Time:</strong> {formatProcessingTime(deduplicationResult.processingTime)}
                          </div>
                        </div>
                        {deduplicationResult.conceptsProcessed && (
                          <div className="text-sm mt-2">
                            <strong>Concepts Processed:</strong> {deduplicationResult.conceptsProcessed}
                          </div>
                        )}
                        {deduplicationResult.failedMerges && deduplicationResult.failedMerges > 0 && (
                          <div className="text-sm mt-2 text-orange-600">
                            <strong>Note:</strong> {deduplicationResult.failedMerges} merge operations failed but were safely handled.
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {deduplicationResult.warning && (
                    <Alert variant="default" className="border-orange-200 bg-orange-50">
                      <AlertCircleIcon className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Warning</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        {deduplicationResult.warning}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>
                    Deduplication Failed
                    {deduplicationResult.errorType && ` (${deduplicationResult.errorType})`}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>{getErrorMessage(deduplicationResult)}</div>
                      {deduplicationResult.errorType === 'CONCURRENT_OPERATION' && (
                        <div className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-400 mt-2">
                          <strong>What this means:</strong> Another deduplication process is currently running. 
                          Please wait for it to complete before starting a new one.
                        </div>
                      )}
                      {deduplicationResult.errorType === 'CRITICAL_ERROR' && (
                        <div className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-400 mt-2">
                          <strong>What this means:</strong> A critical error occurred, but your data is safe. 
                          The system prevented any potentially corrupting operations.
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concept List Section */}
      <Card>
        <CardHeader>
          <CardTitle>Concept List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {concepts.map((concept) => (
              <div 
                key={concept._id} 
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <h4 className="font-semibold text-lg">{concept.name}</h4>
                <p className="text-sm text-gray-600 truncate">{concept.description}</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span>Confidence: {(concept.confidence_score * 100).toFixed(0)}%</span>
                  <span>Aliases: {concept.aliases.length}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}