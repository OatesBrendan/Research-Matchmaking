const { ProcessSingleJob, ProcessBatchJob } = require('./scraperProcess');
const scraperTracker = require('./scraperTracker');
const Researcher = require('../models/researcherModel');

/* process queued jobs by retrieving from mongodb jobs that are pending. */
async function processScrapingJobs() {
    for(;;) {
        const job = await scraperTracker.getQueuedJob();

        if (!job) {
            await new Promise(res => setTimeout(res, 1000));
            continue;
        }

        try {
            let result = {};
            if (job.scope === 'single' && (job.researcher || job.orcid)) {
                // process single researcher
                console.log("processing single job.");
                result = await ProcessSingleJob(job);
                console.log(result);
            }
            else if (job.scope === 'batch' && (job.researcherBatch.length > 0 || job.orcidBatch.length > 0)) {
                // process the batch
                console.log("processing batch job.");
                result = await ProcessBatchJob(job);
                console.log(result);
            }
            else if (job.scope === 'all') {
                // process all (same as batch but with all researchers)
                job.researcherBatch = (await Researcher.find().select('_id')).map(r => r._id);
                job.progress.total = job.researcherBatch.length;
                await job.save();
                console.log(job);
                console.log("processing all job.");
                result = await ProcessBatchJob(job);
                console.log(result);
            }
            await scraperTracker.markComplete(job._id, result);
        } catch (error) {
            await scraperTracker.markFailed(job._id, error);
        }
    }
}

module.exports = processScrapingJobs;