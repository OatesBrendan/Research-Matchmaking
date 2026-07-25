import { navigate } from "../../../services/navigationService";

const ResearcherModal = ({ researcher, isOpen, onClose }) => {
  if (!isOpen || !researcher?.data) return null;

  const data = researcher.data;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="qut-bg-primary border-2 qut-border-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b-2 qut-border-primary flex justify-between items-start sticky top-0 qut-bg-primary z-10">
          <h2 className="text-2xl font-bold qut-text-primary">{data.name}</h2>
          <button
            onClick={onClose}
            className="qut-text-tertiary hover:text-qut-light-blue text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Research Areas */}
          {data.researchAreas?.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 qut-text-primary">
                Research Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.researchAreas.map((area, i) => (
                  <span
                    key={`area-${i}`}
                    className="tag qut-bg-secondary text-qut-light-blue px-3 py-1 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Technical Skills */}
          {data.technicalSkills?.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 qut-text-primary">
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.technicalSkills.map((skill, i) => (
                  <span
                    key={`skill-${i}`}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {data.publications?.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 qut-text-primary">
                Publications ({data.publications.length})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.publications.slice(0, 10).map((pub, idx) => (
                  <PublicationCard key={`pub-${idx}`} publication={pub} />
                ))}
                {data.publications.length > 10 && (
                  <p className="text-sm qut-text-tertiary italic">
                    ... and {data.publications.length - 10} more publications
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 qut-border-primary flex gap-3 sticky bottom-0 qut-bg-primary">
          <button
            onClick={() => navigate(`/researchers/${data._id}`)}
            className="px-4 py-2 bg-qut-blue text-white rounded-lg hover:bg-qut-dark-blue transition-colors"
          >
            View Full Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicationCard = ({ publication }) => {
  const handleClick = () => {
    if (publication.url) {
      window.open(publication.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      onClick={handleClick}
      className={`
        p-4 border-2 qut-border-primary rounded-lg
        ${publication.url ? 'cursor-pointer hover:qut-bg-tertiary hover:border-qut-blue transition-colors' : ''}
      `}
    >
      <h4 className="qut-text-primary font-medium mb-2">
        {publication.title || 'Untitled'}
      </h4>
      
      <div className="space-y-1 text-sm qut-text-tertiary">
        {publication.year && (
          <div><span className="font-medium">Year:</span> {publication.year}</div>
        )}
        {publication.journal && (
          <div><span className="font-medium">Journal:</span> {publication.journal}</div>
        )}
      </div>

      {publication.abstract && (
        <p className="mt-2 text-sm qut-text-tertiary line-clamp-3">
          {publication.abstract}
        </p>
      )}
    </article>
  );
};

export default ResearcherModal;