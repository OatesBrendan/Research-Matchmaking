import { useState, useEffect, useMemo } from 'react';
import ResearcherCard from '../../components/userComponents/ResearcherCard';
import '../../styles/browse-profiles.css';
import { researcherService } from '../../services/researcherService';
import PaginatedRenderer from '../../components/utils/Pagination';
import { tagService } from '../../services/tagService';

const ResearcherSkeleton = () => {
  return (
    <div className="researcher-card qut-bg-primary qut-border-primary border-2 opacity-30">
      <div className="card-content">
        <div className="researcher-header mb-4">
          <div className="researcher-avatar skeleton-avatar bg-qut-light-blue opacity-30"></div>
          <div className="researcher-info flex-1">
            <div className="skeleton-line bg-qut-light-blue opacity-30 h-5 w-4/5 mb-2"></div>
            <div className="skeleton-line bg-qut-light-blue opacity-30 h-3 w-3/4"></div>
          </div>
        </div>

        <div className="research-areas mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="skeleton-line bg-qut-light-blue opacity-30 h-6 w-20 rounded-full"></div>
            <div className="skeleton-line bg-qut-light-blue opacity-30 h-6 w-24 rounded-full"></div>
            <div className="skeleton-line bg-qut-light-blue opacity-30 h-6 w-16 rounded-full"></div>
          </div>
          <div className="skeleton-line bg-qut-light-blue opacity-30 h-3 w-1/2"></div>
        </div>

        <div className="researcher-publications mb-3">
          <div className="skeleton-line bg-qut-light-blue opacity-30 h-3 w-1/3"></div>
        </div>

        <div className="card-footer pt-3 border-t border-qut-light-blue opacity-20">
          <div className="skeleton-line bg-qut-light-blue opacity-30 h-4 w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

const ResearcherLoadingRenderer = ({ count = 9 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ResearcherSkeleton key={index} />
      ))}
    </>
  );
};

const BrowseProfiles = () => {
  const [researchInterest, setResearchInterest] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const [technicalSkill, setTechnicalSkill] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const researchersPerPage = 9;
  const [totalResearchers, setTotalResearchers] = useState(0);

  const [filterableTags, setFilterableTags] = useState([]);

  const serviceParams = useMemo(() => ({
    researchAreas: searchTags
  }), [searchTags]);

  useEffect(() => {
    const getTags = async () => {
      const tags = await tagService.getResearchAreas();
      console.log(tags);
      if (tags?.areas) setFilterableTags(tags.areas);
    }
    getTags();
  }, [])

  const Error = ({ error }) => {
    return (
      <div className="error-container">
        <div className="error-message">Error loading researchers</div>
        <div className="error-details qut-text-tertiary">{error}</div>
        <button
          className="retry-btn bg-qut-blue qut-text-secondary rounded-lg hover:bg-qut-light-blue"
        >
          Try Again
        </button>
      </div>
    )
  }

  const addTag = (tag) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!searchTags.includes(cleanTag))
      setSearchTags([...searchTags, cleanTag]);
  }

  const removeTag = (idx) => {
    if (idx >= 0 && idx < searchTags.length)
      setSearchTags(searchTags.filter((_, i) => i !== idx));
  }

  const handleTagEnter = (event) => {
    if (event.key === 'Enter') {
      addTag(event.target.value);
      setResearchInterest("");
    } else if (event.key === 'Tab' && event.target.value) {
      event.preventDefault();
      const tag = document.getElementById('autofill-result-0').innerHTML;
      addTag(tag);
      setResearchInterest("");
    }
  }

  const handleAutofillClick = (event, tag) => {
    event.preventDefault();
    addTag(tag);
    setResearchInterest("");
  }

  const handleTagClick = (tag) => {
    addTag(tag);
  };

  const ResearcherContainer = ({ children }) => {
    return (
      <div className="researchers-grid mb-3">
        {children}
      </div>
    )
  }

  const ResearcherElement = ({ content }) => {
    return (
      <ResearcherCard researcher={content} onTagClick={handleTagClick} />
    )
  }

  return (
    <div className="browse-profiles-page qut-bg-primary">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <h2 className="page-subtitle text-qut-light-blue">Directory</h2>
          <h1 className="page-title qut-text-primary">Browse Researcher Profiles</h1>
          <p className="page-description qut-text-tertiary">
            Find collaborators with specific skills and research interests
          </p>
        </div>

        <div className="content-layout">
          {/* Filter Panel */}
          <div className="filter-panel">
            <div className="filter-card qut-bg-secondary">
              <h3 className="filter-title qut-text-primary">Filters</h3>

              <div className="filter-group">
                <label className="filter-label qut-text-tertiary">Research Interests</label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning"
                  className="filter-input qut-bg-primary qut-text-primary"
                  id='search-tags-field'
                  value={researchInterest}
                  onChange={(e) => setResearchInterest(e.target.value)}
                  onKeyDown={handleTagEnter}
                />
                <div className='filter-autofill qut-bg-primary qut-text-tertiary'>
                  {filterableTags
                    .filter(tag =>
                      researchInterest &&
                      tag.toLowerCase().includes(researchInterest.toLowerCase()))
                    .map((tag, idx) =>
                    (
                      <span
                        key={idx}
                        id={'autofill-result-' + idx}
                        className='filter-autofill-result hover:bg-qut-blue hover:text-white'
                        onMouseDown={(event) => handleAutofillClick(event, tag)}
                      >
                        {tag}
                      </span>
                    )
                    )}
                </div>
              </div>

              <div className='areas-tags'>
                {searchTags && searchTags.length > 0 ? (
                  searchTags.slice(0, 6).map((tag, idx) => (
                    <span
                      key={idx}
                      className="area-tag clickable-tag qut-bg-tertiary text-qut-light-blue deletable"
                      onClick={() => removeTag(idx)}
                    >
                      {tag}
                      <i className="fas fa-times deletable"></i>
                    </span>
                  ))
                ) : (
                  <span className="no-areas qut-text-tertiary">Enter some tags above or click on some to add them to the filter.</span>
                )}
                {searchTags && searchTags.length > 6 && (
                  <span className="more-areas">
                    +{searchTags.length - 6} more
                  </span>
                )}
              </div>

              <div className="filter-group">
                <label className="filter-label qut-text-tertiary">Technical Skills</label>
                <input
                  type="text"
                  placeholder="e.g. Python, R"
                  className="filter-input qut-bg-primary qut-text-primary"
                  value={technicalSkill}
                  onChange={(e) => setTechnicalSkill(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="results-panel">
            <div className="results-card qut-bg-secondary">
              <div className="results-header">
                <h3 className="results-title qut-text-primary">
                  Results: {totalResearchers} researchers found
                </h3>

                <div className="sort-controls">
                  <span className="sort-label qut-text-tertiary">Sort by:</span>
                  <select
                    className="sort-select qut-bg-primary qut-text-primary"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="publications">Most Publications</option>
                  </select>
                </div>
              </div>
              <PaginatedRenderer
                maxDataPerPage={researchersPerPage}
                OuterRenderer={ResearcherContainer}
                InnerRenderer={ResearcherElement}
                serviceFunction={researcherService.getResearchers}
                serviceParams={serviceParams}
                getTotalDocuments={setTotalResearchers}
                ErrorRenderer={Error}
                LoadingRenderer={ResearcherLoadingRenderer}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseProfiles;