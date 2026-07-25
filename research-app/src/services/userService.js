import apiClient from "./api"

export const userService = {
    signup: async (data) => {
        try {
            const res = await apiClient.post('/users', {
                userName: data.name,
                userEmail: data.email,
                userPassword: data.password
            });
            return res.status;
        } catch (error) {
            console.error(error.response?.data?.message || 'Signup failed');
            throw new Error(error);
        }
    },

    login: async (data) => {
        try {
            const res = await apiClient.post('/users/login', {
                userEmail: data.email,
                userPassword: data.password
            });
            return {success: true};
        } catch (error) {
            return {success: false, message: "Invalid Credentials"};
        }
    },

    updateUser: async (id, data) => {
        try {
            console.log(data);
            const res = await apiClient.put(`/users/${id}`, data);
            if (res.status === 200) {
                return { success: true, message: 'User updated successfully' };
            }
            return res.data;
        } catch (error) {
            if (error.response.data) {
                return error.response.data;
            }
            if (error.response) {
                if (error.response.status === 400) {
                    return { success: false, message: error.response.data.message || 'Bad Request' };
                }
            } else {
                console.error('Error updating user:', error.message);
            }
        }
    },

    changePassword: async (newPassword) => {
        try {
            const res = await apiClient.post('/users/change-password', { newPassword });
            return res.data;
        } catch (error) {
            console.error(error.response?.data?.message || 'Failed to change password');
            throw new Error(error);
        }
    },

    logout: async () => {
        try {
            await apiClient.post('/users/logout');
        } catch (error) {
            console.error('Error during logout:', error);
            throw new Error('Error during logout:', error);
        }
    },

    deleteUser: async (id) => {
        try {
            const res = await apiClient.delete(`/users/${id}`);
            if (res.status === 200) {
                return { success: true, message: 'User deleted successfully' };
            }
            return res.data;
        } catch (error) {
            if (error.response.status === 400) {
                return { success: false, message: error.response.data.message || 'Bad Request' };
            } else {
                return { success: false, message: `Error code: ${error.response.status}` || 'Bad Request' };
            }
            
        }
    },

    getUser: async () => {
        try {
            const res = await apiClient.get('/users/me');
            return res.data;
        } catch (error) {
            console.error('Error trying to get user:', error);
            return null;
        }
    },

    checkTokens: async () => {
        try {
            await apiClient.get('/users/check');
            return true;
        } catch (error) {
            if(error.status !== 401){
                console.error('Error checking privilege:', error);
                return false;
            } else {
                return false;
            }
            
        }
    },

    checkForExistingUser: async (data) => {
        try {
            const res = await apiClient.post('/users/exists', data);
            if(res.status === 200){
                return {exists: false};
            }

            if(res.status === 409){
                if(res.data.message === 'User email already exists'){
                    return {exists: true, field: 'email'};
                }
                return {exists: true, field: 'name'};
            }

            return res.data;
        } catch (error) {
            if(error.response){
                if(error.response.status === 409){
                    if(error.response.data.message === 'User email already exists'){
                        return {exists: true, field: 'email'};
                    }
                    return {exists: true, field: 'name'};
                }
            }
        }
    },

    getUsers: async (params = {}) => {
        try{
            const res = await apiClient.get('/users/all', { params });
            return res.data;
        }catch(error){
            console.error('Error getting users:', error);
            throw new Error(error);
        }
    }
}