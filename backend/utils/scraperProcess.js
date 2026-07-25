const Publication = require('../models/publicationModel');
const Researcher = require('../models/researcherModel');
const { getResearcherDetails, getResearcherPubs } = require('../utils/orcidAPI');
const { assignAreasByTitle, assignSkillsByDescription } = require('../utils/tags');
const scraperTracker = require("./scraperTracker");

/* create a researcher based on orcid */
const createResearcher = async (orcid) => {
    const researcher = await Researcher.findOne({ orcid: orcid });

    if (researcher) {
        throw new Error(`Researcher with orcid ${orcid} already exists.`);
    }

    // get researcher and publications from ocidAPI
    const researcherResponse = await getResearcherDetails(orcid);
    const publicationResponse = await getResearcherPubs(orcid);

    // if this failed return error.
    if (!researcherResponse.success || !publicationResponse.success) {
        throw new Error(!researcherResponse.success ? researcherResponse.error : publicationResponse.error);
    }

    const details = researcherResponse.researcher;
    const pubs = publicationResponse.publications;

    // use the url then title to find duplicate publications
    const existingPublications = await Publication.find({
        $or: [
            { url: { $in: pubs.map(p => p.url).filter(Boolean) } },
            { title: { $in: pubs.map(p => p.title).filter(Boolean) } }
        ]
    });

    const existingUrls = new Set(existingPublications.map(pub => pub.url).filter(Boolean));
    const existingTitles = new Set(
        existingPublications.map(pub => pub.title?.trim().toLowerCase()).filter(Boolean)
    );

    // filter to get the new publications
    const newPubs = pubs.filter(pub => {
        const normalizedTitle = pub.title?.trim().toLowerCase();

        if (pub.url) {
            return !existingUrls.has(pub.url);
        }
        if (normalizedTitle) {
            return !existingTitles.has(normalizedTitle);
        }
        return false;
    });

    // add these new publications to db
    const newPublications = await Publication.insertMany(newPubs, { ordered: false });

    // create the researchers list of publication ids
    details.publications = [
        ...existingPublications.map(p => p._id),
        ...newPublications.map(p => p._id),
    ];

    details.publicationsCount = details.publications.length;

    console.log(details); //important

    // generate the researchers tags with existing + newly found
    try {
        const generatedTags = await assignAreasByTitle([...existingPublications, ...newPubs]);
        details.researchAreas = generatedTags;
        const generatedSkills = await assignSkillsByDescription([...existingPublications, ...newPubs]);
        details.technicalSkills = generatedSkills;
    }catch(error){
        console.error("Failed to assign skills or tags");
    }

    console.log(details);

    // finally insert reseacher to db
    await Researcher.create(details);

    return { researchersCreated: 1, publicationsFound: existingPublications.length, publicationsAdded: newPubs.length };
}

/* Update a researcher based on id. Retrieves updated data from orcid and adds new tags if many new publications were added. */
const updateResearcher = async (researcherId) => {
    const researcher = await Researcher.findById(researcherId);

    if (!researcher) {
        throw new Error('Couldnt find researcher of _id: ' + researcherId);
    }

    if (!researcher.orcid) {
        throw new Error('Researcher must have an orcid to continue the scrape.');
    }

    const orcid = researcher.orcid;

    // get researcher and publications from ocidAPI
    const researcherResponse = await getResearcherDetails(orcid);
    const publicationResponse = await getResearcherPubs(orcid);

    // if either orcid api calls fail return the error.
    if (!researcherResponse.success || !publicationResponse.success) {
        throw new Error(!researcherResponse.success ? researcherResponse.error : publicationResponse.error);
    }

    // get the data that orcid returned
    const details = researcherResponse.researcher;
    const pubs = publicationResponse.publications;

    // initialise the updated details object
    let updatedDetails = {};

    updatedDetails = {
        name: details.name, // name change?
        institution: details.institution, // employement change?
        updatedAt: details.updatedAt, // new updated time
    };

    // use the url then title to find duplicate publications
    const existingPublications = await Publication.find({
        $or: [
            { url: { $in: pubs.map(p => p.url).filter(Boolean) } },
            { title: { $in: pubs.map(p => p.title).filter(Boolean) } }
        ]
    });

    // set of existing urls and titles
    const existingUrls = new Set(existingPublications.map(pub => pub.url).filter(Boolean));
    const existingTitles = new Set(
        existingPublications.map(pub => pub.title?.trim().toLowerCase()).filter(Boolean)
    );

    // filter to get the new publications
    const newPubs = pubs.filter(pub => {
        const normalizedTitle = pub.title?.trim().toLowerCase();

        if (pub.url) {
            return !existingUrls.has(pub.url);
        }
        if (normalizedTitle) {
            return !existingTitles.has(normalizedTitle);
        }
        return false;
    });

    // if there are new publications then add them to the db and add to updated details publications
    if (newPubs.length > 0) {
        const newPublications = await Publication.insertMany(newPubs, { ordered: false });

        // add those publication ids to the array of researchers publications
        updatedDetails.publications = [
            ...researcher.publications,
            ...newPublications.map(p => p._id)
        ];

        // if theres a new publication check to see if we should add new tags
        const generatedTags = await assignAreasByTitle([...existingPublications, ...newPubs]);
        console.log(generatedTags);
        const generatedSkills = await assignSkillsByDescription([...existingPublications, ...newPubs]);
        // keep old tags (in case user has personally added some) but still keep it distinct.
        updatedDetails.researchAreas = [...new Set([...researcher.researchAreas, ...generatedTags])];
        updatedDetails.technicalSkills = [...new Set([...researcher.technicalSkills, ...generatedSkills])];
    }

    // if no new publications and no new details then return that noting needed to be updated.
    if (newPubs.length <= 0 && updatedDetails.name === undefined && updatedDetails.researchAreas === undefined) {
        return { publicationsFound: existingPublications.length, publicationsAdded: newPubs.length };
    }

    await Researcher.findByIdAndUpdate(
        researcher._id,
        { $set: updatedDetails },
        { new: true, runValidators: true }
    );

    return { researchersUpdated: 1, publicationsFound: existingPublications.length, publicationsAdded: newPubs.length };
}

/* Process a single job (one id or orcid) */
const ProcessSingleJob = async (job) => {
    // if orcid is included in job, then its a request for a new researcher
    if (job.orcid) {
        return await createResearcher(job.orcid);
    }
    // else we update using the id
    console.log(job);
    if (!job.researcher)
        throw new Error('To process a single job, it requires researcher id');
    return await updateResearcher(job.researcher);
}

/* Process mutliple orcids and/or researcher ids */
const ProcessBatchJob = async (job) => {
    if ((!job.researcherBatch || job.researcherBatch.length <= 0) && (!job.orcidBatch || job.orcidBatch.length <= 0))
        throw new Error('You need to specify at least one researcher id or orcid when making a batch request.');

    let current = 0;
    // percent of failures before we cancel the whole batch request
    const lenience = 0.3;

    let researchersUpdated = 0;
    let researchersCreated = 0;
    let publicationsFound = 0;
    let publicationsAdded = 0;

    let errors = []

    if (job.orcidBatch) {
        for (let i = 0; i < job.orcidBatch.length; i++) {
            try {
                const result = await createResearcher(job.orcidBatch[i]);
                console.log(result);
                scraperTracker.updateProgress(job._id, current++);
                researchersCreated++;
                publicationsFound += result.publicationsFound;
                publicationsAdded += result.publicationsAdded;
            } catch (error) {
                errors.push(error);
                if (errors.length >= job.progress.total * lenience)
                    throw new Error(`Failed to process batch job, encountered ${errors.length} error/s.`, { cause: errors });
            }
        }
    }

    if (job.researcherBatch) {
        for (let i = 0; i < job.researcherBatch.length; i++) {
            try {
                const result = await updateResearcher(job.researcherBatch[i]._id);
                scraperTracker.updateProgress(job._id, current++);
                researchersUpdated++;
                publicationsFound += result.publicationsFound;
                publicationsAdded += result.publicationsAdded;
            } catch (error) {
                errors.push(error);
                if (errors.length >= job.progress.total * lenience)
                    throw new Error(`Failed to process batch job, encountered ${errors.length} error/s.`, { cause: errors });
            }
        }
    }

    return { researchersUpdated, publicationsFound, publicationsAdded, researchersCreated };
}

module.exports = {
    ProcessSingleJob,
    ProcessBatchJob,
}