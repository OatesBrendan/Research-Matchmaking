import { useEffect, useState } from "react";
import MostRecentJob from "../../components/adminComponents/MostRecentJob";
import { scrapingService } from "../../services/scrapingService";
import useLoader from "../../hooks/useLoader";
import LoadingOverlay from "../../components/utils/LoadingOverlay";
import { navigate } from "../../services/navigationService";

const Dashboard = () => {
    const [dashboardStats, setDashboardStats] = useState(null);
    const { loading, withLoader } = useLoader();

    useEffect(() => {
        const loadJob = async () => {
            try {
                const resStats = await withLoader(async () => {
                    const scrapeStats = await scrapingService.getScrapingJobs({ limit: 1 });
                    const stats = await scrapingService.getStats();
                    stats.recentJob = scrapeStats.data[0];
                    return stats;
                });
                setDashboardStats(resStats);
            } catch (error) {
                console.error(error);
            }
        }
        loadJob();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const navCards = [
        {
            title: 'Researchers',
            path: '/admin/researchers',
            icon: "fas fa-users",
            color: 'from-blue-500 to-blue-600',
            data: "Count: " + dashboardStats?.totalResearchers
        },
        {
            title: 'Users',
            path: '/admin/users',
            icon: "fas fa-user-friends",
            color: 'from-green-500 to-green-600',
            data: "Count: " + dashboardStats?.totalusers
        },
        {
            title: 'Publications',
            path: '/admin/publications',
            icon: "fas fa-book",
            color: 'from-purple-500 to-purple-600',
            data: "Count: " + dashboardStats?.totalPublications
        },
        {
            title: 'Data Scraper',
            path: '/admin/data',
            icon: "fas fa-database",
            color: 'from-orange-500 to-orange-600',
            data: "Last Scraped: " + (dashboardStats?.recentJob?.endTime === null ? "now" : new Date(dashboardStats?.recentJob?.endTime).toLocaleDateString("en-GB"))
        }
    ];

    return (
        <div className="min-h-screen qut-bg-primary">
            <div className="qut-bg-primary shadow-lg sticky-top p-3 qut-text-primary">
                <h2>Admin Dashboard</h2>
            </div>

            <div className="mx-auto p-6">
                {loading ? (
                    <LoadingOverlay text={"Loading Data..."} />
                ) : (
                    <div className="mx-auto qut-bg-primary rounded-lg shadow-sm border-2 qut-border-primary p-6 grid grid-cols-1 gap-6" style={{ "minWidth": "max-content", "maxWidth": "50%" }}>
                        <div>
                            <h2 className="text-lg font-semibold qut-text-tertiary mb-4">Overview</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ "minWidth": "max-content" }}>
                                {
                                    navCards.map(card => {
                                        return (<div className="clickable qut-bg-tertiary rounded-lg shadow-sm border-2 qut-border-primary p-6 hover:qut-bg-secondary hover:text-qut-light-blue" onClick={() => navigate(card.path)}>
                                            <div className="d-flex align-items-center gap-6">
                                                <i className={card.icon} />
                                                <h3>{card.title}</h3>
                                            </div>
                                            {card.data && (<span>{card.data}</span>)}
                                        </div>)
                                    })
                                }
                            </div>
                        </div>
                        <div className="mx-auto" style={{ "width": "fit-content" }}>
                            {dashboardStats && (<MostRecentJob recentJob={dashboardStats.recentJob} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard;