const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcherController');

router.route('/')
  .get(researcherController.getResearchers)
  .post(researcherController.createBlankResearcher);

router.route('/:id')
  .get(researcherController.getResearcherById)
  .put(researcherController.updateResearcher)
  .delete(researcherController.deleteResearcher);

router.route('/:id/tags')
  .get(researcherController.getTags);

router.route('/:id/skills')
  .get(researcherController.researcherTechnicalSkills);

router.route('/:id/publications/descriptions')
  .get(researcherController.getDescriptionsThenSkills);

router.route('/publications/descriptions/all')
  .get(researcherController.getAllResearcherPubDescriptions);

module.exports = router;