import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faBan,
    faUser,
    faUsers,
    faGlobe,
    faCalendarAlt,
    faPlayCircle,
    faHistory
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { scrapingService } from '../../services/scrapingService';

const MostRecentJob = ({ recentJob }) => {
    const [job, setJob] = useState(recentJob);
    const refreshInterval = useRef();

    useEffect(() => {
        const refreshJob = async () => {
            if (job && ['in_progress', 'pending'].includes(job.status) && (job.progress.current < job.progress.total || job.progress.total === 0)) {
                refreshInterval.current ??= setInterval(async () => {
                    try {
                        const response = await scrapingService.getScrapingJob(job._id);
                        if (response.success)
                            setJob(response.job);
                    } catch (error) {
                        console.error(error);
                    }
                }, 1000)
            }else if (refreshInterval.current !== null){
                clearInterval(refreshInterval.current);
                refreshInterval.current = null;
            }
        }

        refreshJob();
    })

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FontAwesomeIcon icon={faClock} className="text-yellow-500" />;
            case 'in_progress':
                return <FontAwesomeIcon icon={faSpinner} className="text-blue-500 animate-spin" />;
            case 'completed':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
            case 'cancelled':
                return <FontAwesomeIcon icon={faBan} className="text-gray-500" />;
            default:
                return <FontAwesomeIcon icon={faClock} className="text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'failed': return 'Failed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getScopeIcon = (scope) => {
        switch (scope) {
            case 'single': return <FontAwesomeIcon icon={faUser} className="text-blue-400" />;
            case 'batch': return <FontAwesomeIcon icon={faUsers} className="text-purple-400" />;
            case 'all': return <FontAwesomeIcon icon={faGlobe} className="text-green-400" />;
            default: return <FontAwesomeIcon icon={faUser} />;
        }
    };

    const getScopeText = (scope) => {
        switch (scope) {
            case 'single': return 'Single Researcher';
            case 'batch': return 'Batch Researchers';
            case 'all': return 'All Researchers';
            default: return scope;
        }
    };

    const formatDuration = (startTime, endTime) => {
        if (!startTime) return 'N/A';
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const durationMs = end - start;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    if (!job) {
        return (
            <div className="qut-bg-secondary rounded-lg shadow-md p-6 border-2 qut-border-primary hover:shadow-lg transition-shadow mw-25">
                <FontAwesomeIcon icon={faHistory} className="text-gray-400 text-4xl mb-3" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recent Jobs</h3>
                <p className="text-gray-500">No scraping jobs have been run yet.</p>
            </div>
        );
    }

    return (
        <div className="qut-bg-secondary rounded-lg shadow-md p-6 border-2 qut-border-primary hover:shadow-lg transition-shadow qut-text-primary" style={{"minWidth": "300px", "maxWidth": "fit-content"}}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold qut-text-primary flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlayCircle} className="qut-text-primary" />
                    Most Recent Job
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                    }`}>
                    {getStatusIcon(job.status)}
                    {getStatusText(job.status)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    {getScopeIcon(job.scope)}
                    <span>{getScopeText(job.scope)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {job.source === 'orcid' ? (
                        <i className='fab fa-orcid' />
                    ) : (
                        <FontAwesomeIcon icon={faGlobe} />
                    )}
                    <span className="capitalize">{job.source}</span>
                </div>
            </div>

            {job.progress && job.progress.total > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress.percentage}%</span>
                    </div>
                    <div className="qut-bg-tertiary rounded-pill overflow-hidden h-3">
                        <div
                            className="h-full bg-qut-blue transition-all duration-300"
                            style={{ width: `${job.progress.percentage}%` }}
                        />
                    </div>
                    <div className="text-xs text-center mt-1">
                        {job.progress.current} / {job.progress.total}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">{job.publicationsFound || 0}</div>
                    <div className="text-xs text-blue-600">Publications</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">{job.researchersUpdated || 0}</div>
                    <div className="text-xs text-green-600">Researchers Updated</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-700">{job.newPublicationsAdded || 0}</div>
                    <div className="text-xs text-purple-600">New Publications</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-700">{job.newResearchersAdded || 0}</div>
                    <div className="text-xs text-orange-600">New Researchers</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                    <span>Duration: {formatDuration(job.startTime, job.endTime)}</span>
                </div>
                {job.endTime && (
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        <span>Completed: {new Date(job.endTime).toLocaleDateString("en-GB")}</span>
                    </div>
                )}
            </div>

            {job.scheduled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>Scheduled {job.scheduleFrequency}</span>
                    </div>
                    {job.nextScheduledRun && (
                        <div className="text-xs text-yellow-600 mt-1">
                            Next run: {new Date(job.nextScheduledRun).toLocaleString()}
                        </div>
                    )}
                </div>
            )}

            {job.error && job.error.message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
                        <FontAwesomeIcon icon={faTimesCircle} />
                        <span>Error</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">{job.error.message}</div>
                </div>
            )}
        </div>
    );
};

export default MostRecentJob;