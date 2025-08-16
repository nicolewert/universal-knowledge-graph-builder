'use client';

import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface UrlInputProps {
  onUrlSubmit?: (url: string) => Promise<void>;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const scrapeUrl = useAction(api.documents.scrapeUrl);

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const urlObject = new URL(inputUrl);
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateUrl(url)) {
      setError('Please enter a valid HTTP or HTTPS URL');
      return;
    }

    setIsLoading(true);
    try {
      if (onUrlSubmit) {
        // Use custom handler if provided
        await onUrlSubmit(url);
      } else {
        // Use built-in Convex scraping
        const result = await scrapeUrl({ url });
        if (result.success) {
          setSuccess(`Successfully scraped: ${result.title}`);
        } else {
          setError(result.error || 'Failed to scrape URL');
        }
      }
      setUrl(''); // Clear input after successful submission
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !url}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping
              </>
            ) : (
              'Scrape'
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

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};