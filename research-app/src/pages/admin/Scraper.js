import { useEffect, useState } from "react";
import useLoader from "../../hooks/useLoader";
import { scrapingService } from "../../services/scrapingService";

import LoadingOverlay from "../../components/utils/LoadingOverlay";
import PaginatedRenderer from "../../components/utils/Pagination";
import MostRecentJob from "../../components/adminComponents/MostRecentJob";
import CreateScrapingJob from "../../components/adminComponents/CreateScrapingJob";
import ScrapeControls from "../../components/adminComponents/ScrapeControls";
import TagManager from "../../components/adminComponents/TagManager";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB");
};

const ScrapeDashboard = ({ jobs, loading, error, getScrapingJobs }) => {
    const handleJobStart = (result) => {
        getScrapingJobs();
        console.log('Job started successfully:', result);
    };

    const getStatusClass = (status) => {
        const classes = {
            'pending': "bg-primary-subtle text-white",
            'in_progress': "bg-info text-white",
            'completed': "bg-success text-white",
            'failed': "bg-danger text-white",
            'cancelled': "bg-warning text-white"
        }
        return classes[status] || "";
    }

    return (
        <div>
            {loading ? <LoadingOverlay text={"Getting scraping information"} /> : jobs.length > 0 ? (
                <div className="d-flex flex-column mb-3 gap-3">
                    <div className="d-flex flex-row mb-3 gap-3 justify-content-around">
                        <MostRecentJob recentJob={jobs[0]} />
                        <ScrapeControls
                            onJobStart={handleJobStart}
                            recentJob={jobs[0]}
                        />
                    </div>
                    <div>
                        <h2 className="my-3">Recent Jobs:</h2>
                        <div className="d-grid gap-2">
                            {jobs.length > 1 && jobs.slice(1).map((job, idx) => {
                                return (
                                    <div className="qut-bg-secondary rounded-2 p-4 shadow">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h4>Job: {job._id}</h4>
                                            <span
                                                className={"px-3 py-1 rounded-pill " +
                                                    (getStatusClass(job.status))}
                                                style={{ "font-size": "12px" }}
                                            >
                                                {job.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p><strong>Scope:</strong> {job.scope}</p>
                                            <p><strong>Source:</strong> {job.source}</p>
                                            <p><strong>Created:</strong> {formatDate(job.createdAt)}</p>
                                            {job.progress && job.progress.total > 0 && (
                                                <div className="mx-1">
                                                    <div className="qut-bg-tertiary rounded-pill overflow-hidden mb-1 h-2">
                                                        <div
                                                            className="h-100 bg-qut-blue transition"
                                                            style={{ width: `${job.progress.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span>
                                                        {job.progress.current} / {job.progress.total} ({job.progress.percentage}%)
                                                    </span>
                                                </div>
                                            )}
                                            {job.publicationsFound > 0 && (
                                                <p><strong>Publications found:</strong> {job.publicationsFound}</p>
                                            )}
                                            {job.error && job.error.message && (
                                                <div className="bg-qut-danger text-danger p-2 rounded-2 mt-1">
                                                    <strong>Error:</strong> {job.error.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-message">{error ? 'An Error Occurred' : 'No scraping logs were found...'}</div>
                    <div className="empty-subtitle">{error ? error : 'If this isnt what you expected please check the backend server or mongodb.'}</div>
                </div>
            )}
        </div>
    );
}

const Logs = () => {
    const LogsTableContainer = ({ children }) => {
        return (
            <div className="row row-cols-1 text-center align-middle">
                <div className="col qut-bg-tertiary border p-3 d-grid">
                    <div className="row">
                        <span className="col-sm-2 border-end">Job</span>
                        <span className="col-sm-2 border-end">Status</span>
                        <span className="col-sm-2 border-end">Scope</span>
                        <span className="col-sm-2 border-end">Source</span>
                        <span className="col-sm-3">Created</span>
                    </div>
                </div>
                {children}
            </div>
        )
    }

    const LogsTableRow = ({ content }) => {
        return (
            <div className="col qut-bg-secondary border p-3 d-grid">
                <div className="row">
                    <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content._id}</span>
                    <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.status}</span>
                    <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.scope}</span>
                    <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.source}</span>
                    <span className="col-sm-3 border-end d-flex align-items-center justify-content-center">{formatDate(content.createdAt)}</span>
                    <span className="col-sm-1 d-flex align-items-center justify-content-center"><i class="fa fa-info-circle" aria-hidden="true"></i></span>
                </div>
            </div>
        )
    }

    return (
        <PaginatedRenderer
            maxDataPerPage={20}
            OuterRenderer={LogsTableContainer}
            InnerRenderer={LogsTableRow}
            serviceFunction={scrapingService.getScrapingJobs}
        />
    )
}

const Scraper = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const [jobs, setJobs] = useState([]);
    const { loading, error, withLoader } = useLoader();
    const limit = 5;

    const getScrapingJobs = async () => {
        try {
            const res_jobs = await withLoader(() => scrapingService.getScrapingJobs({ limit }));
            setJobs(res_jobs.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getScrapingJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = {
        dashboard: <ScrapeDashboard jobs={jobs} loading={loading} error={error} getScrapingJobs={getScrapingJobs} />,
        create: <CreateScrapingJob onJobCreated={() => {
            getScrapingJobs();
            setActiveTab('dashboard');
        }}/>,
        logs: <Logs />,
        tags: <TagManager />
    };

    const TabButton = ({ link }) => {
        return (
            <button
                className={"px-4 py-3 text-capitalize fw-medium border-b-2 hover:text-qut-light-blue " + (activeTab === link ? 'border-qut-blue' : 'border-transparent')}
                onClick={() => setActiveTab(link)}
            >
                {link}
            </button>
        );
    }

    const DisplayContent = () => {
        return tabs[activeTab] || (<span>Cannot find page...</span>);
    }

    return (
        <div className="min-h-screen qut-bg-primary">
            <div className="qut-bg-primary shadow-lg sticky-top p-3 qut-text-primary">
                <h2>Data Scraping Manager</h2>
            </div>

            <div>
                <div className="d-flex mb-3 border-b-2 qut-border-primary">
                    {Object.keys(tabs).map((link, idx) => {
                        return (
                            <TabButton link={link} key={idx} />
                        )
                    })}
                </div>
                <div className="p-5">
                    <div className="d-flex flex-column mb-3 gap-3">
                        <DisplayContent />
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Scraper;