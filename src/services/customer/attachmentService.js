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
        if (error) {
            console.warn('File validation warning:', error);
            return null;
        }

        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        // Construct path: user_id/random_uuid.ext
        const safeUserId = userId || 'customer_anon';
        const filePath = `${safeUserId}/${uuidv4()}.${fileExt}`;

        try {
            const { data, error: uploadError } = await supabase.storage
                .from('request_attachments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.warn('Supabase Storage notice (will use local preview mirror):', uploadError.message);
                return null;
            }

            // Return path and public URL
            const { data: publicData } = supabase.storage
                .from('request_attachments')
                .getPublicUrl(data.path);

            return {
                path: data.path,
                url: publicData?.publicUrl || null
            };
        } catch (storageErr) {
            console.warn('Supabase storage catch (using dataUrl fallback):', storageErr);
            return null;
        }
    },

    getPublicUrl: (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
            return filePath;
        }
        const { data } = supabase.storage.from('request_attachments').getPublicUrl(filePath);
        return data?.publicUrl || filePath;
    }
};
