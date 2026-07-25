import { useEffect, useState } from "react";
import useLoader from "../../hooks/useLoader";
import { tagService } from "../../services/tagService";
import { researcherService } from "../../services/researcherService";
import PaginatedRenderer from "../utils/Pagination";

const TagTableContainer = ({ children }) => {
    return (
        <div className="row row-cols-1 text-center align-middle">
            <div className="col qut-bg-tertiary border p-3 d-grid">
                <div className="row">
                    <span className="col-sm-2 border-end">ID</span>
                    <span className="col-sm-2 border-end">Name</span>
                    <span className="col-sm-2 border-end">Embedding</span>
                    <span className="col-sm-2 border-end">Referenced</span>
                    <span className="col-sm-2">Actions</span>
                </div>
            </div>
            {children}
        </div>
    )
}

    const TagTableRow = ({ content}) => {
        const [confirm, setConfirm] = useState(false);
        const deleteTag = async () => {
            try {
                await tagService.deleteTags({ type: content.type, name: content.name });
                alert('Tag deleted successfully. Please refresh the list.');
            } catch (err) {
                console.error('Failed to delete tag:', err);
            }
        };

    return (
        <div className="col qut-bg-secondary border p-3 d-grid">
            <div className="row">
                <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content._id}</span>
                <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.name}</span>
                <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.embedding ? "true" : "false"}</span>
                <span className="col-sm-2 border-end d-flex align-items-center justify-content-center">{content.referenced}</span>
                {!confirm && (
                    <span className="col-sm-2 d-flex align-items-center justify-content-left"><button className="btn btn-primary hover:bg-dark-blue" onClick={() => setConfirm(true)}>Delete?</button></span>
                )}
                {confirm && (
                    <>
                    <span className="col-sm-2 d-flex align-items-center justify-content-center"><button className="btn btn-primary hover:bg-dark-blue" onClick={() => setConfirm(false)}>Cancel</button>
                    <button className="btn btn-danger hover:bg-dark-red btn-sm" onClick={deleteTag}>Confirm Delete</button></span>
                    
                    </>
                )}
            </div>
        </div>
    )
}

const TagManager = () => {
    const [researchAreas, setResearchAreas] = useState([]);
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const { loading, error, withLoader } = useLoader();
    const [newTag, setNewTag] = useState({ type: '', name: '' });
    const [assignMode, setAssignMode] = useState(null);
    const [selectedResearcher, setSelectedResearcher] = useState({ ID: '', name: '', researchAreas: [], technicalSkills: [] });

    const [tab, setTab] = useState('areas');

    const fetchTags = async () => {
        try {
            const areas = await withLoader(() => tagService.getResearchAreas());
            const skills = await withLoader(() => tagService.getTechnicalSkills());
            setResearchAreas(areas);
            setTechnicalSkills(skills);
            const currentTab = tab;
            setTab(null);
            await new Promise((resolve) => setTimeout(resolve, 500)); 
            setTab(currentTab);
            
        } catch (err) {
            console.error('Failed to fetch tags:', err);
        }
    };

    const switchTab = (newTab) => {
        if (tab === newTab) {
            setTab(null);
        } else {
            setTab(newTab);
        }

    }

    const switchAssignMode = () => {
        if (assignMode === 'individual') {
            setAssignMode('all');
        } else {
            setAssignMode('individual');
        }
    }

    const refreshResearcher = async () => {
        if (selectedResearcher.ID.length !== 24) return;
        try {
            const researcher = await withLoader(() => researcherService.getResearcherById(selectedResearcher.ID));
            setSelectedResearcher({
                ID: researcher.data._id,
                name: researcher.data.name,
                researchAreas: researcher.data.researchAreas,
                technicalSkills: researcher.data.technicalSkills,
            });
        } catch (err) {
            alert('Researcher not found. Please check the ID and try again.');
            return;
        }
    }

    const deleteTag = async (type, name) => {
        try {
            await withLoader(() => tagService.deleteTags({ type, name }));
        } catch (err) {
            console.error('Failed to delete tag:', err);
        }
    };

    const addTag = async (e) => {
        e.preventDefault();
        try {
            console.log('Add tag:', newTag);
            const formData = {
                type: newTag.type,
                name: newTag.name,
                batch: 'false'
            };
            await withLoader(() => tagService.createAreaOrSkill(formData));
            setNewTag({ type: 'Area', name: '' });
        } catch (err) {
            if (err.response && err.response.status === 400) {
                alert('Tag already exists or invalid input.');
            }
        }
    };

    useEffect(() => { fetchTags(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <h2>Tag Manager</h2>
            <p>Manage research areas and technical skills used for tagging researchers and publications.</p>

            <div className="mb-4 flex gap-2">
                <button className="btn btn-primary hover:bg-dark-blue " onClick={() => switchTab('areas')}>Research Area List</button>
                <button className="btn btn-primary hover:bg-dark-blue" onClick={() => switchTab('skills')}>Technical Skill List</button>
                <button className="btn btn-primary hover:bg-dark-blue" onClick={() => switchTab('add')}>Create Area / Skill</button>
                <button className="btn btn-primary hover:bg-dark-blue" onClick={() => switchTab('assign')}>Assign Tags</button>
                <button className="btn btn-secondary hover:bg-dark-gray" onClick={fetchTags}>Refresh Tags</button>
            </div>

            {tab === 'areas' && (
                <div>
                    <h3>Research Areas</h3>
                    <PaginatedRenderer
                        maxDataPerPage={20}
                        OuterRenderer={TagTableContainer}
                        InnerRenderer={TagTableRow}
                        serviceFunction={tagService.getAdminAreas}
                    />
                </div>
            )}

            {tab === 'skills' && (
                <div>
                    <h3>Technical Skills</h3>
                    <PaginatedRenderer
                        maxDataPerPage={20}
                        OuterRenderer={TagTableContainer}
                        InnerRenderer={TagTableRow}
                        serviceFunction={tagService.getAdminSkills}
                    />
                </div>
            )}

            {tab === "add" && (
                <div>
                    <form onSubmit={addTag} className="max-w-md">
                        <div className="mb-3">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={newTag.type} onChange={(e) => setNewTag({ ...newTag, type: e.target.value })}>
                                <option value="">Select Type</option>
                                <option value="Area">Research Area</option>
                                <option value="Skill">Technical Skill</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input type="text" className="form-control" value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary hover:bg-dark-blue">Add Tag</button>
                    </form>
                </div>
            )}

            {tab === 'assign' && (
                <div>
                    <h3>Assign Tags</h3>
                    <p>Select a researcher to assign tags, or assign to all.</p>
                    <button className="btn btn-secondary hover:bg-dark-gray mb-3" onClick={switchAssignMode}>Switch Form</button>

                    {assignMode === 'individual' && (
                        <div>
                            <form
                                className="max-w-md mb-4"
                                onSubmit={async (e) => {
                                    try {
                                        e.preventDefault();
                                        const researcher = await researcherService.getResearcherById(selectedResearcher.ID);
                                        setSelectedResearcher({
                                            ...selectedResearcher,
                                            name: researcher.data.name,
                                            researchAreas: researcher.data.researchAreas,
                                            technicalSkills: researcher.data.technicalSkills,
                                        });
                                    } catch (err) {
                                        alert('Researcher not found. Please check the ID and try again.');
                                        return;
                                    }


                                }}
                            >
                                {/* --- Researcher Lookup Section --- */}
                                <label className="form-label fw-bold">
                                    Select Researcher (Enter Database ID)
                                </label>
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Search researcher by ID"
                                    value={selectedResearcher.ID}
                                    onChange={(e) =>
                                        setSelectedResearcher({
                                            ...selectedResearcher,
                                            ID: e.target.value,
                                        })
                                    }
                                    minLength={24}
                                    maxLength={24}
                                />

                                {selectedResearcher && (
                                    <div className="mb-4">
                                        <h5>Selected Researcher:</h5>
                                        <p>{selectedResearcher.name}</p>
                                        <h6>Current Research Areas:</h6>
                                        <p>{selectedResearcher.researchAreas.join(", ") || "None"}</p>
                                        <h6>Current Technical Skills:</h6>
                                        <p>{selectedResearcher.technicalSkills.join(", ") || "None"}</p>
                                    </div>
                                )}

                                <hr className="my-4" />

                                {/* --- Tag Assignment Buttons --- */}
                                <h4 className="mb-3">Assign Tags</h4>

                                <div className="d-flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-primary flex-fill"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await withLoader(() => researcherService.getResearcherTags(selectedResearcher.ID));
                                            refreshResearcher();

                                        }}
                                    >
                                        Assign Research Area
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-success flex-fill"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await withLoader(() => researcherService.getResearcherSkills(selectedResearcher.ID));
                                            refreshResearcher();

                                        }}
                                    >
                                        Assign Technical Skill
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary flex-fill"
                                        onClick={() => console.log("Clear Tags")}
                                    >
                                        Clear
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-dark flex-fill"
                                        onClick={() => console.log("Save Changes")}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {assignMode === 'all' && (
                        <div>
                            <p> These might take a while... Feel free to change page after initiating the process.</p>
                            <br></br>
                            <div className="d-flex flex-wrap gap-2">

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        await withLoader(() => tagService.assignAllSkills());

                                    }}
                                >
                                    Assign Technical Skills to All
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        await withLoader(() => tagService.assignAllAreas());

                                    }}
                                >
                                    Assign Research Area to All
                                </button>

                            </div>
                        </div>
                    )}


                </div>
            )}

            {tab === null && (<p>Select a tab to view tags.</p>
            )}
        </div>
    )
}

export default TagManager;