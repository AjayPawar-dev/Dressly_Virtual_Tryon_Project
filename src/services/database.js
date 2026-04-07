// src/services/database.js
import { supabase } from '@/lib/supabase';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function validateImageUpload(file) {
  if (!(file instanceof File)) {
    throw new Error('A valid image file is required');
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG, and WebP files are supported');
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size must be between 1 byte and 10MB');
  }
}

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} bucket - Bucket name (person-images, garment-images, results)
 * @param {string} folder - Optional folder path
 * @returns {Promise<Object>} Uploaded image metadata
 */
export async function uploadImage(file, bucket, folder = '') {
  try {
    validateImageUpload(file);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const folderPath = folder ? `${user.id}/${folder}` : user.id;
    const filePath = `${folderPath}/${fileName}`;

    console.log(`Uploading to ${bucket}/${filePath}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('Upload successful:', urlData.publicUrl);
    return {
      publicUrl: urlData.publicUrl,
      bucket,
      path: data?.path || filePath,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Save try-on record to database
 * @param {string} personImageUrl - URL of person image
 * @param {string} garmentImageUrl - URL of garment image
 * @param {string} resultImageUrl - URL of result image (optional)
 * @param {string} status - Status: pending, processing, completed, failed
 * @returns {Promise<Object>} Created try-on record
 */
export async function saveTryOn(personImageUrl, garmentImageUrl, resultImageUrl = null, status = 'pending') {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Saving try-on to database...');

    const { data, error } = await supabase
      .from('tryons')
      .insert([
        {
          user_id: user.id,
          person_image_url: personImageUrl,
          garment_image_url: garmentImageUrl,
          result_image_url: resultImageUrl,
          status,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('Try-on saved:', data.id);
    return data;
  } catch (error) {
    console.error('Save failed:', error);
    throw new Error(`Failed to save try-on: ${error.message}`);
  }
}

/**
 * Update try-on record
 * @param {string} tryonId - Try-on ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated try-on record
 */
export async function updateTryOn(tryonId, updates) {
  try {
    console.log('Updating try-on:', tryonId);

    const { data, error } = await supabase
      .from('tryons')
      .update(updates)
      .eq('id', tryonId)
      .select()
      .single();

    if (error) throw error;

    console.log('Try-on updated');
    return data;
  } catch (error) {
    console.error('Update failed:', error);
    throw new Error(`Failed to update try-on: ${error.message}`);
  }
}

/**
 * Get user's try-on history
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} Array of try-on records
 */
export async function getTryOns(limit = 50) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Fetching try-on history...');

    const { data, error } = await supabase
      .from('tryons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    console.log(`Fetched ${data.length} try-ons`);
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw new Error(`Failed to fetch try-ons: ${error.message}`);
  }
}

/**
 * Delete try-on record
 * @param {string} tryonId - Try-on ID to delete
 * @returns {Promise<void>}
 */
export async function deleteTryOn(tryonId) {
  try {
    console.log('Deleting try-on:', tryonId);

    const { error } = await supabase
      .from('tryons')
      .delete()
      .eq('id', tryonId);

    if (error) throw error;

    console.log('Try-on deleted');
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error(`Failed to delete try-on: ${error.message}`);
  }
}
