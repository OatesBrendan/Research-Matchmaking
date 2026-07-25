const cosineSimilarity = require('cosine-similarity');
const Researcher = require('../models/researcherModel');
const {ResearchArea, TechnicalSkill} = require('../models/tagModels');
const Publication = require('../models/publicationModel');

// Dynamically import @xenova/transformers
let pipeline;
(async () => {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
})();

let model;
let areas_embeddings = [];
let research_areas = [];
let skills_embeddings = [];
let technical_skills = [];

/**
 * Gets all research area names from database, generates embeddings, and returns as a map
 * @returns ['area1' => [0.1264678691,...], 'area2' => [-0.1278648698,...],...]
 */
async function generateAreaEmbeddings() {
  const response = await ResearchArea.find().lean();

  const research_areas = response.map(area => area.name);

  if (!model) {
    model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const entries = await Promise.all(
    tags_array.map(async area => {
      const out = await model(area, { pooling: 'mean', normalize: true });
      return [area, out.data]; // tuple for Map
    })
  );

  const areasMap = new Map(entries);

  if (areasMap.size < research_areas.length) {
    console.log("Some embeddings were not generated");
  } else {
    console.log("All embeddings generated successfully");
  }

  return areasMap;
}

async function loadEmbeddings() {
 
    const areas = await ResearchArea.find().lean();
    const skills = await TechnicalSkill.find().lean();
    if (!model) {
      model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    areas_embeddings = areas.map(area => area.embedding);
    research_areas = areas.map(area => area.name);
    skills_embeddings = skills.map(skill => skill.embedding);
    technical_skills = skills.map(skill => skill.name);
  
}
/**
 * From provided title, counts top matched research areas that meet the threshold value, 
 * and returns a sorted map of those areas
 * @param {*} title Non-null string
 * @param {*} threshold float > 0 & < 1, Default: 0.1
 * @returns ['area1' => 'score', 'area2' => 'otherscore']
 */

async function assignAreas(title, threshold = 0.1) {

  const out = await model(title.toLowerCase(), { pooling: 'mean', normalize: true });
  const titleEmbedding = out.data;

  const similarities = areas_embeddings.map((areaEmbedding, i) => ({
    area: research_areas[i],
    score: cosineSimilarity(titleEmbedding, areaEmbedding),
  }));

  return similarities
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(s => s.area);
}

/**
 * From the provided description, counts skills that meet the threshold similarity, 
 * and returns a sorted mapping of those skills
 * @param {*} description Non-null string 
 * @param {*} threshold float > 0 & < 1, Default: 0.1
 * @returns ['skill1' => 'score', 'skill2' => 'otherscore']
 */
async function assignSkills(description, threshold = 0.1) {
  if(!description || description === null){
    return null;
  }
  const out = await model(description.toLowerCase(), { pooling: 'mean', normalize: true });
  const titleEmbedding = out.data;

  const similarities = skills_embeddings.map((skillEmbedding, i) => ({
    skill: technical_skills[i],
    score: cosineSimilarity(titleEmbedding, skillEmbedding),
  }));

  return similarities
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(s => s.skill);
};

/**
 * Research areas are assigned based on their respective publication titles
 * @param {*} researcherId ID of Researcher
 * @returns Array of research areas on success, null on error
 */
async function getResearcherTags(researcherId) {
  try {
  await loadEmbeddings();
  const researcher = await Researcher.findById(researcherId)
    .populate('publications', 'title')
    .lean();

  if (!researcher || !researcher.publications) return [];

  const publicationTitles = researcher.publications.map(pub => pub.title);

  const allTags = await Promise.all(
    publicationTitles.map(title => assignAreas(title))
  );
  

  const tagCounts = new Map();
  allTags.flat().forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });


  return Array.from(tagCounts.keys()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  } catch (err) {
    return null;
  }
}

/**
 * From a list of provided publications, their descriptions are matched against skills 
 * using text transformer model, and the most matched are returned as an array
 * @param {*} publicationIDs Array of publications [{'_id', 'title',...}]
 * @returns ['most matched skill 1', 'most matched skill 2',...] 
 */
async function assignSkillsByDescription(publicationIDs) {
  await loadEmbeddings();
  const publications = new Map();
  for (const pub of publicationIDs) {
    const ID = pub._id.toString().split("'")[0];
    const fullPub = await Publication.findById(ID).lean();
    if (fullPub && fullPub.description) {
      publications.set(pub._id, { description: fullPub.description });
    }
  }

  const skills = await Promise.all(
    Array.from(publications.values()).map(pub => assignSkills(pub.description))
  );

  const tagCounts = new Map();
  
  skills.flat().forEach(skill => {
    tagCounts.set(skill, (tagCounts.get(skill) || 0) + 1);
  });
  return Array.from(tagCounts.keys()).sort((a, b) => b[1] - a[1]).slice(0, 12);

}
/**
 * Given a list of publications, returns the list of the highest matched research areas
 * @param {*} publications [{'_id', 'title',...}]
 * @returns ['area1', 'area2'..., 'area5']
 */
async function assignAreasByTitle(publications) {
  await loadEmbeddings();
  if (!publications || publications.length <= 0) return [];

  const publicationTitles = publications.map(pub => pub.title);

  const allTags = await Promise.all(
    publicationTitles.map(title => assignAreas(title))
  );

  const tagCounts = new Map();
  allTags.flat().forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });


  return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
}

/**
 * Generates an embedding for a single word to be used for the text transformer, same process 
 * and use as the other batch functions
 * @param {*} text A string to generate an embedding for
 * @returns {float} 0.123456...
 */
async function generateWordEmbedding(text) {
  await loadEmbeddings();
  const out = await model(text.toLowerCase(), { pooling: 'mean', normalize: true });
  return out.data;
}

module.exports = { getResearcherTags, assignAreasByTitle, generateAreaEmbeddings, generateWordEmbedding, assignSkillsByDescription };