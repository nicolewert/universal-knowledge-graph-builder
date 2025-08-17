// Quick script to add demo data for testing the graph

const concepts = [
  {
    name: "Machine Learning",
    description: "A branch of artificial intelligence focusing on algorithms that can learn from data",
    category: "Technology",
    confidence_score: 0.9,
    aliases: ["ML", "Statistical Learning"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Neural Networks",
    description: "Computing systems inspired by biological neural networks",
    category: "Technology", 
    confidence_score: 0.85,
    aliases: ["Artificial Neural Networks", "ANNs"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Deep Learning",
    description: "Machine learning using neural networks with multiple layers",
    category: "Technology",
    confidence_score: 0.88,
    aliases: ["DL"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Data Science",
    description: "Interdisciplinary field using scientific methods to extract insights from data",
    category: "Science",
    confidence_score: 0.82,
    aliases: ["DS"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Artificial Intelligence",
    description: "Intelligence demonstrated by machines, in contrast to human intelligence",
    category: "Technology",
    confidence_score: 0.95,
    aliases: ["AI"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Python",
    description: "High-level programming language widely used in data science and ML",
    category: "Technology",
    confidence_score: 0.9,
    aliases: ["Python Programming"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Statistics",
    description: "The practice of collecting, organizing, analyzing and interpreting data",
    category: "Science",
    confidence_score: 0.87,
    aliases: ["Statistical Analysis"],
    document_ids: [],
    created_timestamp: Date.now()
  },
  {
    name: "Computer Vision",
    description: "Field of AI that enables computers to interpret and understand visual information",
    category: "Technology",
    confidence_score: 0.84,
    aliases: ["CV", "Visual Recognition"],
    document_ids: [],
    created_timestamp: Date.now()
  }
];

const relationships = [
  {
    source_concept_name: "Deep Learning",
    target_concept_name: "Machine Learning", 
    relationship_type: "is_subset_of",
    strength: 0.9,
    context: "Deep learning is a subset of machine learning",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Neural Networks",
    target_concept_name: "Deep Learning",
    relationship_type: "enables",
    strength: 0.85,
    context: "Neural networks are the foundation of deep learning",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Machine Learning",
    target_concept_name: "Artificial Intelligence",
    relationship_type: "is_subset_of", 
    strength: 0.9,
    context: "Machine learning is a branch of artificial intelligence",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Data Science",
    target_concept_name: "Machine Learning",
    relationship_type: "uses",
    strength: 0.8,
    context: "Data science frequently uses machine learning techniques",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Python",
    target_concept_name: "Machine Learning",
    relationship_type: "implements",
    strength: 0.85,
    context: "Python is commonly used to implement machine learning algorithms",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Statistics",
    target_concept_name: "Data Science",
    relationship_type: "foundation_of",
    strength: 0.9,
    context: "Statistics provides the mathematical foundation for data science",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Computer Vision",
    target_concept_name: "Deep Learning",
    relationship_type: "uses",
    strength: 0.8,
    context: "Computer vision applications often use deep learning techniques",
    document_id: null,
    created_timestamp: Date.now()
  },
  {
    source_concept_name: "Computer Vision", 
    target_concept_name: "Artificial Intelligence",
    relationship_type: "is_subset_of",
    strength: 0.85,
    context: "Computer vision is a field within artificial intelligence",
    document_id: null,
    created_timestamp: Date.now()
  }
];

console.log('Demo data ready:');
console.log(`${concepts.length} concepts`);
console.log(`${relationships.length} relationships`);

// Export for use in other scripts
module.exports = { concepts, relationships };