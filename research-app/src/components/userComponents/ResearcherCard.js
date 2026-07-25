import { navigate } from '../../services/navigationService';

const ResearcherCard = ({ researcher, onTagClick }) => {
  const handleViewProfile = () => {
    navigate(`/researchers/${researcher._id}`);
  };

  return (
    <div className="researcher-card qut-bg-primary border-2 qut-border-primary">
      <div className="card-content">
        <div className="researcher-header clickable" onClick={handleViewProfile}>
          <div className="researcher-avatar">
            <span className="avatar-text">
              {researcher.name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="researcher-info">
            <div className="researcher-name text-qut-light-blue">{researcher.name || 'Unknown'}</div>
            <div className="researcher-institution qut-text-tertiary">{researcher.institution || 'No institution'}</div>
            <div className="researcher-publications qut-text-tertiary">
              {researcher.publications?.length || 0} publications
            </div>
          </div>
        </div>

        <div className="research-areas">
          <div className="areas-label qut-text-tertiary">Research Areas</div>
          <div className="areas-tags">
            {researcher.researchAreas && researcher.researchAreas.length > 0 ? (
              researcher.researchAreas.slice(0, 3).map((area, idx) => (
                <span
                  key={idx}
                  className="area-tag clickable-tag bg-qut-blue text-white"
                  onClick={() => onTagClick?.(area)}  // Optional chaining in case it's not passed
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="no-areas qut-text-tertiary">No research areas listed</span>
            )}
            {researcher.researchAreas && researcher.researchAreas.length > 3 && (
              <span className="more-areas qut-bg-tertiary qut-text-primary">
                +{researcher.researchAreas.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="card-footer">
          <button onClick={handleViewProfile} className="view-profile-btn text-qut-light-blue">
            View Profile →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearcherCard;