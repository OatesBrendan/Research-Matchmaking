import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { researcherService } from '../../services/researcherService'
import '../../styles/researcher-profile.css';
import BackButton from "../../components/utils/BackButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import PaginatedRenderer from "../../components/utils/Pagination";
import useLoader from "../../hooks/useLoader";

const ResearcherProfile = () => {
  const { id } = useParams();
  const [researcher, setResearcher] = useState(null);
  const {loading, error, setLoadingError, withLoader} = useLoader();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchResearcher = async () => {
      try {
        const response = await withLoader(() => researcherService.getResearcherById(id));

        if (response.success && response.data) {
          setResearcher(response.data);
        } else if (response.success === false) {
          throw new Error(response.message || 'Failed to fetch researcher');
        } else {
          setResearcher(response);
        }
      } catch (err) {
        console.error("Error fetching researcher:", err);
        setLoadingError(err.message);
      }
    };

    if (id) fetchResearcher();
  }, [id, setLoadingError, withLoader]);

  const filteredPublications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const yearMatch = term.match(/^([<>])\s*(\d{4})$/);
    const operator = yearMatch?.[1];
    const yearValue = parseInt(yearMatch?.[2], 10);

    return (researcher?.publications || []).filter(pub => {
      try {
        const title = typeof pub.title === 'string' ? pub.title?.toLowerCase() : '';
        const tags = Array.isArray(pub.tags) ? pub.tags.map(tag => tag.toLowerCase()) : [];
        const year = typeof pub.year === 'string' ? pub.year : pub.year?.toString();

        if (operator && !isNaN(yearValue) && year) {
          const numericYear = parseInt(year, 10);
          if (operator === '<') return numericYear < yearValue;
          if (operator === '>') return numericYear > yearValue;
        }

        return (title && title.includes(term)) || (tags && tags.some(tag => tag.includes(term))) || (year && year.includes(term));
      } catch (error) {
        console.error('Error filtering publication', pub, error);
        return false;
      }
    });
  }, [searchTerm, researcher]);

  if (loading) {
    return (
      <div className="profile-page qut-bg-primary">
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading researcher profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page qut-bg-primary">
        <div className="error-state">
          <h2>Unable to load profile</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="profile-page qut-bg-primary">
        <div className="error-state">
          <h2>Researcher not found</h2>
          <p>The requested researcher profile could not be found.</p>
        </div>
      </div>
    );
  }

  const sortedPublications = [...filteredPublications].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    return yearB - yearA;
  });

  const PublicationsContainer = ({ children }) => {
    return (
      <div className="publications">
        {filteredPublications.length > 0 ? (
          children
        ) : (
          <div className="empty-state">
            <div className="empty-message qut-text-primary">No publications found matching your criteria</div>
            <div className="empty-subtitle qut-text-tertiary">Try adjusting your filters</div>
          </div>
        )}
      </div>
    )
  }

  const PublicationElement = ({ content }) => {
    return (
      <span
        onClick={() => {
          if (content.url) window.open(content.url, '_blank');
        }}
        title={content.url ? "Open article in new page?" : "No link was provided for this article."}
        rel="noopener noreferrer"
        className="publication-link"
      >
        <article className={"publication border-qut-blue hover:qut-bg-tertiary" + (!content.url ? " no-link" : "")}>
          <h3 className="qut-text-primary">{content.title || 'Untitled'}</h3>
          {content.year && <div className="year qut-text-tertiary">Published: {content.year}</div>}
          {content.journal && <div className="journal qut-text-tertiary">Journal: {content.journal}</div>}
          {content.abstract && <p className="abstract qut-text-tertiary">{content.abstract}</p>}
        </article>
      </span>
    )
  }

  return (
    <div className="profile-page qut-bg-primary">
      <div className="profile-container qut-bg-secondary">
        <BackButton />
        {/* Header */}
        <header className="profile-header qut-bg-primary">
          <div className="avatar">
            {researcher.name?.charAt(0) || '?'}
          </div>
          <div className="header-info">
            <h1 className="qut-text-primary">{researcher.name}</h1>
            <p className="institution qut-text-tertiary">{researcher.institution}</p>
            <div className="stats">
              <span className="qut-bg-secondary text-qut-light-blue">{researcher.publications?.length || 0} Publications</span>
            </div>
          </div>
        </header>

        {/* Research Areas */}
        <section className="section qut-bg-primary qut-text-primary">
          <h2>Research Areas</h2>
          <div className="tags">
            {researcher.researchAreas?.length > 0 ? researcher.researchAreas.map((area, idx) => (
              <span key={idx} className="tag qut-bg-secondary text-qut-light-blue">{area}</span>
            )) : (
              <div className="empty-message">It appears this person has no research areas</div>
            )}
          </div>
        </section>


        {/* Publications */}
        {researcher.publications?.length > 0 ? (
          <section className="section wide qut-bg-primary">
            <div className="publications-header">
              <h2 className="qut-text-primary">Publications</h2>
              <div className="filter-group relative">
                <input
                  type="text"
                  id="pub-search"
                  placeholder="Search publications..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qut-blue focus:border-qut-blue qut-bg-secondary qut-text-tertiary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 qut-text-tertiary">
                  <FontAwesomeIcon icon={faSearch} />
                </div>
              </div>
            </div>
            <PaginatedRenderer
              data={sortedPublications}
              OuterRenderer={PublicationsContainer}
              InnerRenderer={PublicationElement}
            />
          </section>
        ) : (
          <section className="section wide">
            <div className="publications-header">
              <h2>Publications</h2>
            </div>
            <div className="publications">
              <div className="empty-state">
                <div className="empty-message">It appears this person has no publications</div>
                <div className="empty-subtitle">If this is incorrect please <a href="https://www.qut.edu.au/contact">contact us.</a></div>
              </div>
            </div>
          </section>
        )}


        {/* Contact */}
        {researcher.email && (
          <section className="section">
            <h2>Contact</h2>
            <a href={`mailto:${researcher.email}`} className="email-link">
              {researcher.email}
            </a>
          </section>
        )}
      </div>
    </div>
  );
};

export default ResearcherProfile;