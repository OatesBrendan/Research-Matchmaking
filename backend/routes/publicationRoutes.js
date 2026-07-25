const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcherController');

// Search publications with filters and pagination
router.route('/search')
  .get(researcherController.searchPublications);

// Get publication details by ID
router.route('/data/:id')
  .get(researcherController.getPublicationById);

router.route('/all')
  .get(researcherController.getPublications);

module.exports = router;