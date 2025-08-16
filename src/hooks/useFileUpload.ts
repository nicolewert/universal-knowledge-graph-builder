import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface FileUploadHook {
  file: File | null;
  progress: number;
  error: string | null;
  uploadFile: (file: File) => Promise<void>;
  resetUpload: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = ['text/plain'];

export const useFileUpload = (): FileUploadHook => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const createDocument = useMutation(api.documents.createDocument);

  const validateFile = (selectedFile: File): boolean => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Only TXT files are allowed');
      return false;
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File must be 100MB or smaller');
      return false;
    }

    return true;
  };

  const uploadFile = async (selectedFile: File): Promise<void> => {
    // Reset previous state
    setError(null);
    setProgress(0);

    // Validate file
    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);

    try {
      // Update progress to show starting
      setProgress(25);

      // Read file content
      const text = await selectedFile.text();
      setProgress(50);

      // Create document in Convex
      await createDocument({
        title: selectedFile.name.replace('.txt', ''),
        content: text,
        source_type: 'file',
        file_size: selectedFile.size,
      });
      
      setProgress(100);
    } catch (uploadError) {
      setError('Upload failed. Please try again.');
      console.error(uploadError);
      setProgress(0);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setError(null);
  };

  return {
    file,
    progress,
    error,
    uploadFile,
    resetUpload,
  };
};