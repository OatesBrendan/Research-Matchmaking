const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/* publication schema that holds the information for each publication and the associated researchers (_ids) */
const publicationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authors: [String],
    tags: [String],
    description: { type: String, default: null },
    url: { type: String, default: null }, 
    year: String,
    source_url: String,
    scraped_at: { type: Date, default: Date.now() },
    associated_researchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Researcher' }]
});

publicationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Publication', publicationSchema);
