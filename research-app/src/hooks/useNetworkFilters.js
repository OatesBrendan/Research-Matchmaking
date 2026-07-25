import { useState, useCallback } from 'react';

export const useNetworkFilters = () => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedArea: '',
    selectedTechnicalSkills: []
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      selectedArea: '',
      selectedTechnicalSkills: []
    });
  }, []);

  const hasActiveFilters = filters.searchTerm || 
                          filters.selectedArea || 
                          filters.selectedTechnicalSkills.length > 0;

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters
  };
};