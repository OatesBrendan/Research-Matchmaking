const asyncHandler = require('express-async-handler');
const { authorizeAdmin } = require('../middleware/authMiddleware');
const scraperTracker = require('../utils/scraperTracker');
const ScrapingMetadata = require("../models/scrapingMetadataModel");

// @desc    Start a scraping job
// @route   POST /api/data/start
// @access  Admin
const StartScrapingJob = [
    authorizeAdmin,
    asyncHandler(async (req, res) => {
        try {
            await scraperTracker.create(req.body);

            return res.status(201).json({ success: true, message: 'Job was successfully queued.' });
        } catch (error) {
            if (error.status === 400) {
                return res.status(error.status).json({ message: error.message || String(error) });
            }
            return res.status(500).json({ message: error });
        }
    })
];

// @desc    Get scraping jobs status
// @route   GET /api/data/jobs/:jobid
// @access  Admin
const getScrapingJobStatus = [
    authorizeAdmin,
    asyncHandler(async (req, res) => {
        const { jobId } = req.params;

        const job = await ScrapingMetadata.findById(jobId)
            .populate('researcher', 'name orcid')
            .populate('researcherBatch', 'name orcid');

        if (!job) {
            return res.status(404).json({ message: 'Scraping job not found' });
        }

        res.status(200).json({
            success: true,
            job
        });
    })
]

// @desc    Get all scraping jobs
// @route   GET /api/data/jobs
// @access  Admin
const getAllScrapingJobs = [
    authorizeAdmin,
    asyncHandler(async (req, res) => {
        const { status, limit = 50, page = 1 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: 'researcher', select: 'name orcid' },
            ]
        };

        const result = await ScrapingMetadata.paginate(filter, options);

        res.status(200).json({
            success: true,
            data: result.docs,
            totalCount: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
        });
    })
]

module.exports = {
    StartScrapingJob,
    getAllScrapingJobs,
    getScrapingJobStatus,
}