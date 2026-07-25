import { useEffect, useState } from "react";
import useLoader from "../../hooks/useLoader";
import { scrapingService } from "../../services/scrapingService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faRepeat,
    faClock,
    faUser,
    faUsers,
    faGlobe,
    faXmark
} from '@fortawesome/free-solid-svg-icons';
import CreateScrapingJob from "./CreateScrapingJob";

const ScrapeControls = ({ onJobStart, recentJob }) => {
    const { loading, withLoader } = useLoader();
    const [selectedScope, setSelectedScope] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalScope, setModalScope] = useState('single');

    const handleScrapeNow = async (scope) => {
        // For 'all' scope, proceed immediately
        if (scope === 'all') {
            try {
                const result = await withLoader(() => scrapingService.createScrapingJob({
                    scope: scope,
                    source: recentJob?.source || 'orcid'
                }));

                if (onJobStart) {
                    onJobStart(result);
                }
            } catch (error) {
                console.error('Failed to start scraping:', error);
            }
        } else {
            // For single and batch, show the modal
            setModalScope(scope);
            setShowCreateModal(true);
        }
    };

    const handleScrapeLast = async (job) => {
        try{
            console.log(job);
            const result = await withLoader(() => scrapingService.createScrapingJob(job));

            if(onJobStart){
                onJobStart(result);
            }
        }catch(error){
            console.error('Failed to start last scraping job:', error);
        }
    }

    const handleJobCreated = (result) => {
        setShowCreateModal(false);
        if (onJobStart) {
            onJobStart(result);
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
    };

    const ControlButton = ({
        icon,
        label,
        onClick,
        variant = 'primary',
        disabled = false,
        loading: btnLoading = false
    }) => {
        const baseClasses = "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

        const variantClasses = {
            primary: "bg-qut-blue hover:bg-qut-dark-blue text-white shadow-md hover:shadow-lg",
            secondary: "bg-qut-secondary hover:bg-qut-secondary-dark text-qut-text-primary border border-qut-border",
            success: "bg-qut-success hover:bg-qut-success-dark text-white",
            warning: "bg-qut-warning hover:bg-qut-warning-dark text-white",
            danger: "bg-qut-danger hover:bg-qut-danger-dark text-white"
        };

        return (
            <button
                onClick={onClick}
                disabled={disabled || btnLoading}
                className={`${baseClasses} ${variantClasses[variant]}`}
            >
                {btnLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                    <FontAwesomeIcon icon={icon} />
                )}
                {label}
            </button>
        );
    };

    const ScopeSelector = () => (
        <div className="flex flex-col gap-2 p-4 bg-qut-tertiary rounded-lg">
            <label className="text-sm font-medium text-qut-text-secondary mb-2">
                Scope Selection:
            </label>
            <div className="flex gap-2">
                {['all', 'batch', 'single'].map((scope) => (
                    <button
                        key={scope}
                        onClick={() => setSelectedScope(scope)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${selectedScope === scope
                            ? 'bg-qut-blue text-white'
                            : 'bg-white text-qut-text-primary border border-qut-border hover:bg-qut-tertiary'
                            }`}
                    >
                        <FontAwesomeIcon icon={
                            scope === 'single' ? faUser :
                                scope === 'batch' ? faUsers : faGlobe
                        } />
                        {scope === 'single' ? 'Single' : scope === 'batch' ? 'Batch' : 'All'}
                    </button>
                ))}
            </div>
        </div>
    );

    const CreateModal = () => {
        useEffect(() => {
            if (showCreateModal) {
                // Save the current scroll position
                const scrollY = window.scrollY;

                // Add styles to prevent scrolling
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.width = '100%';
                document.body.style.overflow = 'hidden';

                return () => {
                    // Restore scrolling when modal closes
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    document.body.style.overflow = '';
                    window.scrollTo(0, scrollY);
                };
            }
        }, []);

        if (!showCreateModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{"zIndex": 2000}}>
                <div className="qut-bg-tertiary rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b qut-border-primary bg-qut-secondary">
                        <h3 className="text-lg font-semibold qut-text-primary">
                            Start a Scraping Job Now
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="qut-text-primary hover:text-qut-light-blue transition-colors"
                        >
                            <FontAwesomeIcon icon={faXmark} size="lg" />
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                        <CreateScrapingJob
                            initial_scope={modalScope}
                            onJobCreated={handleJobCreated}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="qut-bg-secondary rounded-lg shadow-md p-6 border-2 qut-border-primary" style={{"minWidth": "360px"}}>
                <h3 className="text-lg font-semibold text-qut-text-primary mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlay} className="text-qut-blue" />
                    Quick Actions
                </h3>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <ControlButton
                            icon={faPlay}
                            label={`Scrape ${selectedScope === 'single' ? 'Researcher' : selectedScope === 'batch' ? 'Batch' : 'All'} Now`}
                            onClick={() => handleScrapeNow(selectedScope)}
                            variant="primary"
                            loading={loading}
                            disabled={loading}
                        />

                        {recentJob && (
                            <ControlButton
                                icon={faRepeat}
                                label="Repeat Last Job"
                                onClick={() => handleScrapeLast(recentJob)}
                                variant="secondary"
                                loading={loading}
                                disabled={loading}
                            />
                        )}
                    </div>

                    <ScopeSelector />

                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-qut-blue mt-3">
                            <FontAwesomeIcon icon={faClock} className="animate-pulse" />
                            <span>Starting scraping job...</span>
                        </div>
                    )}
                </div>
            </div>

            <CreateModal />
        </>
    );
};

export default ScrapeControls;