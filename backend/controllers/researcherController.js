const asyncHandler = require('express-async-handler');
const Researcher = require('../models/researcherModel');
const {User} = require('../models/userModel');
const Publication = require('../models/publicationModel');
const ScrapingMetadata = require('../models/scrapingMetadataModel');
const { authorizeUser, authorizeAdmin } = require('../middleware/authMiddleware');
const { getResearcherTags, assignSkillsByDescription } = require("../utils/tags");
const { getPublicationDescriptions } = require('../utils/eprints');
const { validateId, validateRequestBody, validateParams, rejectQueryParams, validateName, cleanString } = require('../middleware/validateMiddleware');
const emailValidator = require('email-validator');


const safeParseJSON = (jsonString) => {
  try {
    if (typeof jsonString !== 'string' || !jsonString) return [];
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('JSON Parse Error:', error.message);
    return [];
  }
};


// Assign technical skills for a given researcher based on the descriptions of their publications
// Assumes that their publications have descriptions, otherwise it won't assign anything
const researcherTechnicalSkills = [authorizeAdmin, asyncHandler(async (req, res) => {
  if (!validateId(req.params.id, res) || !validateRequestBody([], req, res) || !validateParams(['id'], req, res)) return;

  try {
    const researcherID = req.params.id;
    if (researcherID.length !== 24) {
      return res.status(400).json({ message: "Invalid Researcher ID" });
    }
    if (!researcherID) {
      return res.status(400).json({ message: "Researcher ID is required" });
    }

    const researcher = await Researcher.findById(researcherID)
      .populate('publications', 'description')
      .lean();

    if (!researcher) {
      return res.status(404).json({ message: "Researcher not found" });
    }

    const skills = await assignSkillsByDescription(researcher.publications);

    if (skills.length > 0) {
      const newSkills = researcher.technicalSkills || [];
      for (const skill of skills) {
        if (!newSkills.includes(skill)) {
          newSkills.push(skill);
        }
      }
     
      await Researcher.findByIdAndUpdate(researcher._id, { technicalSkills: newSkills });
      res.status(200).json({ message: `Technical skills assigned to researcher: ${researcher.name}` });
    } else {
      res.status(400).json({ message: "No technical skills assigned" });
    }
  } catch (err) {
    res.status(500).json({ message: `Error assigning technical skills to researcher: ${researcher.name}` });
  }

})];

const validateResearchAreas = (areas) => Array.isArray(areas)
  ? areas.filter(area => typeof area === 'string' && area.trim()).map(area => area.trim()).slice(0, 10)
  : [];


// @desc    Get all researchers with pagination
// @route   GET /api/researchers
// @access  Public
const getResearchers = asyncHandler(async (req, res) => {
  const { sortby = 'name', asc = 'false', researchAreas = [], technicalSkills = [], withPublications, limit = 50, page = 1 } = req.query;

  if (validateParams(['sortby', 'asc', 'researchAreas', 'technicalSkills', 'withPublications', 'limit', 'page'], req, res) === false) return;
  const allowedSortFields = ['name', 'createdAt', 'updatedAt', 'institution', 'publicationsCount'];
  const sortField = allowedSortFields.includes(sortby) ? sortby : 'name';

  // Helper function to escape special regex characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const filter = {};
  const options = {
    page: Math.max(1, parseInt(page)),
    limit,
    sort: { [sortField]: asc === 'true' || asc === true ? 1 : -1 }
  };

  if (researchAreas !== undefined && researchAreas !== null) {
    const areasArray = Array.isArray(researchAreas) ? researchAreas : [researchAreas];
    if (areasArray.length > 0) {
      filter.researchAreas = {
        $all: areasArray.map(area => new RegExp(escapeRegex(area), 'i'))
      };
    }
  }

  if (technicalSkills !== undefined && technicalSkills !== null) {
    const skillsArray = Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills];
    if (skillsArray.length > 0) {
      filter.technicalSkills = {
        $in: skillsArray.map(skill => new RegExp(escapeRegex(skill), 'i'))
      };
    }
  }

  let totalPublications = undefined;
  if (withPublications === 'true' || withPublications === true) {
    options.populate = [
      { path: 'publications' },
    ]
    totalPublications = await Publication.countDocuments();
  }

  const result = await Researcher.paginate(filter, options);

  res.json({
    success: true,
    data: result.docs,
    totalCount: result.totalDocs,
    totalPubs: totalPublications,
    totalPages: result.totalPages,
    currentPage: result.page,
    pageSize: result.limit,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage
  });
});

// @desc    Get all publications with search and pagination
// @route   GET /api/publications/search
// @access  Public
const searchPublications = asyncHandler(async (req, res) => {
  const { title, year, author, page = 1 } = req.query;
  if (validateParams(['title', 'year', 'author', 'page'], req, res) === false) return;

  if ((author && !validateName(author))) {
    return res.status(400).json({ success: false, message: 'Invalid author name format' });
  }
  const perPage = 100;
  const currentPage = Math.max(1, parseInt(page));
  const skip = (currentPage - 1) * perPage;


  if (year && (!/^\d{4}$/.test(year) || year < 1900 || year > new Date().getFullYear() + 5)) {
    return res.status(400).json({ success: false, message: 'Invalid year format' });
  }

  const query = {
    ...(title?.trim() && { title: { $regex: title.trim(), $options: 'i' } }),
    ...(year && { year: parseInt(year) }),
    ...(author?.trim() && { authors: { $regex: author.trim(), $options: 'i' } })
  };

  const [publications, total] = await Promise.all([
    Publication.find(query).populate('associated_researchers', 'name institution')
      .sort({ year: -1, _id: 1 }).skip(skip).limit(perPage).lean(),
    Publication.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: publications,
    pagination: {
      total,
      lastPage: Math.ceil(total / perPage),
      perPage,
      currentPage,
      from: skip + 1,
      to: Math.min(skip + perPage, total),
      nextPage: currentPage < Math.ceil(total / perPage) ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null
    }
  });
});

// @desc    Get publication details by ID
// @route   GET /api/publications/data/:id
// @access  Public
const getPublicationById = asyncHandler(async (req, res) => {
  if (rejectQueryParams(req, res) || !validateId(req.params.id, res)) return;
  if (!validateParams(['id'], req, res)) return;

  const publication = await Publication.findById(req.params.id)
    .populate('associated_researchers', 'name institution').lean();

  if (!publication) {
    return res.status(404).json({ success: false, message: 'Publication not found' });
  }

  res.json({ success: true, data: publication });
});

// @desc    Get a single researcher with details
// @route   GET /api/researchers/:id
// @access  Public
const getResearcherById = asyncHandler(async (req, res) => {
  if (rejectQueryParams(req, res) || !validateId(req.params.id, res)) return;
  if (!validateParams(['id'], req, res)) return;

  const [researcher, scrapingInfo] = await Promise.all([
    Researcher.findById(req.params.id).populate('publications', 'title authors year url tags').lean(),
    ScrapingMetadata.findOne({ researcher: req.params.id }).lean()
  ]);

  if (!researcher) {
    return res.status(404).json({ success: false, message: 'Researcher not found' });
  }

  res.json({
    success: true,
    data: {
      ...researcher,
      research_areas: researcher.researchAreas,
      scraping_info: scrapingInfo ? {
        auto_scraped: scrapingInfo.autoScraped,
        last_scrape_attempt: scrapingInfo.lastScrapeAttempt,
        scrape_url: scrapingInfo.scrapeUrl,
        attempted: scrapingInfo.attempted,
        successful: scrapingInfo.successful,
        publications_found: scrapingInfo.publicationsFound,
        error: scrapingInfo.error
      } : null
    }
  });
});

// @desc    Create a new researcher with scraping
// @route   POST /api/researchers
// @access  Public
const createResearcher = asyncHandler(async (req, res) => {
  const { name, institution, researchAreas = [], scrapeUrl, autoScrape = true, skipExisting = true } = req.body;
  if (rejectQueryParams(req, res) || !validateRequestBody(['name', 'institution', 'researchAreas', 'scrapeUrl', 'autoScrape', 'skipExisting'], req, res)) return;
  if (!validateName(name)) {
    return res.status(400).json({ success: false, message: 'Invalid name format' });
  }

  if (!name?.trim() || !institution?.trim()) {
    return res.status(400).json({ success: false, message: 'Name and institution are required' });
  }

  if (name.trim().length > 255 || institution.trim().length > 255) {
    return res.status(400).json({ success: false, message: 'Name and institution must be less than 255 characters' });
  }

  const cleanName = cleanString(name.trim());
  const cleanInstitution = cleanString(institution.trim());
  const validatedAreas = validateResearchAreas(researchAreas);

  if (skipExisting) {
    const existing = await Researcher.findOne({
      name: { $regex: `^${cleanName}$`, $options: 'i' },
      institution: { $regex: `^${cleanInstitution}$`, $options: 'i' }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Researcher already exists' });
    }
  }

  let scrapingResults = { attempted: false, successful: false, publicationsFound: 0, error: null };
  let publicationIds = [];

  if (autoScrape) {
    try {
      const targetUrl = scrapeUrl || generateEprintsUrl(cleanName, cleanInstitution);
      if (!targetUrl) throw new Error('Unable to generate scraping URL');

      const rawData = await scraper.scrapeResearcherPublications(targetUrl);
      const scrapedPublications = safeParseJSON(rawData).filter(pub => pub?.title);

      for (const pub of scrapedPublications) {
        const existing = await Publication.findOne({ url: pub.url });
        publicationIds.push(existing ? existing._id : (await Publication.create({ ...pub, source_url: targetUrl, scraped_at: new Date() }))._id);
      }

      scrapingResults = { attempted: true, successful: true, publicationsFound: publicationIds.length };
    } catch (error) {
      scrapingResults = { attempted: true, successful: false, publicationsFound: 0, error: error.message };
      const fallbackPubs = await Publication.find({ authors: { $regex: cleanName, $options: 'i' } }).select('_id').lean();
      publicationIds = fallbackPubs.map(pub => pub._id);
    }
  }

  try {
    const newResearcher = await Researcher.create({
      name: cleanName,
      institution: cleanInstitution,
      researchAreas: validatedAreas,
      publications: publicationIds
    });

    if (publicationIds.length) {
      await Publication.updateMany({ _id: { $in: publicationIds } }, { $addToSet: { associated_researchers: newResearcher._id } });
    }

    await ScrapingMetadata.create({
      researcher: newResearcher._id,
      autoScraped: autoScrape,
      lastScrapeAttempt: autoScrape ? new Date() : null,
      scrapeUrl: autoScrape ? (scrapeUrl || generateEprintsUrl(cleanName, cleanInstitution)) : null,
      ...scrapingResults
    });

    const createdResearcher = await Researcher.findById(newResearcher._id).populate('publications', 'title authors year url').lean();

    res.status(201).json({ success: true, message: 'Researcher created successfully', data: createdResearcher, scraping: scrapingResults });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Researcher already exists' });
    }
    throw err;
  }
});

// @desc    Manually trigger scraping for existing researcher
// @route   POST /api/researchers/:id/scrape
// @access  Private
const scrapeResearcherPublications = [
  authorizeUser,
  asyncHandler(async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    if (!validateParams(['id'], req, res) || rejectQueryParams(req, res) || !validateRequestBody(['scrapeUrl'], req, res)) return;

    const researcher = await Researcher.findById(req.params.id).lean();
    if (!researcher) {
      return res.status(404).json({ success: false, message: 'Researcher not found' });
    }

    const { scrapeUrl } = req.body;
    const existingMeta = await ScrapingMetadata.findOne({ researcher: req.params.id });
    const targetUrl = scrapeUrl || existingMeta?.scrapeUrl || generateEprintsUrl(researcher.name, researcher.institution);

    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'No scraping URL available' });
    }

    try {
      const rawData = await scraper.scrapeResearcherPublications(targetUrl);
      const validPublications = safeParseJSON(rawData).filter(pub => pub?.title);

      await Publication.deleteMany({ source_url: targetUrl });
      const publicationsToInsert = validPublications.map(pub => ({
        ...pub,
        source_url: targetUrl,
        scraped_at: new Date(),
        associated_researchers: [req.params.id]
      }));

      const insertedPublications = await Publication.insertMany(publicationsToInsert);
      const publicationIds = insertedPublications.map(pub => pub._id);

      const scrapingUpdate = {
        autoScraped: true,
        lastScrapeAttempt: new Date(),
        scrapeUrl: targetUrl,
        attempted: true,
        successful: true,
        publicationsFound: publicationIds.length,
        error: null
      };

      if (existingMeta) {
        await ScrapingMetadata.findByIdAndUpdate(existingMeta._id, scrapingUpdate);
      } else {
        await ScrapingMetadata.create({ researcher: req.params.id, ...scrapingUpdate });
      }

      await Researcher.findByIdAndUpdate(req.params.id, { $set: { publications: publicationIds } });

      res.json({ success: true, message: `Successfully scraped ${publicationIds.length} publications`, publications_found: publicationIds.length });
    } catch (error) {
      const errorUpdate = {
        autoScraped: true,
        lastScrapeAttempt: new Date(),
        scrapeUrl: targetUrl,
        attempted: true,
        successful: false,
        publicationsFound: 0,
        error: error.message
      };

      if (existingMeta) {
        await ScrapingMetadata.findByIdAndUpdate(existingMeta._id, errorUpdate);
      } else {
        await ScrapingMetadata.create({ researcher: req.params.id, ...errorUpdate });
      }

      res.status(500).json({ success: false, message: 'Scraping failed' });
    }
  })
];

// @desc    Update a researcher
// @route   PUT /api/researchers/:id
// @access  Private
const updateResearcher = [
  authorizeUser,
  asyncHandler(async (req, res) => {
    if (!validateId(req.params.id, res) || !validateParams(['id'], req, res)) return;

    const researcher = await Researcher.findById(req.params.id);
    if (!researcher) {
      return res.status(404).json({ success: false, message: 'Researcher not found' });
    }

    const updateData = {
      ...((req.body.name?.trim() && req.body.name !== researcher.name) && { name: cleanString(req.body.name.trim()) }),
      ...(emailValidator.validate(req.body.email?.trim()) && { email: req.body.email.trim() }),
      ...(req.body.orcid?.trim() && { orcid: req.body.orcid.trim() }),
      ...(req.body.eprintsLink?.trim() && { eprintsLink: req.body.eprintsLink.trim() }),
      ...(req.body.researchAreas && { researchAreas: validateResearchAreas(req.body.researchAreas) }),
      ...(req.body.technicalSkills && { technicalSkills: validateResearchAreas(req.body.technicalSkills) })
    };
   
    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: 'No valid update data provided' });
    }

    try {
      if(updateData?.name || updateData?.email){
        const updatedUser = await User.findOneAndUpdate({researcherId: req.params.id}, updateData);
        if(!updatedUser){
          return res.status(500).json({success: false, message: 'Failed to update User'})
        }
      }
      if(updateData?.name || updateData?.researchAreas || updateData?.technicalSkills ){
        const updatedResearcher = await Researcher.findOneAndUpdate({_id: req.params.id}, updateData);
        if(!updatedResearcher){
          return res.status(500).json({success: false, message: 'Failed to update User'})
        }
      }

      return res.status(200).json({success: true, message: 'Researcher Updated'})

    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Researcher already exists' });
      }
      throw error;
    }
  })
];

// @desc    Delete a researcher
// @route   DELETE /api/researchers/:id
// @access  Private
const deleteResearcher = [
  authorizeUser,
  asyncHandler(async (req, res) => {
    if (!validateId(req.params.id, res) || !validateParams(['id'], req, res) || rejectQueryParams(req, res) || !validateRequestBody([], req, res)) return;

    const researcher = await Researcher.findById(req.params.id);
    if (!researcher) {
      return res.status(404).json({ success: false, message: 'Researcher not found' });
    }

    await Promise.all([
      Publication.updateMany({ associated_researchers: req.params.id }, { $pull: { associated_researchers: req.params.id } }),
      ScrapingMetadata.findOneAndDelete({ researcher: req.params.id }),
      Researcher.findByIdAndDelete(req.params.id)
    ]);

    res.json({ success: true, message: 'Researcher deleted successfully' });
  })
];

const getTags = asyncHandler(async (req, res) => {
  try {
    if (!validateId(req.params.id, res) || !validateParams(['id'], req, res) || rejectQueryParams(req, res) || !validateRequestBody([], req, res)) return;
    const tags = await getResearcherTags(req.params.id);

    const researcher = await Researcher.findById(req.params.id).lean();

    if (!researcher) {
      return res.status(404).json({ success: false, message: 'Researcher not found' });
    }

    // add any research areas that the researcher has that are not in the tags list (in case they were deleted from the main tags collection)

    const newAreas = researcher.researchAreas.filter(area => !tags.some(tag => tag === area));

    for (const area of newAreas) {
      tags.push(area);
    }

    const update = await Researcher.findByIdAndUpdate(req.params.id, { researchAreas: tags });

    if (update) {
      res.json({ success: true, data: tags });
    } else {
      res.status(500).json({ success: false, message: 'Error updating researcher research areas' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching researcher tags' });
  }
});


const getDescriptionsThenSkills = asyncHandler(async (req, res) => {
  try {
    if (!validateId(req.params.id, res) || !validateParams(['id'], req, res) || rejectQueryParams(req, res) || !validateRequestBody([], req, res)) return;
    const researcher = await Researcher.findById(req.params.id)
      .populate('publications', 'description')
      .lean();

    if (!researcher) {
      return res.status(404).json({ message: "Researcher not found" });
    }

    const descriptions = await getPublicationDescriptions(researcher._id);
    if (descriptions == -1) {
      return res.status(500).json({ success: false, message: "Error fetching descriptions" });
    }
    if (descriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No publication descriptions found for this researcher' });
    }

    let updatedCount = 0;
    for (const desc of descriptions) {

      const res = await Publication.findOneAndUpdate({ title: desc.title.trim() }, { description: desc.description }, { new: true });

      if (res) {
        updatedCount++;
      }
    }
    const message = `Successfully fetched ${descriptions.length} publication descriptions, and updated ${updatedCount} descriptions`;

    const skills = await assignSkillsByDescription(researcher.publications);

    if (skills.length > 0) {
      await Researcher.findByIdAndUpdate(researcher._id, { technicalSkills: skills });
      res.status(200).json({ message: (message, `. Technical skills assigned to researcher: ${researcher.name}`) });
    } else {
      res.status(400).json({ message: "No technical skills assigned" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching publication descriptions: ' + error.message });
  }
});


const getAllResearcherPubDescriptions = asyncHandler(async (req, res) => {
  if (!validateParams(['id'], req, res) || rejectQueryParams(req, res) || !validateRequestBody([], req, res)) return;
  try {
    const researchers = await Researcher.find().select('_id').lean();
    let totalDescriptions = 0;
    let totalUpdated = 0;

    for (const researcher of researchers) {

      const descriptions = await getPublicationDescriptions(researcher._id);

      if (descriptions.length === 0 || descriptions === -1) {
        continue;
      }
      let updatedCount = 0;
      for (const desc of descriptions) {

        const res = await Publication.findOneAndUpdate({ title: desc.title.trim() }, { description: desc.description }, { new: true });
        if (res) {
          updatedCount++;
        }
      }
      totalDescriptions += descriptions.length;
      totalUpdated += updatedCount;
    }
    res.json({ success: true, message: `Successfully fetched a total of ${totalDescriptions} publication descriptions, and updated ${totalUpdated} descriptions.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching publication descriptions: ' + error.message });
  }
});

const getPublications = [
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    if (!validateParams(['limit', 'page'], req, res) || !validateRequestBody([], req, res)) return;
    const { limit = 50, page = 1 } = req.query;
    const filter = {};
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { title: 1 },
    };

    const result = await Publication.paginate(filter, options);
    return res.status(200).json({
      success: true,
      data: result.docs,
      totalCount: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage
    });
  })
];

const createBlankResearcher = [authorizeAdmin, asyncHandler(async (req, res) => {
  if (rejectQueryParams(req, res) || !validateRequestBody(['firstName', 'lastName'], req, res)) return;
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'First and last name are required' });
  }
  const institution = "QUT";
  if (!validateName(firstName)) {
    return res.status(400).json({ success: false, message: 'Invalid name format' });
  }

  if (!validateName(lastName)) {
    return res.status(400).json({ success: false, message: 'Invalid name format' });
  }
  const cleanFirstName = cleanString(firstName.trim());
  const cleanLastName = cleanString(lastName.trim());
  const cleanName = `${cleanFirstName} ${cleanLastName}`;
  try {
    const existing = await Researcher.findOne({
      name: { $regex: `^${cleanName}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Researcher already exists' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking existing researcher' });
  }

  try {
    const newResearcher = await Researcher.create({
      name: cleanName,
      institution: "QUT",
      researchAreas: [],
      technicalSkills: [],
      orcid: null,
      eprintsLink: null,
      publications: [],
      publicationsCount: 0
    });
    if (newResearcher) {
      return res.status(201).json({ success: true, message: 'Blank researcher created successfully', data: newResearcher.name });
    } else {
      return res.status(500).json({ success: false, message: 'Error creating researcher' });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating researcher' });
  }

})];

module.exports = {
  getResearchers,
  searchPublications,
  getPublicationById,
  getResearcherById,
  updateResearcher,
  deleteResearcher,
  getTags,
  researcherTechnicalSkills,
  getDescriptionsThenSkills,
  getAllResearcherPubDescriptions,
  getPublications,
  createBlankResearcher
};