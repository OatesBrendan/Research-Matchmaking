import { useCallback, useEffect, useRef, useState } from "react";
import { animateScroll as scroll } from 'react-scroll';
import useLoader from "../../hooks/useLoader";
import LoadingOverlay from "./LoadingOverlay";

const PaginatedRenderer = ({
    data = [],
    maxDataPerPage = 10,
    OuterRenderer,
    InnerRenderer,
    ErrorRenderer = null,
    LoadingRenderer = null,
    serviceFunction = null,
    serviceParams = null,
    getTotalPages = null,
    getTotalDocuments = null,
    refreshTrigger = null
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageData, setPageData] = useState(data);
    const { loading, error, withLoader } = useLoader();
    const initialLoadRef = useRef(false);

    const usingApiPagination = serviceFunction !== null;

    const fetchPageData = useCallback(async (page) => {
        if (!serviceFunction) return;

        let params = {};
        if (serviceParams) {
            params = serviceParams;
        }
        params.limit = maxDataPerPage;
        params.page = page;

        try {
            const response = await withLoader(() => serviceFunction(params));
            setCurrentPage(page);
            setPageData(response.data);
            setTotalPages(response.totalPages);
            // allow the paginator to communicate with whatever is calling it, in this case allow it to retrieve the total pages it got
            if (getTotalPages) getTotalPages(response.totalCount);
            if (getTotalDocuments) getTotalDocuments(response.totalCount);
        } catch (error) {
            console.error(error);
        }
    }, [serviceFunction, maxDataPerPage, serviceParams, getTotalPages, getTotalDocuments, withLoader]);

    // if using api pagination, initialise with the first page from api
    useEffect(() => {
        if (usingApiPagination) {
            if (!initialLoadRef.current) initialLoadRef.current = true;
            fetchPageData(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usingApiPagination, serviceParams]);

    useEffect(() => {
        if (usingApiPagination && initialLoadRef.current) {
            fetchPageData(currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    useEffect(() => {
        if (!usingApiPagination) {
            if (!data) {
                setCurrentPage(1);
                return setTotalPages(1);
            }
            setCurrentPage(1);
            return setTotalPages(Math.ceil(data.length / maxDataPerPage));
        }
    }, [data, maxDataPerPage, usingApiPagination])

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            if (usingApiPagination) {
                fetchPageData(page);
            } else {
                setCurrentPage(page);
            }
            scroll.scrollToTop({
                duration: 500,
                smooth: true,
            });
        }
    };

    const RenderPagination = () => {
        if (totalPages <= 1) return null;
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination-btn qut-bg-secondary hover:qut-bg-primary hover:border-qut-blue ${i === currentPage ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="pagination-container">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn pagination-nav pagination-nav qut-bg-secondary hover:qut-bg-primary"
                >
                    ← Prev
                </button>
                {buttons}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn pagination-nav pagination-nav qut-bg-secondary hover:qut-bg-primary"
                >
                    Next →
                </button>
            </div>
        );
    }

    const getDataToRender = () => {
        if (usingApiPagination) {
            return pageData;
        } else {
            return data.slice(
                (currentPage - 1) * maxDataPerPage,
                currentPage * maxDataPerPage
            )
        }
    }

    const paginatedData = getDataToRender();

    if (loading && LoadingRenderer) {
        return (
            <div>
                <OuterRenderer>
                    <LoadingRenderer count={maxDataPerPage} />
                </OuterRenderer>
            </div>
        );
    }

    if (loading) {
        return (
            <LoadingOverlay text={"Loading Data..."} />
        )
    }

    if (error) {
        if (ErrorRenderer) {
            return (
                <ErrorRenderer error={error} />
            )
        }
        return (
            <div className="empty-state">
                <div className="empty-message">{error ? 'An Error Occurred' : 'No data was found...'}</div>
                <div className="empty-subtitle">{error ? error : ''}</div>
            </div>
        )
    }

    return (
        <div>
            <OuterRenderer>
                {paginatedData.length > 0 && paginatedData.map((obj, idx) => {
                    return (
                        <InnerRenderer content={obj} key={obj?.id || obj?._id || idx} />
                    )
                })}
            </OuterRenderer>
            <RenderPagination />
        </div>

    )
}

export default PaginatedRenderer;