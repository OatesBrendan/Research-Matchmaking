import apiClient from "./api"

export const emailService = {
    verifyEmail: async (email, code) => {
        try {
            const res = await apiClient.post('/email/verify', {
                _to: email,
                verification_code: code,
            });
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Email verification failed');
        }
    },

    sendVerificationEmail: async (email) => {
        try {
            const res = await apiClient.post('/email/email', {
                _to: email,
            });
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to send verification email');
        }
    }
}