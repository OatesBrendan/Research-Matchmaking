const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Schemas for both research areas, and technical skills

const researchAreaSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    embedding: { type: [Number], required: false }
})

const technicalSkillSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    embedding: { type: [Number], required: false }
})

researchAreaSchema.plugin(mongoosePaginate);
technicalSkillSchema.plugin(mongoosePaginate);

const ResearchArea = mongoose.model('ResearchArea', researchAreaSchema);
const TechnicalSkill = mongoose.model('TechnicalSkill', technicalSkillSchema);

module.exports = { ResearchArea, TechnicalSkill };