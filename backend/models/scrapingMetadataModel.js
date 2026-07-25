const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/* Metadata to hold all the information required for queuing a job to be completed by the scraperQueue.js */
const scrapingMetadataSchema = new mongoose.Schema({
    researcher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Researcher'
    },
    orcid: { type: String },
    orcidBatch: [{ type: String }],
    scope: {
        type: String,
        enum: ['single', 'batch', 'all'],
        required: true
    },
    researcherBatch: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Researcher'
    }],
    scheduled: {
        type: Boolean,
        default: false
    },
    scheduleFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom', null],
        default: null
    },
    nextScheduledRun: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    progress: {
        current: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    },
    startTime: { type: Date },
    endTime: { type: Date },

    publicationsFound: { type: Number, default: 0 },
    researchersUpdated: { type: Number, default: 0 },
    newPublicationsAdded: { type: Number, default: 0 },
    newResearchersAdded: { type: Number, default: 0 },

    error: {
        message: { type: String },
        stack: { type: String },
        code: { type: String },
        causes: [{ type: String }]
    },
    source: {
        type: String,
        enum: ['orcid', 'eprints'],
        default: 'orcid'
    },

    autoScraped: { type: Boolean, default: false },
}, { timestamps: true });

scrapingMetadataSchema.pre('save', function (next) {
    if (this.progress.total > 0) {
        this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100);
    }
    next();
});

scrapingMetadataSchema.index({ researcher: 1, createdAt: -1 });
scrapingMetadataSchema.index({ status: 1, createdAt: -1 });
scrapingMetadataSchema.index({ scheduled: 1, nextScheduledRun: 1 });

scrapingMetadataSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ScrapingMetadata', scrapingMetadataSchema);