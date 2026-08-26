import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const attachmentService = {
    // Limit to 5MB max natively
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

    validateFile: (file) => {
        if (!file) return 'No file provided';

        if (!attachmentService.ALLOWED_TYPES.includes(file.type)) {
            return `File type ${file.type} not supported. Use JPG, PNG, WEBP, or PDF.`;
        }

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > attachmentService.MAX_SIZE_MB) {
            return `File is too large (${sizeMb.toFixed(1)}MB). Maximum is ${attachmentService.MAX_SIZE_MB}MB.`;
        }

        return null;
    },

    /**
     * Upload an attachment natively onto Supabase maintaining User RLS folder ownership
     * @param {File} file 
     * @param {string} userId - Auth user ID to maintain folder structures neatly
     */
    uploadAttachment: async (file, userId) => {
        const error = attachmentService.validateFile(file);
        if (error) throw new Error(error);

        const fileExt = file.name.split('.').pop();
        // Construct path: user_id/random_uuid.ext
        const filePath = `${userId}/${uuidv4()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
            .from('request_attachments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            throw new Error('Failed to upload file to secured storage.');
        }

        // Return path relative to bucket
        return data.path;
    },

    getPublicUrl: (filePath) => {
        if (!filePath) return null;
        // The bucket is private, but if we need a temporary signed URL:
        return supabase.storage.from('request_attachments').createSignedUrl(filePath, 3600);
    }
};
