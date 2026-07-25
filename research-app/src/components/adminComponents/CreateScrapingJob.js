import { useState, useEffect, useRef } from "react";
import useLoader from "../../hooks/useLoader";
import { scrapingService } from "../../services/scrapingService";
import { researcherService } from "../../services/researcherService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTrash,
    faSearch,
    faUser,
    faUsers,
    faGlobe,
    faPlay,
    faList,
    faUpload,
    faFileImport,
    faWarning
} from '@fortawesome/free-solid-svg-icons';

const CreateScrapingJob = ({ initial_scope = "single", onJobCreated }) => {
    const { loading, withLoader } = useLoader();
    const [researchers, setResearchers] = useState([]);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        scope: 'single',
        source: 'orcid',
        researcherId: '',
        orcid: '',
        orcidBatch: [],
        researcherBatch: [],
        currentOrcidInput: ''
    });

    const [jsonUpload, setJsonUpload] = useState({
        isProcessing: false,
        error: null,
        success: false,
        processedCount: 0
    });
    useEffect(() => {
        handleScopeChange(initial_scope);
        loadResearchers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadResearchers = async () => {
        try {
            const result = await withLoader(() => researcherService.getResearchers());
            setResearchers(result.data || []);
        } catch (error) {
            console.error('Failed to load researchers:', error);
        }
    };

    const handleScopeChange = (scope) => {
        setFormData(prev => ({
            ...prev,
            scope,
            researcherId: '',
            orcid: '',
            orcidBatch: [],
            researcherBatch: [],
            currentOrcidInput: ''
        }));
        setJsonUpload({
            isProcessing: false,
            error: null,
            success: false,
            processedCount: 0
        });
    };

    const handleResearcherSelect = (researcher) => {
        if (formData.scope === 'single') {
            setFormData(prev => ({
                ...prev,
                researcherId: researcher._id,
                orcid: ''
            }));
        } else if (formData.scope === 'batch') {
            // Add to batch if not already added
            if (!formData.researcherBatch.find(r => r._id === researcher._id)) {
                setFormData(prev => ({
                    ...prev,
                    researcherBatch: [...prev.researcherBatch, researcher]
                }));
            }
        }
    };

    const handleOrcidAdd = () => {
        if (formData.currentOrcidInput.trim() && formData.scope === 'batch') {
            const orcid = formData.currentOrcidInput.trim();
            if (!formData.orcidBatch.includes(orcid)) {
                setFormData(prev => ({
                    ...prev,
                    orcidBatch: [...prev.orcidBatch, orcid],
                    currentOrcidInput: ''
                }));
            }
        } else if (formData.currentOrcidInput.trim() && formData.scope === 'single') {
            setFormData(prev => ({
                ...prev,
                orcid: formData.currentOrcidInput.trim(),
                researcherId: ''
            }));
            setFormData(prev => ({ ...prev, currentOrcidInput: '' }));
        }
    };

    const removeResearcherFromBatch = (researcherId) => {
        setFormData(prev => ({
            ...prev,
            researcherBatch: prev.researcherBatch.filter(r => r._id !== researcherId)
        }));
    };

    const removeOrcidFromBatch = (orcid) => {
        setFormData(prev => ({
            ...prev,
            orcidBatch: prev.orcidBatch.filter(o => o !== orcid)
        }));
    };

    const clearAllOrcids = () => {
        setFormData(prev => ({
            ...prev,
            orcidBatch: []
        }));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setJsonUpload({
            isProcessing: true,
            error: null,
            success: false,
            processedCount: 0
        });

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);
                const orcids = extractOrcidsFromJson(data);

                if (orcids.length === 0) {
                    throw new Error('No valid ORCIDs found in the JSON file');
                }

                const uniqueOrcids = [...new Set([...formData.orcidBatch, ...orcids])];

                setFormData(prev => ({
                    ...prev,
                    orcidBatch: uniqueOrcids
                }));

                setJsonUpload({
                    isProcessing: false,
                    error: null,
                    success: true,
                    processedCount: orcids.length
                });

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

            } catch (error) {
                setJsonUpload({
                    isProcessing: false,
                    error: error.message,
                    success: false,
                    processedCount: 0
                });
            }
        };

        reader.onerror = () => {
            setJsonUpload({
                isProcessing: false,
                error: 'Failed to read file',
                success: false,
                processedCount: 0
            });
        };

        reader.readAsText(file);
    };

    const extractOrcidsFromJson = (data) => {
        const orcids = new Set();

        if (Array.isArray(data)) {
            // Case 1: Array of ORCID strings
            data.forEach(item => {
                if (typeof item === 'string' && isValidOrcid(item)) {
                    orcids.add(normalizeOrcid(item));
                } else if (typeof item === 'object' && item !== null) {
                    // Case 2: Array of objects with orcid field
                    extractOrcidsFromObject(item, orcids);
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            // Case 3: Single object or nested structure
            extractOrcidsFromObject(data, orcids);
        }

        return Array.from(orcids);
    };

    const extractOrcidsFromObject = (obj, orcidsSet) => {
        // Recursively search for ORCID fields
        Object.keys(obj).forEach(key => {
            const value = obj[key];

            if (typeof value === 'string' && isValidOrcid(value)) {
                orcidsSet.add(normalizeOrcid(value));
            } else if (typeof value === 'object' && value !== null) {
                extractOrcidsFromObject(value, orcidsSet);
            } else if (Array.isArray(value)) {
                value.forEach(item => {
                    if (typeof item === 'string' && isValidOrcid(item)) {
                        orcidsSet.add(normalizeOrcid(item));
                    } else if (typeof item === 'object' && item !== null) {
                        extractOrcidsFromObject(item, orcidsSet);
                    }
                });
            }
        });
    };

    const isValidOrcid = (orcid) => {
        const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
        return orcidRegex.test(orcid);
    };

    const normalizeOrcid = (orcid) => {
        return orcid.trim().toUpperCase();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const jobData = {
                scope: formData.scope,
                source: formData.source
            };

            if (formData.scope === 'single') {
                if (formData.researcherId) {
                    jobData.researcherId = formData.researcherId;
                } else if (formData.orcid) {
                    jobData.orcid = formData.orcid;
                } else {
                    alert('Please select a researcher or enter an ORCID');
                    return;
                }
            } else if (formData.scope === 'batch') {
                if (formData.researcherBatch.length > 0) {
                    jobData.researcherBatch = formData.researcherBatch.map(r => r._id);
                }
                if (formData.orcidBatch.length > 0) {
                    jobData.orcidBatch = formData.orcidBatch;
                }

                if (formData.researcherBatch.length === 0 && formData.orcidBatch.length === 0) {
                    alert('Please add at least one researcher or ORCID to the batch');
                    return;
                }
            }

            const result = await withLoader(() => scrapingService.createScrapingJob(jobData));

            // Reset form on success
            setFormData({
                scope: 'single',
                source: 'orcid',
                researcherId: '',
                orcid: '',
                orcidBatch: [],
                researcherBatch: [],
                currentOrcidInput: ''
            });

            setJsonUpload({
                isProcessing: false,
                error: null,
                success: false,
                processedCount: 0
            });

            // Call the callback if provided, otherwise show alert
            if (onJobCreated) {
                onJobCreated(result);
            } else {
                alert('Scraping job created successfully!');
            }

        } catch (error) {
            console.error('Failed to create scraping job:', error);
            alert('Failed to create scraping job. Please try again.');
        }
    };

    const getSelectedResearcher = () => {
        if (formData.scope === 'single' && formData.researcherId) {
            return researchers.find(r => r._id === formData.researcherId);
        }
        return null;
    };

    // Updated ResearcherSearch component with internal state
    const ResearcherSearch = ({ onResearcherSelect, researchers }) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [filteredResearchers, setFilteredResearchers] = useState([]);
        const [showDropdown, setShowDropdown] = useState(false);
        const inputRef = useRef(null);

        // Filter researchers based on search term
        useEffect(() => {
            if (searchTerm.trim() === '') {
                setFilteredResearchers([]);
            } else {
                const filtered = researchers.filter(researcher =>
                    researcher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    researcher.orcid?.includes(searchTerm)
                );
                setFilteredResearchers(filtered.slice(0, 10)); // Limit to 10 results
            }
        }, [searchTerm, researchers]);

        const handleInputChange = (e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
        };

        const handleResearcherClick = (researcher) => {
            onResearcherSelect(researcher);
            setSearchTerm('');
            setShowDropdown(false);
        };

        const handleInputFocus = () => {
            setShowDropdown(true);
        };

        const handleInputBlur = () => {
            // Use setTimeout to allow click event to register before hiding dropdown
            setTimeout(() => {
                setShowDropdown(false);
            }, 200);
        };

        return (
            <div className="relative">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder="Search researchers by name or ORCID..."
                            className="w-full px-3 py-2 border-2 qut-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-qut-blue qut-bg-tertiary"
                        />
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute right-3 top-3 text-qut-text-secondary"
                        />
                    </div>
                </div>

                {showDropdown && filteredResearchers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 border-2 qut-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto qut-bg-tertiary">
                        {filteredResearchers.map(researcher => (
                            <div
                                key={researcher._id}
                                onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                                onClick={() => handleResearcherClick(researcher)}
                                className="px-3 py-2 hover:bg-qut-tertiary cursor-pointer border-b qut-border-primary last:border-b-0"
                            >
                                <div className="font-medium text-qut-text-primary">
                                    {researcher.name}
                                </div>
                                <div className="text-sm text-qut-text-secondary">
                                    {researcher.orcid}
                                </div>
                                {researcher.institution && (
                                    <div className="text-xs text-qut-text-secondary">
                                        {researcher.institution}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const JsonUploadSection = () => (
        <div className="mt-6 p-4 border-2 border-dashed border-qut-blue rounded-lg bg-qut-tertiary">
            <div className="text-center">
                <FontAwesomeIcon icon={faFileImport} className="text-2xl text-qut-light-blue mb-2" />
                <h4 className="font-medium text-qut-text-primary mb-2">
                    Bulk Import ORCIDs from JSON
                </h4>
                <p className="text-sm text-qut-text-secondary mb-3">
                    Upload a JSON file containing ORCIDs. Supports various formats.
                </p>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                    id="json-upload"
                />
                <label
                    htmlFor="json-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-qut-blue text-white rounded-lg cursor-pointer hover:bg-qut-dark-blue transition-colors"
                >
                    <FontAwesomeIcon icon={faUpload} />
                    Choose JSON File
                </label>

                {/* Upload Status */}
                {jsonUpload.isProcessing && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-qut-blue">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span className="text-sm">Processing JSON file...</span>
                    </div>
                )}

                {jsonUpload.success && (
                    <div className="mt-3 p-2 bg-qut-success bg-opacity-10 border border-qut-success rounded">
                        <div className="flex items-center gap-2 text-qut-success text-sm">
                            <FontAwesomeIcon icon={faPlus} />
                            Successfully added {jsonUpload.processedCount} ORCID(s) from JSON file
                        </div>
                    </div>
                )}

                {jsonUpload.error && (
                    <div className="mt-3 p-2 bg-qut-danger bg-opacity-10 border border-qut-danger rounded">
                        <div className="flex items-center gap-2 text-qut-danger text-sm">
                            <FontAwesomeIcon icon={faWarning} />
                            {jsonUpload.error}
                        </div>
                    </div>
                )}

                {/* JSON Format Examples */}
                <details className="mt-3 text-left">
                    <summary className="text-sm text-qut-text-secondary cursor-pointer hover:text-qut-text-primary">
                        Supported JSON formats
                    </summary>
                    <div className="mt-2 p-3 qut-bg-primary rounded text-xs font-mono">
                        <div className="mb-2 qut-text-tertiary">{"// Array of ORCID strings"}</div>
                        <div className="text-qut-blue mb-3">["0000-0002-1825-0097", "0000-0001-5109-3700"]</div>
                    </div>
                </details>
            </div>
        </div>
    );

    const ScopeCard = ({ scope, icon, title, description, isSelected, onClick }) => (
        <div
            onClick={onClick}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                ? 'border-qut-blue bg-qut-dark-blue text-white'
                : 'qut-border-primary hover:border-qut-blue hover:bg-qut-tertiary'
                }`}
        >
            <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon
                    icon={icon}
                    className={`text-lg ${isSelected ? 'text-qut-light-blue' : 'text-qut-text-secondary'}`}
                />
                <h3 className="font-semibold text-qut-text-primary">{title}</h3>
            </div>
            <p className="text-sm text-qut-text-secondary">{description}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="qut-bg-secondary rounded-lg shadow-md p-6 border-2 qut-border-primary">
                <h2 className="text-2xl font-bold text-qut-text-primary mb-6 flex items-center gap-3">
                    <FontAwesomeIcon icon={faPlus} className="text-qut-blue" />
                    Create New Scraping Job
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Scope Selection */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-qut-text-secondary mb-4">
                            Select Scope:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ScopeCard
                                scope="single"
                                icon={faUser}
                                title="Single Researcher"
                                description="Scrape data for one specific researcher"
                                isSelected={formData.scope === 'single'}
                                onClick={() => handleScopeChange('single')}
                            />
                            <ScopeCard
                                scope="batch"
                                icon={faUsers}
                                title="Batch Researchers"
                                description="Scrape data for multiple researchers at once"
                                isSelected={formData.scope === 'batch'}
                                onClick={() => handleScopeChange('batch')}
                            />
                            <ScopeCard
                                scope="all"
                                icon={faGlobe}
                                title="All Researchers"
                                description="Scrape data for all researchers in the system"
                                isSelected={formData.scope === 'all'}
                                onClick={() => handleScopeChange('all')}
                            />
                        </div>
                    </div>

                    {/* Single Scope Form */}
                    {formData.scope === 'single' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-qut-text-secondary mb-3">
                                    Select Researcher:
                                </label>
                                <ResearcherSearch
                                    onResearcherSelect={handleResearcherSelect}
                                    researchers={researchers}
                                />

                                {getSelectedResearcher() && (
                                    <div className="mt-3 p-3 bg-qut-success bg-opacity-10 border border-qut-success rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-qut-text-primary">
                                                    {getSelectedResearcher().name}
                                                </div>
                                                <div className="text-sm text-qut-text-secondary">
                                                    ORCID: {getSelectedResearcher().orcid}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, researcherId: '' }))}
                                                className="text-qut-danger hover:text-qut-danger-dark"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="text-center text-qut-text-secondary">OR</div>

                            <div>
                                <label className="block text-sm font-medium text-qut-text-secondary mb-2">
                                    Enter New ORCID:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.currentOrcidInput}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentOrcidInput: e.target.value }))}
                                        placeholder="e.g., 0000-0002-1825-0097"
                                        className="flex-1 px-3 py-2 border-2 qut-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-qut-blue qut-bg-tertiary"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOrcidAdd}
                                        disabled={!formData.currentOrcidInput.trim()}
                                        className="px-4 py-2 bg-qut-blue text-white rounded-lg hover:bg-qut-dark-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {formData.orcid && (
                                <div className="p-3 bg-qut-success bg-opacity-10 border border-qut-success rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-qut-text-primary">
                                                New Researcher
                                            </div>
                                            <div className="text-sm text-qut-text-secondary">
                                                ORCID: {formData.orcid}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, orcid: '' }))}
                                            className="text-qut-danger hover:text-qut-danger-dark"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Batch Scope Form */}
                    {formData.scope === 'batch' && (
                        <div className="space-y-6">
                            {/* Existing Researchers */}
                            <div>
                                <label className="block text-sm font-medium text-qut-text-secondary mb-3">
                                    Add Existing Researchers:
                                </label>
                                <ResearcherSearch
                                    onResearcherSelect={handleResearcherSelect}
                                    researchers={researchers}
                                />

                                {formData.researcherBatch.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-qut-text-primary flex items-center gap-2">
                                                <FontAwesomeIcon icon={faList} />
                                                Selected Researchers ({formData.researcherBatch.length})
                                            </h4>
                                        </div>
                                        {formData.researcherBatch.map(researcher => (
                                            <div key={researcher._id} className="flex items-center justify-between p-3 qut-bg-primary border qut-border-primary rounded-lg">
                                                <div>
                                                    <div className="font-medium text-qut-text-primary">
                                                        {researcher.name}
                                                    </div>
                                                    <div className="text-sm text-qut-text-secondary">
                                                        {researcher.orcid}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeResearcherFromBatch(researcher._id)}
                                                    className="text-qut-danger hover:text-qut-danger-dark"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* New ORCIDs */}
                            <div>
                                <label className="block text-sm font-medium text-qut-text-secondary mb-3">
                                    Add New Researchers by ORCID:
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={formData.currentOrcidInput}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentOrcidInput: e.target.value }))}
                                        placeholder="Enter ORCID (e.g., 0000-0002-1825-0097)"
                                        className="flex-1 px-3 py-2 border-2 qut-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-qut-blue qut-bg-tertiary"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOrcidAdd}
                                        disabled={!formData.currentOrcidInput.trim()}
                                        className="px-4 py-2 bg-qut-blue text-white rounded-lg hover:bg-qut-dark-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                </div>

                                {formData.orcidBatch.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-qut-text-primary">
                                                ORCIDs to Process ({formData.orcidBatch.length})
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={clearAllOrcids}
                                                className="text-xs text-qut-danger hover:text-qut-danger-dark"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {formData.orcidBatch.map((orcid, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 qut-bg-primary border-2 qut-border-primary rounded-lg">
                                                    <span className="font-mono text-qut-text-primary">{orcid}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOrcidFromBatch(orcid)}
                                                        className="text-qut-danger hover:text-qut-danger-dark"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* JSON Upload Section */}
                            <JsonUploadSection />
                        </div>
                    )}

                    {/* All Scope Form */}
                    {formData.scope === 'all' && (
                        <div className="text-center py-8">
                            <FontAwesomeIcon icon={faGlobe} className="text-4xl text-qut-blue mb-4" />
                            <h3 className="text-xl font-semibold text-qut-text-primary mb-2">
                                Scrape All Researchers
                            </h3>
                            <p className="text-qut-text-secondary">
                                This will scrape data for all researchers currently in the system.
                                The system will automatically detect and add any new publications found.
                            </p>
                        </div>
                    )}

                    {/* Source Selection */}
                    <div className="mt-8 pt-6 border-t qut-border-primary">
                        <label className="block text-sm font-medium text-qut-text-secondary mb-3">
                            Data Source:
                        </label>
                        <select
                            value={formData.source}
                            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                            className="px-3 py-2 border-2 qut-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-qut-blue qut-bg-tertiary"
                        >
                            <option value="orcid">ORCID</option>
                            {/* Add other sources as needed */}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-qut-blue text-white rounded-lg font-medium hover:bg-qut-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                                <FontAwesomeIcon icon={faPlay} />
                            )}
                            {loading ? 'Creating Job...' : 'Start Scraping Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateScrapingJob;