'use client';

import React, { useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, UploadCloud } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

export const DocumentUpload: React.FC = () => {
  const { file, progress, error, uploadFile, resetUpload } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      uploadFile(droppedFiles[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFile(selectedFiles[0]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".txt"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop a TXT file here, or{' '}
            <Button
              type="button"
              variant="link"
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </Button>
          </p>
          <p className="text-xs text-gray-500">
            Max file size: 100MB. Only TXT files allowed.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {file && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">{file.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetUpload}
            >
              Cancel
            </Button>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
};