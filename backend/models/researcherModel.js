const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/* Individual Researchers that holds all their information to do with their publications and skils/areas of specialty */
const researcherSchema = new mongoose.Schema({
    name: { type: String, required: true, maxLength: 255 },
    institution: { type: String, required: true, maxLength: 255 },
    technicalSkills: [{ type: String, required: false }],
    researchAreas: [{ type: String, required: false }],
    orcid: { type: String, unique: true, sparse: true }, // unique index for ORCID
    eprintsLink: {type: String, unique: true, sparse: true},
    publications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Publication' }],
    publicationsCount: {type: Number, default: 0},
}, {timestamps: true});

// Add compound index for efficient duplicate checking
researcherSchema.index({ name: 1, institution: 1, orcid: 1 }, { unique: true });

// Add text index for search functionality
researcherSchema.index({
    name: 'text',
    institution: 'text',
    researchAreas: 'text'
});

researcherSchema.post('findOneAndUpdate', async function(doc) {
    if(doc){
        const updatedDoc = await this.model.findById(doc._id);
        if(updatedDoc && updatedDoc.isModified('publications')){
            updatedDoc.publicationsCount = updatedDoc.publications.length;
            await updatedDoc.save();
        }
    }
});

researcherSchema.pre('save', async function (next) {
    this.publicationsCount = this.publications.length;
    next();
});

researcherSchema.pre('remove', async function (next) {
    try {
        const Publication = mongoose.model('Publication');

        // Get all publications referenced by this researcher
        const publications = await Publication.find({
            _id: { $in: this.publications }
        });

        for (const pub of publications) {
            // If this is the only researcher associated with the publication
            // (check both arrays to be thorough)
            if (pub.associated_researchers.length === 1 ||
                pub.associated_researchers.some(id => id.equals(this._id))) {
                await pub.remove();
            } else {
                // Just remove this researcher from the publication
                pub.associated_researchers = pub.associated_researchers.filter(
                    id => !id.equals(this._id)
                );
                await pub.save();
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

researcherSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Researcher', researcherSchema);