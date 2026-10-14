import { client } from '@gradio/client';
import { createClient } from '@supabase/supabase-js';

const HF_SPACE_NAME = process.env.HF_SPACE_NAME || 'yisol/IDM-VTON';
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_BUCKETS = new Set(['person-images', 'garment-images']);

function isModelBusyError(message = '') {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('no gpu was available') ||
    normalizedMessage.includes('retry later') ||
    normalizedMessage.includes('queue is full') ||
    normalizedMessage.includes('too many requests')
  );
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length);
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseAnonKey };
}

async function readJsonBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += bufferChunk.length;

    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      throw new Error('Request body too large');
    }

    chunks.push(bufferChunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function createServerSupabase(accessToken) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireUser(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw new Error('Authentication required');
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid or expired session');
  }

  return token;
}

function isStorageReference(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.bucket === 'string' &&
    ALLOWED_IMAGE_BUCKETS.has(value.bucket) &&
    typeof value.path === 'string' &&
    value.path.length > 0 &&
    value.path.length <= 512 &&
    !value.path.startsWith('/')
  );
}

function encodeStoragePath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildPublicStorageUrl(fileRef) {
  const { supabaseUrl } = getSupabaseConfig();
  const publicUrl = new URL(
    `/storage/v1/object/public/${fileRef.bucket}/${encodeStoragePath(fileRef.path)}`,
    supabaseUrl
  );

  return publicUrl.toString();
}

async function fetchRequiredBlob(url, label) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label}: ${response.status}`);
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error(`${label} is empty`);
  }

  return blob;
}

async function downloadStoredBlob(accessToken, fileRef, label) {
  const supabase = createServerSupabase(accessToken);
  const { data, error } = await supabase.storage
    .from(fileRef.bucket)
    .download(fileRef.path);

  if (data && data.size > 0) {
    return data;
  }

  const storageFailure = error?.message || `${label} is empty`;
  const publicUrl = buildPublicStorageUrl(fileRef);

  try {
    const blob = await fetchRequiredBlob(publicUrl, `${label} from public storage`);

    console.warn(
      `Falling back to public storage fetch for ${label}: ${storageFailure}`
    );

    return blob;
  } catch (fallbackError) {
    throw new Error(
      `Failed to download ${label}: ${storageFailure}. Public fallback failed: ${fallbackError.message}`
    );
  }
}

async function resolveImageBlob(accessToken, imageSource, label) {
  if (isStorageReference(imageSource)) {
    return downloadStoredBlob(accessToken, imageSource, label);
  }

  throw new Error(`Invalid ${label} reference`);
}

async function blobToDataUrl(blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const mimeType = blob.type || 'image/jpeg';

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function normalizeResultImage(resultImageData) {
  if (!resultImageData) {
    throw new Error('Result image is null or undefined');
  }

  if (
    typeof resultImageData === 'string' &&
    resultImageData.startsWith('data:')
  ) {
    return resultImageData;
  }

  let resultUrl = null;

  if (
    typeof resultImageData === 'string' &&
    resultImageData.startsWith('http')
  ) {
    resultUrl = resultImageData;
  } else if (
    typeof resultImageData === 'object' &&
    resultImageData.url
  ) {
    resultUrl = resultImageData.url;
  }

  if (!resultUrl) {
    throw new Error('Invalid result format - not a valid image');
  }

  const blob = await fetchRequiredBlob(resultUrl, 'result image');
  return blobToDataUrl(blob);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = await requireUser(req);

    const { personImage, garmentImage } = await readJsonBody(req);

    const connectPromise = client(HF_SPACE_NAME);
    const connectTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout (30s)')), 30000)
    );

    const app = await Promise.race([connectPromise, connectTimeout]);

    const personBlob = await resolveImageBlob(
      accessToken,
      personImage,
      'person image'
    );
    const garmentBlob = await resolveImageBlob(
      accessToken,
      garmentImage,
      'garment image'
    );

    const predictPromise = app.predict('/tryon', [
      {
        background: personBlob,
        layers: [],
        composite: null,
      },
      garmentBlob,
      'Virtual try-on',
      true,
      true,
      30,
      42,
    ]);

    const predictionTimeout = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Generation timeout (3 minutes). HF Space may be overloaded.'
            )
          ),
        180000
      )
    );

    const result = await Promise.race([predictPromise, predictionTimeout]);

    if (!result || !result.data || !result.data[0]) {
      throw new Error('No data returned from AI model');
    }

    const resultImageData = await normalizeResultImage(result.data[0]);

    return res.status(200).json({ resultImageData });
  } catch (error) {
    const message =
      error?.message || 'Failed to generate try-on. Please try again.';

    if (isModelBusyError(message)) {
      return res.status(200).json({
        error: 'AI servers are busy right now. No GPU was available. Please retry in a minute.',
        retryable: true,
        code: 'MODEL_BUSY',
      });
    }

    const statusCode =
      message === 'Authentication required' ||
      message === 'Invalid or expired session'
        ? 401
        : message === 'Request body too large'
          ? 413
          : message.includes('Invalid') && message.includes('reference')
            ? 400
        : 500;

    console.error('API /generate-tryon failed:', error);
    return res.status(statusCode).json({ error: message });
  }
}
