'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';

type ProcessingStatus = 'processing' | 'completed' | 'failed';

interface ProcessingIndicatorProps {
  status: ProcessingStatus;
  conceptsCount?: number;
  relationshipsCount?: number;
  error?: string;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  status,
  conceptsCount = 0,
  relationshipsCount = 0,
  error
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Analyzing Document';
      case 'completed':
        return 'Analysis Complete';
      case 'failed':
        return 'Analysis Failed';
    }
  };

  const getProgressValue = () => {
    switch (status) {
      case 'processing':
        return 60; // Simulated progress
      case 'completed':
        return 100;
      case 'failed':
        return 0;
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'processing':
        return 'outline';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
          {getStatusText()}
        </CardTitle>
        <Badge variant={getStatusVariant()} className="capitalize">
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={getProgressValue()} className="w-full" />
        
        {status !== 'failed' && (
          <div className="text-xs text-muted-foreground flex justify-between">
            <div>Concepts Extracted: {conceptsCount}</div>
            <div>Relationships Mapped: {relationshipsCount}</div>
          </div>
        )}
        
        {status === 'failed' && error && (
          <div className="text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};