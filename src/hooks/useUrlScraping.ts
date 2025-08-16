'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface UrlScrapingResult {
  success: boolean;
  title?: string;
  error?: string;
  documentId?: string;
}

interface UrlScrapingHook {
  url: string;
  progress: number;
  error: string | null;
  documentId: string | null;
  scrapeUrl: (url: string) => Promise<void>;
  resetScraping: () => void;
}

export const useUrlScraping = (): UrlScrapingHook => {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const scrapeUrlAction = useAction(api.documents.scrapeUrl);

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const urlObject = new URL(inputUrl);
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const resetScraping = () => {
    setUrl('');
    setProgress(0);
    setError(null);
    setDocumentId(null);
  };

  const scrapeUrl = async (inputUrl: string): Promise<void> => {
    // Reset previous state
    setError(null);
    setProgress(0);
    setDocumentId(null);

    // Validate URL
    if (!validateUrl(inputUrl)) {
      setError('Please enter a valid HTTP or HTTPS URL');
      return;
    }

    setUrl(inputUrl);

    try {
      // Start scraping progress
      setProgress(20);

      // Simulate progress during scraping
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 80));
      }, 500);

      try {
        // Scrape URL using Convex action
        const result: UrlScrapingResult = await scrapeUrlAction({ url: inputUrl });
        
        clearInterval(progressInterval);

        if (result.success) {
          setProgress(100);
          // Use the actual documentId returned from the scraping action
          setDocumentId(result.documentId || null);
        } else {
          setError(result.error || 'Failed to scrape URL');
          setProgress(0);
        }
      } catch (actionError) {
        clearInterval(progressInterval);
        throw actionError;
      }
    } catch (scrapingError) {
      // Handle different error scenarios
      const errorMessage = scrapingError instanceof Error 
        ? scrapingError.message 
        : 'URL scraping failed. Please try again.';
      
      setError(errorMessage);
      console.error(scrapingError);
      setProgress(0);
    }
  };

  return {
    url,
    progress,
    error,
    documentId,
    scrapeUrl,
    resetScraping,
  };
};