import { NETWORK_CONFIG } from './networkConfig';

const calculateJaccardSimilarity = (set1, set2) => {
  if (set1.size === 0 && set2.size === 0) return 0;
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
};

export const buildNetworkGraph = (researchers) => {
  const groups = {};
  researchers.forEach(r => {
    const area = r.researchAreas?.[0] || 'Other';
    if (!groups[area]) groups[area] = [];
    groups[area].push(r);
  });

  return {
    name: "Research Network",
    children: Object.entries(groups).map(([area, rs]) => ({
      name: area,
      children: rs.map(r => ({ name: r.name, data: { ...r } }))
    }))
  };
};

const checkSharedTechnicalSkills = (skillsA, skillsB, filterSkills) => {
  const setA = new Set(skillsA.map(s => s.toLowerCase()));
  const setB = new Set(skillsB.map(s => s.toLowerCase()));

  return filterSkills.every(filterSkill => {
    const lower = filterSkill.toLowerCase();
    return [...setA].some(s => s.includes(lower)) &&
           [...setB].some(s => s.includes(lower));
  });
};

const calculateResearchSimilarity = (areasA, areasB) => {
  const setA = new Set(areasA.map(a => a.toLowerCase()));
  const setB = new Set(areasB.map(a => a.toLowerCase()));
  return calculateJaccardSimilarity(setA, setB);
};

export const buildNetworkLinks = (nodes, technicalSkillsFilter) => {
  const links = [];
  const stats = { coauthor: 0, research: 0, technical: 0 };

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];

      // Co-authorship
      const sharedPapers = [...nodeA.publicationTitles]
        .filter(t => nodeB.publicationTitles.has(t)).length;
      
      if (sharedPapers >= NETWORK_CONFIG.COAUTHOR_MIN_PAPERS) {
        links.push({
          source: nodeA.id,
          target: nodeB.id,
          type: 'coauthor',
          strength: 1.5 + sharedPapers * 0.5,
          distance: NETWORK_CONFIG.DISTANCES.COAUTHOR / (1 + sharedPapers * 0.1)
        });
        stats.coauthor++;
        if (!technicalSkillsFilter?.length) continue;
      }

      // Technical skills
      if (technicalSkillsFilter?.length > 0) {
        const hasSharedSkills = checkSharedTechnicalSkills(
          nodeA.technicalSkills,
          nodeB.technicalSkills,
          technicalSkillsFilter
        );

        if (hasSharedSkills) {
          links.push({
            source: nodeA.id,
            target: nodeB.id,
            type: 'technical',
            strength: 2,
            distance: NETWORK_CONFIG.DISTANCES.TECHNICAL
          });
          stats.technical++;
        }
      }

      // Research similarity
      const similarity = calculateResearchSimilarity(
        nodeA.researchAreas,
        nodeB.researchAreas
      );

      if (similarity > NETWORK_CONFIG.RESEARCH_SIMILARITY_THRESHOLD) {
        links.push({
          source: nodeA.id,
          target: nodeB.id,
          type: 'research',
          strength: Math.max(0.8, similarity * 2.5),
          distance: NETWORK_CONFIG.DISTANCES.RESEARCH_BASE - 
                   (similarity * NETWORK_CONFIG.DISTANCES.RESEARCH_MODIFIER)
        });
        stats.research++;
      }
    }
  }

  return { links, stats };
};

export const hasMatchingTechnicalSkills = (researcher, filterSkills) => {
  if (!filterSkills?.length) return true;
  if (!researcher.technicalSkills?.length) return false;

  const researcherSkills = researcher.technicalSkills.map(s => s.toLowerCase().trim());
  return filterSkills.some(filterSkill =>
    researcherSkills.some(skill => skill.includes(filterSkill.toLowerCase().trim()))
  );
};