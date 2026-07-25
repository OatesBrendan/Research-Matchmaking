import { researcherService } from "../../services/researcherService"
import PaginatedRenderer from "../../components/utils/Pagination"

const ArrayToStr = (array, limit) => {
    const str = array.join(', ');
    return LimitStr(str, limit);
}

const LimitStr = (str, limit) => {
    return str.length <= limit ? str : str.substring(0, limit) + '...';
}

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB");
};

const Publications = () => {
    const PublicationTableContainer = ({ children }) => {
        return (
            <div className="row row-cols-1 text-center align-middle">
                <div className="col qut-bg-tertiary border p-3 d-grid">
                    <div className="row">
                        <span className="col-sm-3 border-end">Title</span>
                        <span className="col-sm-2 border-end">Authors</span>
                        <span className="col-sm-3 border-end">Description</span>
                        <span className="col-sm-3">Scraped At</span>
                    </div>
                </div>
                {children}
            </div>
        )
    }
    const PublicationTableRow = ({ content }) => {
        return (
            <div className="col qut-bg-secondary border p-3 d-grid">
                <div className="row">
                    <span className="col-sm-3 border-end d-flex align-items-center justify-content-center">{LimitStr(content.title, 100)}</span>
                    <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.authors.length ? ArrayToStr(content.authors, 50) : 'No listed authors'}</span>
                    <span className="col-sm-3 border-end d-flex align-items-center justify-content-center">{content.description ? LimitStr(content.description, 100) : 'No description'}</span>
                    <span className="col-sm-3 border-end d-flex align-items-center justify-content-center">{formatDate(content.scraped_at)}</span>
                    <span className="col-sm-1 d-flex align-items-center justify-content-center"><i class="fa fa-cog text-qut-light-blue clickable" aria-hidden="true" /></span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen qut-bg-primary">
            <div className="qut-bg-primary shadow-lg sticky-top p-3 qut-text-primary">
                <h2>Publications Manager</h2>
            </div>

            <div className="p-5">
                
                <div className="d-flex flex-column mb-3 gap-3">
                    <PaginatedRenderer
                        maxDataPerPage={20}
                        OuterRenderer={PublicationTableContainer}
                        InnerRenderer={PublicationTableRow}
                        serviceFunction={researcherService.getPublications}
                    />
                </div>
            </div>
        </div>
    )
}

export default Publications;