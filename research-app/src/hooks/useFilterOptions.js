import { useState, useEffect } from 'react';
import { researcherService } from '../services/researcherService';

export const useFilterOptions = () => {
  const [researchAreas, setResearchAreas] = useState([]);
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await researcherService.getResearchers({
          page: 1,
          limit: 1000,
          withPublications: false
        });

        const areas = new Set();
        const skills = new Set();

        (response.data || []).forEach(r => {
          r.researchAreas?.forEach(area => areas.add(area));
          r.technicalSkills?.forEach(skill => skills.add(skill));
        });

        setResearchAreas(Array.from(areas).sort());
        setTechnicalSkills(Array.from(skills).sort());
      } catch (err) {
        console.error('Error fetching filter options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { researchAreas, technicalSkills, loading };
};