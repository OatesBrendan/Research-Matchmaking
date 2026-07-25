import React, { useEffect, useState, useRef } from 'react';

const NetworkFilters = ({ 
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  researchAreas, 
  technicalSkills,
  totalCount,
  filteredCount,
  allResearchers = [] // Add this prop to get all researcher names
}) => {
  const [technicalInput, setTechnicalInput] = useState('');
  const [technicalSuggestions, setTechnicalSuggestions] = useState([]);
  const [debouncedTechnicalInput, setDebouncedTechnicalInput] = useState('');
  
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  
  const technicalInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Debounce technical skills input
  useEffect(() => {
    if (technicalInput === '') {
      setDebouncedTechnicalInput('');
      return;
    }
    const timer = setTimeout(() => setDebouncedTechnicalInput(technicalInput), 300);
    return () => clearTimeout(timer);
  }, [technicalInput]);

  // Generate technical skills suggestions
  useEffect(() => {
    const current = debouncedTechnicalInput.split(',').pop().trim().toLowerCase();
    if (current && current.length > 1) {
      setTechnicalSuggestions(
        technicalSkills
          .filter(skill => skill.toLowerCase().includes(current))
          .slice(0, 10)
      );
    } else {
      setTechnicalSuggestions([]);
    }
  }, [debouncedTechnicalInput, technicalSkills]);

  // Generate name suggestions
  useEffect(() => {
    const searchTerm = filters.searchTerm.toLowerCase().trim();
    if (searchTerm && searchTerm.length > 0) {
      const matches = allResearchers
        .filter(researcher => researcher.name.toLowerCase().includes(searchTerm))
        .slice(0, 8)
        .map(r => r.name);
      setNameSuggestions(matches);
      setShowNameSuggestions(matches.length > 0);
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
    }
  }, [filters.searchTerm, allResearchers]);

  const handleSearchChange = (e) => {
    onFilterChange({ searchTerm: e.target.value });
  };

  const handleSelectName = (name) => {
    onFilterChange({ searchTerm: name });
    setShowNameSuggestions(false);
  };

  const handleAreaChange = (e) => {
    onFilterChange({ selectedArea: e.target.value });
  };

  const handleAddSkill = (skill) => {
    const newSkills = [...filters.selectedTechnicalSkills, skill];
    onFilterChange({ selectedTechnicalSkills: newSkills });
    setTechnicalInput('');
    setDebouncedTechnicalInput('');
    setTechnicalSuggestions([]);
    technicalInputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = filters.selectedTechnicalSkills.filter(s => s !== skillToRemove);
    onFilterChange({ selectedTechnicalSkills: newSkills });
  };

  // Close name suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (nameInputRef.current && !nameInputRef.current.contains(e.target)) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="qut-bg-secondary rounded-lg border-2 qut-border-primary shadow-sm p-4 mb-6">
      {filteredCount > 0 && (
        <p className="text-sm qut-text-tertiary mb-4">
          Showing {filteredCount} of {totalCount} researchers
          {filters.selectedTechnicalSkills.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Skills: {filters.selectedTechnicalSkills.join(', ')}
            </span>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search with Autocomplete */}
        <div className="relative" ref={nameInputRef}>
          <label className="block text-sm font-medium qut-text-primary mb-2">
            Search Researchers
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type to search by name..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (nameSuggestions.length > 0) {
                  setShowNameSuggestions(true);
                }
              }}
              className="w-full px-3 py-2 border-2 qut-border-primary rounded-md focus:ring-2 focus:ring-blue-500 qut-bg-primary qut-text-tertiary"
            />
            {filters.searchTerm && (
              <button
                onClick={() => {
                  onFilterChange({ searchTerm: '' });
                  setShowNameSuggestions(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Name Suggestions Dropdown */}
          {showNameSuggestions && nameSuggestions.length > 0 && (
            <ul className="absolute z-20 w-full qut-bg-primary border-2 qut-border-primary rounded-md shadow-lg max-h-60 overflow-auto mt-1">
              {nameSuggestions.map((name, i) => (
                <li 
                  key={`name-suggestion-${i}`}
                  onClick={() => handleSelectName(name)} 
                  className="px-3 py-2 hover:bg-qut-light-blue cursor-pointer qut-text-primary"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Research Area */}
        <div>
          <label className="block text-sm font-medium qut-text-primary mb-2">
            Filter by Research Area
          </label>
          <select
            value={filters.selectedArea}
            onChange={handleAreaChange}
            className="w-full px-3 py-2 border-2 qut-border-primary rounded-md focus:ring-2 focus:ring-blue-500 qut-bg-primary qut-text-tertiary"
          >
            <option value="">All Research Areas</option>
            {researchAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Technical Skills */}
        <div className="relative">
          <label className="block text-sm font-medium qut-text-primary mb-2">
            Technical Skills Filter
          </label>
          
          {filters.selectedTechnicalSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.selectedTechnicalSkills.map((skill, i) => (
                <span key={`skill-${i}`} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200 flex items-center gap-2">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-green-700 hover:text-green-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Enter skills..."
            value={technicalInput}
            onChange={(e) => setTechnicalInput(e.target.value)}
            ref={technicalInputRef}
            className="w-full px-3 py-2 border-2 qut-border-primary rounded-md focus:ring-2 focus:ring-green-500 qut-bg-primary qut-text-tertiary"
          />
          
          {technicalSuggestions.length > 0 && (
            <ul className="absolute z-20 w-full qut-bg-primary border-2 qut-border-primary rounded-md shadow-lg max-h-60 overflow-auto mt-1">
              {technicalSuggestions.map((skill, i) => (
                <li 
                  key={`suggestion-${i}`}
                  onClick={() => handleAddSkill(skill)} 
                  className="px-3 py-2 hover:bg-qut-light-blue cursor-pointer qut-text-primary"
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
          
          <div className="text-xs qut-text-tertiary mt-1">
            e.g., "CRISPR, Python, Machine Learning"
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkFilters;