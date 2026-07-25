import { useMemo } from 'react';
import { researcherService } from '../services/researcherService';
import { buildNetworkGraph } from '../components/utils/networkDataBuilder';
import { useQuery } from '@tanstack/react-query';

// useQuery to cache the results
const useResearchers = (params) => {
  return useQuery({
    queryKey: ['researchers', params],
    queryFn: async () => {
      const firstPage = await researcherService.getResearchers(params);
      let allData = firstPage.data || [];

      const totalPages = firstPage.totalPages || 1;
      if (totalPages > 1) {
        const promises = Array.from({ length: totalPages - 1 }, (_, i) =>
          researcherService.getResearchers({ ...params, page: i + 2 })
        );
        const responses = await Promise.all(promises);
        responses.forEach(res => {
          allData = [...allData, ...(res.data || [])];
        });
      }

      return {
        allResearchers: allData,
        totalCount: firstPage.totalCount || allData.length
      };
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

export const useNetworkData = (filters) => {
  const params = useMemo(() => ({
    page: 1,
    limit: 100,
    withPublications: true,
    ...(filters.selectedArea && { researchAreas: [filters.selectedArea] }),
    ...(filters.selectedTechnicalSkills.length > 0 && {
      technicalSkills: filters.selectedTechnicalSkills
    })
  }), [filters.selectedArea, filters.selectedTechnicalSkills]);

  const { data, isLoading, error, refetch } = useResearchers(params);

  // Apply search filter using useMemo - doesn't cause re-fetch
  const filteredResearchers = useMemo(() => {
    if (!data?.allResearchers) return [];

    const term = filters.searchTerm.toLowerCase();
    return data.allResearchers.filter(r => r.name.toLowerCase().includes(term));
  }, [data?.allResearchers, filters.searchTerm]);

  const networkData = useMemo(
    () => buildNetworkGraph(filteredResearchers),
    [filteredResearchers]
  );

  return {
    researchers: filteredResearchers,
    allResearchers: data?.allResearchers || [], // For autocomplete
    networkData,
    loading: isLoading,
    error: error?.message || null,
    totalCount: data?.totalCount || 0,
    refetch
  };
};