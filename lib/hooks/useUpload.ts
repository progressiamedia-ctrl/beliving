'use client';

import { useState, useCallback } from 'react';

interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}

export function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File, userId: string, bucket: string = 'properties'): Promise<UploadResult | null> => {
    // Validate file
    if (!file) {
      setError('No file selected');
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      return null;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return null;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('user_id', userId);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });

      // Handle completion
      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setProgress(100);
            resolve(response);
          } else {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      return null;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[], userId: string, bucket: string = 'properties'): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await uploadFile(file, userId, bucket);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }, [uploadFile]);

  return {
    loading,
    error,
    progress,
    uploadFile,
    uploadMultiple
  };
}
