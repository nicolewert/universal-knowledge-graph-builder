'use client';

import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2, Link2, Check } from 'lucide-react';
import { useUrlScraping } from '@/hooks/useUrlScraping';

interface UrlInputProps {
  onUrlSubmit?: (url: string) => Promise<void>;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit }) => {
  const [inputUrl, setInputUrl] = useState<string>('');
  const { 
    url, 
    progress, 
    error, 
    documentId, 
    scrapeUrl, 
    resetScraping 
  } = useUrlScraping();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onUrlSubmit) {
      await onUrlSubmit(inputUrl);
    } else {
      await scrapeUrl(inputUrl);
    }
  };

  const handleReset = () => {
    resetScraping();
    setInputUrl('');
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url-input">URL to Scrape</Label>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            id="url-input"
            type="text"
            placeholder="https://example.com"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            disabled={progress > 0}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            disabled={!inputUrl || progress > 0}
          >
            {progress > 0 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />Scrape
              </>
            )}
          </Button>
        </form>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>URL Submission Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(progress > 0 || documentId) && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm truncate max-w-[70%]">
              {documentId ? 'Scraping Complete' : `Scraping: ${url}`}
            </span>
            {documentId ? (
              <Check className="text-green-500 h-5 w-5" />
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
              >
                Cancel
              </Button>
            )}
          </div>
          <Progress 
            value={progress} 
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};