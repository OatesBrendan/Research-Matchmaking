export const NETWORK_CONFIG = {
  RESEARCH_SIMILARITY_THRESHOLD: 0.6,
  MIN_NODE_SIZE: 6,
  MAX_NODES: 2000,
  COAUTHOR_MIN_PAPERS: 4,
  ZOOM_EXTENT: [0.2, 3],
  FORCES: {
    CHARGE_STRENGTH: -800,
    COLLISION_RADIUS: 4,
    CENTER_STRENGTH: 0.03,
    LINK_STRENGTH_DIVISOR: 12
  },
  DISTANCES: {
    COAUTHOR: 300,
    TECHNICAL: 80,
    RESEARCH_BASE: 120,
    RESEARCH_MODIFIER: 40
  }
};

export const RESEARCH_AREAS = [
  "Health", "Business", "Finance", "Marketing", 
  "Social Sciences and Humanities", "Biology", "Chemistry", 
  "Engineering", "Environment", "Energy", "Urban and Transport", 
  "Education", "Sports", "Computer Science", "Physics", "Mathematics"
];