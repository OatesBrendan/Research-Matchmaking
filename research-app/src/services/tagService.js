import apiClient from "./api"
export const tagService = {
  getResearchAreas: async () => {
    try {
      const response = await apiClient.get('/tags/research-areas');
      return response.data;
    } catch (error) {
      console.error('Error fetching research areas:', error);
      throw error;
    }
  },

  getTechnicalSkills: async () => {
    try {
      const response = await apiClient.get('/tags/technical-skills');
      return response.data;
    } catch (error) {
      console.error('Error fetching technical skills:', error);
      throw error;
    }
  },

  getAdminAreas: async (params = {}) => {
    try {
      const response = await apiClient.get('/tags/admin/research-areas', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching research areas:', error);
      throw error;
    }
  },

  getAdminSkills: async (params = {}) => {
    try {
      const response = await apiClient.get('/tags/admin/technical-skills', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching technical skills:', error);
      throw error;
    }
  },

  createAreaOrSkill: async (data) => {
    try {
      const response = await apiClient.post('/tags/create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating research area or technical skill:', error);
      throw error;
    }
  },

  deleteTags: async (data) => {
    try {
      const response = await apiClient.delete('/tags/delete', { data });
      return response.data;
    } catch (error) {
      console.error('Error deleting tags:', error);
      throw error;
    }
  },

  assignAllSkills: async () => {
    try {
      const response = await apiClient.get('/tags/all-description-embeddings');
      return response.data;
    } catch (error) {
      console.error('Error assigning all skills:', error);
      throw error;
    }
  },

  assignAllAreas: async () => {
    try {
      const response = await apiClient.get('/tags/all-research-areas');
      return response.data;
    } catch (error) {
      console.error('Error assigning all areas:', error);
      throw error;
    }
  },

  areaEmbeddings: async () => {
    try {
      const response = await apiClient.get('/tags/area-embeddings');
      return response.data;
    } catch (error) {
      console.error('Error fetching area embeddings:', error);
      throw error;
    }
  },

  skillEmbeddings: async () => {
    try {
      const response = await apiClient.get('/tags/skill-embeddings');
      return response.data;
    } catch (error) {
      console.error('Error fetching skill embeddings:', error);
      throw error;
    }
  },




};