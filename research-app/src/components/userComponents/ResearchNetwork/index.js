import React from 'react';
import NetworkChart from './NetworkChart';
import NetworkFilters from './NetworkFilters';
import ResearcherModal from './ResearcherModal';
import { useNetworkData } from '../../../hooks/useNetworkData';
import { useNetworkFilters } from '../../../hooks/useNetworkFilters';
import { useResearcherModal } from '../../../hooks/useResearcherModal';
import { useFilterOptions } from '../../../hooks/useFilterOptions';

const ResearchNetwork = () => {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useNetworkFilters();
  const { researchAreas, technicalSkills } = useFilterOptions();
  const { networkData, loading, error, totalCount, researchers, refetch } = useNetworkData(filters);
  const { selectedResearcher, isOpen, openModal, closeModal } = useResearcherModal();

  // Loading state
  if (loading && !researchers.length) {
    return (
      <div className="min-h-screen qut-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="qut-text-tertiary">Loading research network...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !researchers.length) {
    return (
      <div className="min-h-screen qut-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2 qut-text-primary">Error Loading Network</h3>
          <p className="qut-text-tertiary mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-qut-blue qut-text-secondary rounded-lg hover:bg-qut-light-blue"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen qut-bg-primary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold qut-text-primary mb-2">Research Network</h1>
          <p className="qut-text-secondary">
            Visualize researcher connections by co-authorship, technical skills, and research similarity
          </p>
        </header>

        {/* Filters */}
        <NetworkFilters
          filters={filters}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          researchAreas={researchAreas}
          technicalSkills={technicalSkills}
          totalCount={totalCount}
          filteredCount={researchers.length}
          allResearchers={researchers} 
        />

        {/* Network Visualization */}
        <NetworkChart
          data={networkData}
          onNodeClick={openModal}
          technicalSkillsFilter={filters.selectedTechnicalSkills}
        />

        {/* Researcher Detail Modal */}
        <ResearcherModal
          researcher={selectedResearcher}
          isOpen={isOpen}
          onClose={closeModal}
        />
      </div>
    </div>
  );
};

export default ResearchNetwork;