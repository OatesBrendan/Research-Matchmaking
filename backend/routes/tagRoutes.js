const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/research-areas', tagController.getResearchAreas);
router.get('/technical-skills', tagController.getTechnicalSkills);
router.get('/admin/research-areas', tagController.adminGetAreas);
router.get('/admin/technical-skills', tagController.adminGetSkills);

router.post('/create', tagController.createAreaOrSkill);
router.get('/area-embeddings', tagController.areaEmbeddings);
router.get('/skill-embeddings', tagController.skillEmbeddings);
router.post('/reset-embeddings', tagController.resetEmbeddings);
router.delete('/delete', tagController.deleteTags);

router.get('/all-description-embeddings', tagController.allDescriptionEmbeddings);
router.get('/all-research-areas', tagController.allResearchAreas);

module.exports = router;