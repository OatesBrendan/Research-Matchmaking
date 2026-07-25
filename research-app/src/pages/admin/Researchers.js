import { useEffect, useState } from "react";
import { researcherService } from "../../services/researcherService";
import PaginatedRenderer from "../../components/utils/Pagination";
import Select from "react-dropdown-select";
import { tagService } from '../../services/tagService';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB");
};


const Researchers = () => {
    const [options, setOptions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [researchAreasList, setResearchAreasList] = useState([]);
    const [researchArea, setResearchArea] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [itemData, setItemData] = useState({
        name: '',
        orcid: '',
        eprintsLink: '',
        researchAreas: [],
        technicalSkills: []
    });
    const [edit, setEdit] = useState({
        name: false,
        orcid: false,
        eprintsLink: false,
        researchAreas: false,
        technicalSkills: false
    });

    const updateResearcherF = async (e, id, updatedData) => {
        //console.log('Updating researcher with data:', updatedData);
        try {
            e.preventDefault();
            const formData = {
                name: updatedData.name,
                orcid: updatedData.orcid,
                eprintsLink: updatedData.eprintsLink,
                researchAreas: updatedData.researchAreas,
                technicalSkills: updatedData.technicalSkills,
                email: updatedData.email
            }
            const response = await researcherService.updateResearcher(id, formData);

            if (response.success) {
                changeItem(null);
            }
        } catch (error) {
            console.error('Error updating researcher:', error);

        }
    }

    const deleteResearcherF = async (e, id) => {
        e.preventDefault();
        const response = await researcherService.deleteResearcher(id);
        if (response.success) {
            changeItem(null);
        } else {
            console.error('Error deleting researcher');
        }
    }

    async function loadTags() {
        try {
            const [responseAreas, responseSkills] = await Promise.all([
                tagService.getResearchAreas(),
                tagService.getTechnicalSkills()
            ]);

            setResearchAreasList(responseAreas.areas);
            const optionsMap = responseSkills.skills.map(skill => {
                return { label: skill, value: skill };
            });

            setOptions(optionsMap);


        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    const handleAddSkill = (e) => {
        e.preventDefault();

        setItemData(prevData => ({
            ...prevData,
            technicalSkills: [...prevData.technicalSkills, ...selectedSkills.map(skill => skill.value)]
        }));
        setSelectedSkills([]);
        setConfirmDelete(false);

    };

    const handleAddResearchArea = () => {
        if (researchArea !== '') {
            setItemData(prevData => ({
                ...prevData,
                researchAreas: [...prevData.researchAreas, researchArea]
            }));
            setResearchArea('');
        }
    };

    const handleRemoveTechnicalSkill = (skillToRemove) => {
        //setSelectedItem({...selectedItem, data: {...selectedItem.data, technicalSkills: selectedItem.data.technicalSkills.filter(skill => skill !== skillToRemove)}});
        setItemData(prevData => ({
            ...prevData,
            technicalSkills: prevData.technicalSkills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleRemoveResearchArea = (areaToRemove) => {
        setItemData(prevData => ({
            ...prevData,
            researchAreas: prevData.researchAreas.filter(area => area !== areaToRemove)
        }));

        //  setSelectedItem({...selectedItem, data: {...selectedItem.data, researchAreas: selectedItem.data.researchAreas.filter(area => area !== areaToRemove)}});
    };

    const changeItem = (item) => {
        setSelectedItem(item);
        setResearchArea('');
        setConfirmDelete(false);
        setEdit({
            name: false,
            orcid: false,
            researchAreas: false,
            technicalSkills: false,
            eprintsLink: false
        });
        setSelectedSkills([]);
        if (item && item.data) {
            setItemData({
                name: item.data.name || '',
                orcid: item.data.orcid || '',
                eprintsLink: item.data.eprintsLink || '',
                researchAreas: item.data.researchAreas || [],
                technicalSkills: item.data.technicalSkills || []
            });
        }
    }

    const handleResearchAreaChange = (e) => {
        setResearchArea(e.target.value);
    };


    useEffect(() => {
        loadTags();
    }, []);

    const ResearcherTableContainer = ({ children }) => {
        return (
            <div className="row row-cols-1 text-center">
                <div className="col qut-bg-tertiary border p-3 d-grid">
                    <div className="row">
                        <span className="col-sm-2 border-end">Name</span>
                        <span className="col-sm-2 border-end">MongoID</span>
                        <span className="col-sm-2 border-end">Orcid</span>
                        <span className="col-sm-2">Publications</span>
                        <span className="col-sm-3">Last Updated</span>
                    </div>
                </div>
                {children}
            </div>
        )
    }

    const ResearcherTableRow = ({ content }) => {
        const item = { type: 'researcher', data: content };
        return (
            <div className="col qut-bg-secondary border p-3 d-grid">
                <div className="row">
                    <span className="col-sm-2 border-end">{content.name}</span>
                    <span className="col-sm-2 border-end">{content._id}</span>
                    <span className="col-sm-2 border-end">{content.orcid || 'n/a'}</span>
                    <span className="col-sm-2 border-end">{content.publications.length || '0'}</span>
                    <span className="col-sm-3">{formatDate(content.updatedAt) || 'n/a'}</span>
                    <span className="col-sm-1"><i class="fa fa-cog text-qut-light-blue clickable" aria-hidden="true" onClick={() => changeItem(item)} /></span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen qut-bg-primary">
            <div className="qut-bg-primary shadow-lg sticky-top p-3 qut-text-primary">
                <h2>Researcher Manager</h2>
            </div>

            <div className="p-5">
                <div className="d-flex flex-column mb-3 gap-3">
                    <PaginatedRenderer
                        maxDataPerPage={20}
                        OuterRenderer={ResearcherTableContainer}
                        InnerRenderer={ResearcherTableRow}
                        serviceFunction={researcherService.getResearchers}
                        refreshTrigger={selectedItem}
                    />
                    {confirmDelete && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
                            <div className="qut-bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto mt-16">
                                <div className="p-6 border-b flex gap-40 items-start">
                                    <h2 className="font-bold qut-text-primary" style={{ fontSize: '1.5rem', lineHeight: '2rem' }}>
                                        Confirm Deletion
                                    </h2>
                                </div>
                                <div className="p-6">

                                    <div className="flex gap-3 pt-4">

                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={(e) => deleteResearcherF(e, selectedItem.data._id)}
                                            className="px-4 py-2 bg-danger qut-text-primary rounded-lg hover:qut-bg-tertiary"

                                        >
                                            Delete Researcher
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {(selectedItem && !confirmDelete) && selectedItem.data && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
                            <div className="qut-bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto mt-16">
                                <div className="p-6 border-b flex items-start">

                                    <div className="relative max-w-md">
                                        <input
                                            type="text"
                                            className="font-bold qut-text-primary w-full pr-10"
                                            id="name-input"
                                            style={{
                                                background: "none",
                                                fontSize: "1.5rem",
                                                lineHeight: "2rem",
                                                width: `${Math.max(itemData.name.length + (itemData.name.length / 5), 16)}ch`,
                                            }}
                                            value={itemData.name}
                                            disabled={!edit.name}
                                            onChange={(e) =>
                                                setItemData({ ...itemData, name: e.target.value })
                                            }
                                        />

                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                            onClick={() => {
                                                setEdit(prev => ({ ...prev, name: !prev.name }))
                                                document.getElementById('name-input').style.border = edit.name ? 'none' : '1px solid #3b82f6';
                                            }}
                                        >
                                            ✎
                                        </button>
                                    </div>

                                    <div className="relative max-w-md">
                                        <input
                                            type="text"
                                            className="qut-text-tertiary"
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "1rem",
                                                lineHeight: "2rem",
                                                width: "24ch"
                                            }}
                                            value={itemData.orcid}
                                            id="orcid-input"
                                            placeholder="ORCID iD"
                                            onChange={(e) =>
                                                setItemData({ ...itemData, orcid: e.target.value })
                                            }
                                            disabled={!edit.orcid}
                                        />

                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                            onClick={() => {
                                                setEdit(prev => ({ ...prev, orcid: !prev.orcid }))
                                                document.getElementById('orcid-input').style.border = edit.orcid ? 'none' : '1px solid #3b82f6';
                                            }}
                                        >
                                            ✎
                                        </button>
                                    </div>


                                </div>

                                <div className="p-6">
                                    <div className="mb-6">

                                        <div className="relative max-w-md">
                                            <input
                                                type="text"
                                                className="qut-text-tertiary"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    fontSize: "1rem",
                                                    lineHeight: "2rem",
                                                    width: `${Math.max(itemData.eprintsLink.length, 16)}ch`,
                                                }}
                                                value={itemData.eprintsLink}
                                                id="eprints-input"
                                                placeholder="Eprints Link"
                                                onChange={(e) =>
                                                    setItemData({ ...itemData, eprintsLink: e.target.value })
                                                }
                                                disabled={!edit.eprintsLink}
                                            />

                                            <button
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                                onClick={() => {
                                                    setEdit(prev => ({ ...prev, eprintsLink: !prev.eprintsLink }))
                                                    document.getElementById('eprints-input').style.border = edit.eprintsLink ? 'none' : '1px solid #3b82f6';
                                                }}
                                            >
                                                ✎
                                            </button>

                                        </div>

                                        <div className="flex items-center mb-3">
                                            <h3 className="text-lg font-semibold qut-text-primary">Research Areas</h3>

                                            <button
                                                type="button"
                                                className="ml-2 inline-flex text-gray-400 hover:text-blue-600 focus:outline-none"
                                                onClick={() =>
                                                    setEdit((prev) => ({ ...prev, researchAreas: !prev.researchAreas }))
                                                }
                                            >
                                                <span className="sr-only">Edit</span>
                                                ✎
                                            </button>
                                        </div>

                                        {itemData.researchAreas?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {itemData.researchAreas.map((area, i) => (
                                                    <span className="flex flex-wrap gap-2 tag qut-bg-secondary text-qut-light-blue" key={i}>
                                                        {area}
                                                        {edit.researchAreas && (
                                                            <button type="button" className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none">
                                                                <span className="sr-only">Remove tag</span>
                                                                <i onClick={() => handleRemoveResearchArea(area)} className="fas fa-times"></i>
                                                            </button>
                                                        )}

                                                    </span>
                                                ))}

                                            </div>
                                        )} {itemData.researchAreas?.length === 0 && (
                                            <span className="tag qut-bg-secondary text-qut-light-blue">
                                                No research areas.
                                            </span>
                                        )}
                                        {edit.researchAreas && (
                                            <form>
                                                <select id="new-interest" value={researchArea} onChange={handleResearchAreaChange} class="max-w-lg block w-full shadow-sm focus:ring-qut-blue focus:border-qut-blue sm:max-w-xs sm:text-sm qut-bg-primary border qut-border-primary rounded-md" style={{ marginTop: '8px', marginBottom: '8px', height: '38px' }}>
                                                    <option value="">Select an interest</option>
                                                    {researchAreasList.map((area) => {
                                                        if (itemData.researchAreas.includes(area)) return null;

                                                        return (
                                                            <option key={area} value={area}>
                                                                {area}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <button type="button" id="add-interest" onClick={handleAddResearchArea} className="inline-flex items-center px-3 py-2 border border-l-0 qut-bg-primary border qut-border-primary rounded-r-md hover:qut-bg-primary focus:outline-none focus:ring-1 focus:ring-qut-blue focus:border-qut-blue">
                                                    Add
                                                </button>
                                            </form>
                                        )}

                                    </div>


                                    <div className="mb-6">
                                        <div className="flex items-center mb-3">
                                            <h3 className="text-lg font-semibold qut-text-primary">Technical Skills</h3>

                                            <button
                                                type="button"
                                                className="ml-2 inline-flex text-gray-400 hover:text-blue-600 focus:outline-none"
                                                onClick={() =>
                                                    setEdit((prev) => ({ ...prev, technicalSkills: !prev.technicalSkills }))
                                                }
                                            >
                                                <span className="sr-only">Edit</span>
                                                ✎
                                            </button>
                                        </div>
                                        {itemData.technicalSkills?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">

                                                {itemData.technicalSkills.map((skill, index) => (

                                                    <span className="flex flex-wrap gap-2 tag qut-bg-secondary text-qut-light-blue" key={index}>
                                                        {skill}
                                                        {edit.technicalSkills && (
                                                            <button type="button" className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none">
                                                                <span className="sr-only">Remove tag</span>
                                                                <i onClick={() => handleRemoveTechnicalSkill(skill)} className="fas fa-times"></i>
                                                            </button>
                                                        )}
                                                    </span>

                                                ))}
                                            </div>
                                        )} {itemData.technicalSkills?.length === 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="tag qut-bg-secondary text-qut-light-blue">
                                                    No technical skills.
                                                </span>
                                            </div>
                                        )}
                                        {edit.technicalSkills && (
                                            <form onSubmit={handleAddSkill}>
                                                <Select
                                                    options={options}
                                                    placeholder="Select a skill"
                                                    // loop through each value and add to technical skills array if not already present
                                                    onChange={(values) => {
                                                        setSelectedSkills(values);
                                                    }}
                                                    style={{ marginTop: '8px', marginBottom: '8px', width: '320px', height: '38px' }}
                                                    styles={{
                                                        option: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            color: state.isSelected ? 'grey' : 'black',
                                                            backgroundColor: state.isSelected ? '#bbb' : '#1f1f1f',
                                                        })
                                                    }}
                                                />
                                                <button type="submit" id="add-skill" className="inline-flex items-center px-3 py-2 border border-l-0 qut-bg-primary border qut-border-primary rounded-r-md hover:qut-bg-primary focus:outline-none focus:ring-1 focus:ring-qut-blue focus:border-qut-blue">
                                                    Add
                                                </button>

                                            </form>
                                        )}

                                    </div>

                                    {itemData.publications?.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-3 qut-text-tertiary">Publications ({itemData.publications.length})</h3>
                                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                                {itemData.publications.slice(0, 10).map((pub, idx) => (
                                                    <span
                                                        key={idx}
                                                        onClick={() => {
                                                            if (pub.url) window.open(pub.url, '_blank');
                                                        }}
                                                        title={pub.url ? "Open article in new page?" : "No link was provided for this article."}
                                                        rel="noopener noreferrer"
                                                        className="publication-link"
                                                    >
                                                        <article key={idx} className={"publication publication-preview border-qut-blue hover:qut-bg-tertiary" + (!pub.url ? " no-link" : "")}>
                                                            <h3 className="qut-text-primary">{pub.title || 'Untitled'}</h3>
                                                            {pub.year && <div className="year qut-text-tertiary">Published: {pub.year}</div>}
                                                            {pub.journal && <div className="journal qut-text-tertiary">Journal: {pub.journal}</div>}
                                                            {pub.abstract && <p className="abstract qut-text-tertiary">{pub.abstract}</p>}
                                                        </article>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4 border-t">

                                        <button
                                            onClick={() => changeItem(null)}
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Close
                                        </button>

                                        <button
                                            onClick={() => {
                                                setItemData(selectedItem.data)

                                            }
                                            }
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Reset
                                        </button>

                                        <button
                                            onClick={(e) => updateResearcherF(e, selectedItem.data._id, itemData)}
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"

                                        >
                                            Save Changes
                                        </button>
                                        {!confirmDelete && (
                                            <button
                                                onClick={(e) => setConfirmDelete(true)}
                                                className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"

                                            >
                                                Delete Researcher
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Researchers;