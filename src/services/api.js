// src/services/api.js
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function isExpectedGenerationState(error) {
  const message = error?.message?.toLowerCase() || '';

  return Boolean(
    error?.retryable ||
      message.includes('no gpu was available') ||
      message.includes('servers are busy') ||
      message.includes('retry in a minute')
  );
}

/**
 * Generate virtual try-on via the local backend route.
 * @param {{ bucket: string, path: string }} personImage - Stored person image reference
 * @param {{ bucket: string, path: string }} garmentImage - Stored garment image reference
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {AbortSignal} signal - Abort signal for canceling the request
 * @returns {Promise<string>} Base64 result image data
 */
export async function generateTryOn(personImage, garmentImage, onProgress, signal) {
  try {
    onProgress?.(10);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    if (!personImage?.bucket || !personImage?.path) {
      throw new Error('Missing person image storage reference');
    }

    if (!garmentImage?.bucket || !garmentImage?.path) {
      throw new Error('Missing garment image storage reference');
    }

    console.log('Calling /api/generate-tryon...');
    onProgress?.(30);

    const response = await fetch(`${API_BASE_URL}/generate-tryon`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        personImage,
        garmentImage,
      }),
    });

    onProgress?.(90);

    const payload = await response.json().catch(() => ({}));

    if (payload.retryable && payload.error) {
      const retryableError = new Error(payload.error);
      retryableError.retryable = true;
      retryableError.code = payload.code || 'MODEL_BUSY';
      throw retryableError;
    }

    if (!response.ok) {
      throw new Error(payload.error || `API request failed: ${response.status}`);
    }

    if (!payload.resultImageData) {
      throw new Error('API returned no result image');
    }

    if (
      typeof payload.resultImageData !== 'string' ||
      !payload.resultImageData.startsWith('data:')
    ) {
      throw new Error('Invalid result format - not a valid image');
    }

    onProgress?.(100);
    console.log('Result received from /api/generate-tryon');
    return payload.resultImageData;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const canceledError = new Error('Generation canceled');
      canceledError.code = 'GENERATION_CANCELED';
      throw canceledError;
    }

    if (isExpectedGenerationState(error)) {
      console.warn('AI generation is temporarily unavailable:', error.message);
    } else {
      console.error('AI generation failed:', error);
    }

    throw error;
  }
}

export async function checkAPIStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json();
    console.log('API Health:', data);
    return res.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}
