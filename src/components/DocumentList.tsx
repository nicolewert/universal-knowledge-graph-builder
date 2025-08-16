'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

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

  const getStatusVariant = (status: Document['processing_status']) => {
    switch (status) {
      case 'uploading': return 'secondary';
      case 'processing': return 'outline';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
      {documents.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Documents</AlertTitle>
          <AlertDescription>
            You haven&apos;t uploaded any documents yet.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc._id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">
                  {doc.title}
                </CardTitle>
                <Badge 
                  variant={getStatusVariant(doc.processing_status)}
                  className="capitalize"
                >
                  {doc.processing_status}
                </Badge>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};