const express = require('express');
const router = express.Router();

const scrapingController = require('../controllers/scrapingController');

router.route('/start').post(scrapingController.StartScrapingJob);
router.route('/jobs').get(scrapingController.getAllScrapingJobs);
router.route('/jobs/:jobId').get(scrapingController.getScrapingJobStatus);

module.exports = router;