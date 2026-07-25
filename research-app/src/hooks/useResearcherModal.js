import { useState, useCallback, useEffect } from 'react';

export const useResearcherModal = () => {
  const [selectedResearcher, setSelectedResearcher] = useState(null);

  const openModal = useCallback((researcher) => {
    setSelectedResearcher(researcher);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedResearcher(null);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedResearcher) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedResearcher, closeModal]);

  return {
    selectedResearcher,
    isOpen: !!selectedResearcher,
    openModal,
    closeModal
  };
};