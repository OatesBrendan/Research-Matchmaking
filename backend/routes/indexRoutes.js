const express = require('express');
const router = express.Router();

const researcherRoutes = require('./researcherRoutes');
const publicationRoutes = require('./publicationRoutes');
const userRoutes = require('./userRoutes');
const emailRoutes = require('./emailRoutes');
const scrapingRoutes = require('./scrapingMetadataRoutes');
const tagRoutes = require('./tagRoutes');

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to Researchers API' });
});

router.use('/api/researchers', researcherRoutes);
router.use('/api/publications', publicationRoutes);
router.use('/api/users', userRoutes);
router.use('/api/email', emailRoutes);
router.use('/api/data', scrapingRoutes);
router.use('/api/tags', tagRoutes);

module.exports = router;