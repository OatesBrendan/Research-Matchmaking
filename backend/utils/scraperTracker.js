const ScrapingMetadata = require("../models/scrapingMetadataModel");
const mongoose = require('mongoose');

/* get a job from mongodb */
const getJob = async (jobId) => {
    if (!mongoose.isValidObjectId(jobId))
        throw new Error('JobId cannot be cast into a valid object id.');
    const job = await ScrapingMetadata.findById(jobId);

    if (!job)
        throw new Error('Job not found.')

    return job;
}

/* Util functions to help with interacting with the scraper metadata. */
module.exports = {
    create: async (options = {}) => {
        const {
            researcherId,
            orcid = null,
            orcidBatch = [],
            scope = 'single',
            researcherBatch = [],
            scheduled = false,
            scheduleFrequency = null,
            initiatedBy = null,
            source = 'orcid'
        } = options;

        if (scope === 'single' && !researcherId && !orcid)
            throw Object.assign(new Error('Scope "single" requires a researcherId.'), { status: 400 });
        else if (scope === 'batch' && (!researcherBatch || researcherBatch.length <= 0) && (!orcidBatch || orcidBatch.length <= 0))
            throw Object.assign(new Error('Scope "batch" requires at least one or more researcher ids in researcherBatch[].'), { status: 400 });

        return await ScrapingMetadata.create({
            researcher: researcherId,
            orcid,
            orcidBatch,
            scope,
            researcherBatch,
            scheduled,
            scheduleFrequency,
            initiatedBy,
            source,
            'progress.total': researcherBatch ? researcherBatch.length + orcidBatch.length : scope === 'single' ? 1 : 0,
            status: 'pending',
            startTime: Date.now()
        });
    },

    updateProgress: async (jobId, current) => {
        const job = await getJob(jobId);

        job.progress.current = current;

        return await job.save();
    },

    markComplete: async (jobId, options = {}) => {
        const {
            researchersUpdated = 0,
            researchersCreated = 0,
            publicationsFound = 0,
            publicationsAdded = 0
        } = options;

        const job = await getJob(jobId);

        job.status = 'completed';
        job.publicationsFound = publicationsFound;
        job.newPublicationsAdded = publicationsAdded;
        job.researchersUpdated = researchersUpdated;
        job.newResearchersAdded = researchersCreated;
        job.progress.current = job.progress.total;
        job.endTime = Date.now();

        return await job.save();
    },

    markFailed: async (jobId, error) => {
        const job = await getJob(jobId);

        job.status = 'failed';
        job.endTime = Date.now();
        job.error = {
            message: error.message || String(error),
            stack: error.stack,
            code: error.code,
            causes: error.cause ? error.cause.length > 1 ? error.cause : null : null
        };

        return await job.save();
    },

    getQueuedJob: async () => {
        return await ScrapingMetadata.findOneAndUpdate(
            { status: { $in: ['pending'] } },
            { $set: { status: 'in_progress', startTime: Date.now() } },
            { sort: { createdAt: 1 }, returnDocument: 'after' }
        );
    }
}