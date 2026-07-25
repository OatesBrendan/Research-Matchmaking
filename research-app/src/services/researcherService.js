import apiClient from "./api"

export const researcherService = {
    getResearchers: async (params = {}) => {
        try{
            const res = await apiClient.get('/researchers', { params });
            return res.data;
        }catch(error){
            console.error("Error fetching researcher:", error);
            throw error;
        }
    },

    getResearcherById: async (id) => {
        try{
            const res = await apiClient.get(`/researchers/${id}`);
            return res.data;
        }catch(error){
            console.error("Error fetching researchers:", error);
            throw error;
        }
    },

    updateResearcher: async (id, data) => {
        if (!id || !data){
            throw new Error("Invalid parameters: id and data are required");
        }
        

        try{
            const res = await apiClient.put(`/researchers/${id}`, data);
            if (res.status === 200) {
                return { success: true, message: 'Researcher updated successfully' };
            }
            return res.data;
        }catch(error){
            console.error('Error updating researcher:', error);
            throw error;
        }
    },

    getPublications: async (params = {}) => {
        try{
            const res = await apiClient.get('/publications/all', {params});
            return res.data;
        }catch(error){
            console.error('Error fetching all publications:', error);
            throw error;
        }
    },

    deleteResearcher: async (id) => {
        try {
            const res = await apiClient.delete(`/researchers/${id}`);  
            if (res.status === 200) {
                return { success: true, message: 'Researcher deleted successfully' };
            }   
            return res.data;
        } catch (error) {
            if (error.response && error.response.status === 400) {
                return { success: false, message: error.response.data.message || 'Bad Request' };
            } else {
                return { success: false, message: `Error code: ${error.response ? error.response.status : 'Network Error'}` || 'Bad Request' };
            }
        }
    },

    getResearcherTags: async (id) => {
        try {
            const res = await apiClient.get(`/researchers/${id}/tags`);
            return res.data;
        } catch (error) {
            console.error('Error fetching researcher tags:', error);
            throw error;
        }
    },

    getResearcherSkills: async (id) => {
        try {
            const res = await apiClient.get(`/researchers/${id}/skills`);
            return res.data;
        } catch (error) {
            console.error('Error fetching researcher skills:', error);
            throw error;
        }
    }
}