const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongodb');
const { authorizeUser, authorizeAdmin } = require('../middleware/authMiddleware');
const { ResearchArea, TechnicalSkill } = require('../models/tagModels');
const Researcher = require('../models/researcherModel');
const Publication = require('../models/publicationModel');
const {generateAreaEmbeddings, generateSkillEmbeddings, generateWordEmbedding, assignSkillsByDescription, getResearcherTags} = require('../utils/tags');
const { validateId, validateRequestBody, validateParams, rejectQueryParams } = require('../middleware/validateMiddleware');

// Create a new Research Area or Technical Skill
// Embedding is generated and stored in the database along with the new tag
const createAreaOrSkill = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody(['name', 'type', 'batch'], req, res) || !validateParams([], req, res)) return;
    // name = new Research Area / Technical Skill
    // type = 'Area' or 'Skill'
    // batch = true if creating in batch mode, false otherwise
  const { name, type, batch } = req.body;

  const areaData = {
    name: name?.trim().replace(/[^a-zA-Z0-9'-)(,.]/g, ''),
    type: type?.trim(),
    batch: batch?.toString().trim()
  }

  if(!areaData.name || !areaData.type || !areaData.batch) {
    return res.status(400).json({ message: "Invalid request body" });
  }


  if(areaData.type !== 'Area' && areaData.type !== 'Skill') {
    return res.status(400).json({ message: "Invalid type. Must be 'Area' or 'Skill'" });
  }
  
    let tagArray;
    if(areaData.batch === 'true') {
        tagArray = name.split(',').map(tag => tag.trim());
        if(tagArray.length === 0) {
            return res.status(400).json({ message: "In batch mode, name must be a non-empty array" });
        }
    } else if(areaData.batch === 'false') {
        // Single creation mode
        tagArray = name.split(',').map(tag => tag.trim());
        if(Array.isArray(tagArray) && tagArray.length > 1) {
            return res.status(400).json({ message: "In single creation mode, name must be a single string" });
        }
    } else {
        return res.status(400).json({ message: "Batch must be 'true' or 'false'" });
    }

    if(areaData.batch === 'false'){
        // Single creation mode
        const existingTag = areaData.type === 'Area'
            ? await ResearchArea.findOne({ name: areaData.name })
            : await TechnicalSkill.findOne({ name: areaData.name });

        if (existingTag) {
            return res.status(400).json({ message: "Tag already exists" });
        }

        const embedding = await generateWordEmbedding(areaData.name);
        const newTag = areaData.type === 'Area'
            ? await ResearchArea.create({ name: areaData.name, embedding: Array.from(embedding) })
            : await TechnicalSkill.create({ name: areaData.name, embedding: Array.from(embedding) });

        res.status(201).json(newTag);
    } else {
        // Batch creation mode
        const createdTags = [];
        for (const tagName of tagArray) {
            const existingTag = areaData.type === 'Area'
                ? await ResearchArea.findOne({ name: tagName })
                : await TechnicalSkill.findOne({ name: tagName });

            if (existingTag) {
                continue; 
            }

            const embedding = await generateWordEmbedding(tagName);
            const newTag = areaData.type === 'Area'
                ? await ResearchArea.create({ name: tagName, embedding: Array.from(embedding) })
                : await TechnicalSkill.create({ name: tagName, embedding: Array.from(embedding) });
            createdTags.push(newTag);
        }
        res.status(201).json(createdTags);
    }
})];

// Reset embeddings for all Research Areas and Technical Skills
// Tag names are unaffected
const resetEmbeddings = [authorizeAdmin,asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    try {
        await ResearchArea.updateMany({}, { embedding: [] });
        await TechnicalSkill.updateMany({}, { embedding: [] });
        res.status(200).json({ message: "Embeddings reset successfully" });
    } catch (error) {
        console.error("Error resetting embeddings:", error);
        res.status(500).json({ message: "Error resetting embeddings" });
    }
})];

// Delete from research areas or technical skills
// If a name is specified, remove that one
// Otherwise, delete all from that type
const deleteTags = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody(['type', 'name'], req, res) || !validateParams([], req, res)) return;
    try {
        const {type, name} = req.body;
        if (!type || !name) {
            return res.status(400).json({ message: "Type and name are required" });
        }
        
        if(type === 'Area') {
            if(name !== 'all') {
                const res = await ResearchArea.deleteOne({ name: name });
                const delRes = await Researcher.updateMany({ researchAreas: name.trim() }, { $pull: { researchAreas: name.trim() } });
            } else {
                await ResearchArea.deleteMany({});
            }

        } else if(type === 'Skill') {
            if(name !== 'all') {
                const res = await TechnicalSkill.deleteOne({ name: name });
                const delRes = await Researcher.updateMany({ technicalSkills: name }, { $pull: { technicalSkills: name } });
            } else {
                await TechnicalSkill.deleteMany({});
            }
        } else {
            return res.status(400).json({ message: "Invalid type. Must be 'Area' or 'Skill'" });
        }

        res.status(200).json({ message: "Tags deleted successfully" });
    } catch (error) {
        console.error("Error deleting tags:", error);
        res.status(500).json({ message: "Error deleting tags" });
    }
})];

// Generate embeddings for all Research Areas
const areaEmbeddings = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    try {

        const embeddingsMap = await generateAreaEmbeddings();

        for (const [name, embedding] of embeddingsMap.entries()) {
            await ResearchArea.findOneAndUpdate({ name: name }, { embedding: Array.from(embedding) });
        }

        res.status(200).json({ message: "Embeddings generated successfully", areas: Array.from(embeddingsMap.keys()) });

    } catch (error) {
        console.error("Error generating embeddings:", error);
        res.status(500).json({ message: "Error generating embeddings" });
    }

})];

// Generate embeddings for technical skills
const skillEmbeddings = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    try {

        const embeddingsMap = await generateAreaEmbeddings();

        for (const [name, embedding] of embeddingsMap.entries()) {
            await TechnicalSkill.findOneAndUpdate({ name: name }, { embedding: Array.from(embedding) });
        }

        res.status(200).json({ message: "Embeddings generated successfully", skills: Array.from(embeddingsMap.keys()) });

    } catch (error) {
        console.error("Error generating embeddings:", error);
        res.status(500).json({ message: "Error generating embeddings" });
    }

})];

// Same as above function, except assigns technical skills to every researcher in the DB
const allDescriptionEmbeddings = [authorizeAdmin, asyncHandler(async (req, res) => {
    if( rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const researchers = await Researcher.find().lean();

    if (!researchers) {
        return res.status(404).json({ message: "Researchers not found" });
    }
    const failedResearchers = [];
    const total = researchers.length;
    let updated = 0;
    for(const researcher of researchers){
        const populatedResearcher = await Researcher.findById(researcher._id).populate('publications', 'description').lean();
        if(!populatedResearcher){
            continue;
        }
        const skills = await assignSkillsByDescription(populatedResearcher.publications);
        
        if(skills.length === 0){
            failedResearchers.push(researcher._id);
        } else {
            
            const update = await Researcher.findByIdAndUpdate(researcher._id, {technicalSkills: skills});
            
            if(update){
                updated++;
            } 
        }

    }

    res.status(200).json({ total: total, updated: updated, failed: failedResearchers });
})];

/**
* Assign every researcher research areas based on the titles of their publications
*/

const allResearchAreas = [authorizeAdmin, asyncHandler(async (req, res) => {
    if( rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const researchers = await Researcher.find().lean();

    if (!researchers) {
        return res.status(404).json({ message: "Researchers not found" });
    }
    const failedResearchers = [];
    const total = researchers.length;
    let updated = 0;

    for(const researcher of researchers){
        
        const areas = await getResearcherTags(researcher._id);
       
        if(areas.length === 0){
            failedResearchers.push(researcher._id);
        } else {
            if(researcher.researchAreas === areas){
                continue;
            }
            const update = await Researcher.findByIdAndUpdate(researcher._id, {researchAreas: areas});
            
            if(update){
                updated++;
            } 
        }

    }

    res.status(200).json({ total: total, updated: updated, failed: failedResearchers });
})];

/**
* Returns array of research areas as an array:
* ['area', 'area', 'area',...]
*/
const getResearchAreas = asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const areas = await ResearchArea.find({}).select('name').sort({ name: 1 });
    if(areas.length === 0) {
        return res.status(200).json({ message: "Connection successful, but no research areas found" });
    }
    res.status(200).json({ areas: Array.from(areas.map(area => area.name)) });
});

/**
* Returns array of technical skills as an array:
* ['skill', 'skill', 'skill',...]
*/
const getTechnicalSkills = asyncHandler(async (req, res) => {
    if (rejectQueryParams(req, res) || !validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const skills = await TechnicalSkill.find({}).select('name').sort({ name: 1 });
    if(skills.length === 0) {
        return res.status(200).json({ message: "Connection successful, but no technical skills found" });
    }
    res.status(200).json({ skills: Array.from(skills.map(skill => skill.name)) });
});


const adminGetAreas = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (!validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const { status, limit = 15, page = 1 } = req.query;

    const filter = {};

    const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { name: 1 },
        };

    try {
        let areas = await ResearchArea.paginate(filter, options);

        areas.docs = await Promise.all(areas.docs.map(async area => {
            const researcherCount = await Researcher.countDocuments({ researchAreas: area.name });
            
            const areaObj = area.toObject(); // convert from Mongoose doc to plain JS object
            areaObj.referenced = researcherCount;
            areaObj.type = 'Area';
            return areaObj;
        }));
       
        res.status(200).json({
            success: true,
            data: areas.docs,
            totalCount: areas.totalDocs,
            totalPages: areas.totalPages,
            currentPage: areas.page,
            hasNextPage: areas.hasNextPage,
            hasPrevPage: areas.hasPrevPage
        });
    } catch (error) {
        console.error("Error fetching areas:", error);
        res.status(500).json({ message: "Error fetching areas" });
    }
})];


const adminGetSkills = [authorizeAdmin, asyncHandler(async (req, res) => {
    if (!validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const { status, limit = 50, page = 1 } = req.query;

    const filter = {};

    const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { name: 1 },
        };

    try {
        let skills = await TechnicalSkill.paginate(filter, options);

        skills.docs = await Promise.all(skills.docs.map(async skill => {
            const researcherCount = await Researcher.countDocuments({ technicalSkills: skill.name });
            
            const skillObj = skill.toObject(); // convert from Mongoose doc to plain JS object
            skillObj.referenced = researcherCount;
            skillObj.type = 'Skill';
            return skillObj;
        }));
       
        res.status(200).json({
            success: true,
            data: skills.docs,
            totalCount: skills.totalDocs,
            totalPages: skills.totalPages,
            currentPage: skills.page,
            hasNextPage: skills.hasNextPage,
            hasPrevPage: skills.hasPrevPage
        });
    } catch (error) {
        console.error("Error fetching areas:", error);
        res.status(500).json({ message: "Error fetching areas" });
    }
})];

module.exports = {adminGetAreas, adminGetSkills, allDescriptionEmbeddings, allResearchAreas,  getResearchAreas, getTechnicalSkills, createAreaOrSkill, skillEmbeddings, areaEmbeddings, resetEmbeddings, deleteTags };