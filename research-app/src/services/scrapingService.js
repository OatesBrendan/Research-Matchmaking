// services/scrapingService.js
import apiClient from "./api";
import { researcherService } from "./researcherService";
import { userService } from "./userService";

export const scrapingService = {
  // Create a new scraping job
  createScrapingJob: async (data) => {
    try {
      if(data.researcher){
        data.researcherId = data.researcher._id;
      }
      const res = await apiClient.post('/data/start', data);
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to create scraping job');
      throw new Error(error);
    }
  },

  // Get all scraping jobs
  getScrapingJobs: async (params = {}) => {
    try {
      const res = await apiClient.get('/data/jobs', { params });
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch scraping jobs');
      throw new Error(error);
    }
  },

  // Get a specific scraping job
  getScrapingJob: async (jobId) => {
    try {
      const res = await apiClient.get(`/data/jobs/${jobId}`);
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch scraping job');
      throw new Error(error);
    }
  },

  // Update a scraping job
  updateScrapingJob: async (jobId, data) => {
    try {
      const res = await apiClient.put(`/data/jobs/${jobId}`, data);
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to update scraping job');
      throw new Error(error);
    }
  },

  // Delete a scraping job
  deleteScrapingJob: async (jobId) => {
    try {
      const res = await apiClient.delete(`/data/jobs/${jobId}`);
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to delete scraping job');
      throw new Error(error);
    }
  },

  // Get scraping logs
  getScrapingLogs: async (params = {}) => {
    try {
      const res = await apiClient.get('/data/logs', { params });
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch scraping logs');
      throw new Error(error);
    }
  },

  // Scrape a specific researcher now
  scrapeResearcherNow: async (researcherId) => {
    try {
      const res = await apiClient.post('/data/start', {
        scope: 'single',
        researcherId,
        source: 'orcid'
      });
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to start scraping');
      throw new Error(error);
    }
  },

  // Scrape all researchers now
  scrapeAllNow: async () => {
    try {
      const res = await apiClient.post('/data/start', {
        scope: 'all',
        source: 'orcid'
      });
      return res.data;
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to start scraping');
      throw new Error(error);
    }
  },

  // gets the stats for admin dashboard (only gets the minimum to rechieve the information it needs hence limit 1)
  getStats: async () => {
    try{
      const researcherStats = await researcherService.getResearchers({withPublications: true, limit: 1});
      const userStats = await userService.getUsers({limit: 1});
      return {
        totalResearchers: researcherStats.totalCount,
        totalPublications: researcherStats.totalPubs,
        totalusers: userStats.totalCount
      }
    }catch(error){
      console.error(error.response?.data?.message || 'Failed to get stats');
      throw new Error(error);
    }
  }
};