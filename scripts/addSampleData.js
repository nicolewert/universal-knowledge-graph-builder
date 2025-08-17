const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api.js");

const client = new ConvexHttpClient("https://hidden-dogfish-116.convex.cloud");

async function addSampleData() {
  console.log("Adding sample concepts and relationships...");
  
  try {
    // First create a sample document
    const document = await client.mutation(api.documents.createDocument, {
      title: "AI Technology Overview",
      content: "An overview of artificial intelligence technologies including machine learning, neural networks, and deep learning.",
      source_type: "file",
      file_size: 200
    });
    
    console.log("Created document:", document);
    
    // Add sample concepts
    const concept1 = await client.mutation(api.concepts.createConcept, {
      name: "Artificial Intelligence",
      description: "The simulation of human intelligence processes by machines",
      document_ids: [document],
      confidence_score: 0.9,
      category: "technology",
      aliases: ["AI", "Machine Intelligence"]
    });
    
    const concept2 = await client.mutation(api.concepts.createConcept, {
      name: "Machine Learning",
      description: "A subset of AI that enables computers to learn without explicit programming",
      document_ids: [document],
      confidence_score: 0.85,
      category: "technology",
      aliases: ["ML"]
    });
    
    const concept3 = await client.mutation(api.concepts.createConcept, {
      name: "Neural Networks",
      description: "Computing systems inspired by biological neural networks",
      document_ids: [document],
      confidence_score: 0.8,
      category: "technology",
      aliases: ["NN", "Artificial Neural Networks"]
    });
    
    const concept4 = await client.mutation(api.concepts.createConcept, {
      name: "Deep Learning",
      description: "Machine learning using neural networks with multiple layers",
      document_ids: [document],
      confidence_score: 0.88,
      category: "technology", 
      aliases: ["DL"]
    });
    
    console.log("Created concepts:", { concept1, concept2, concept3, concept4 });
    
    // Add relationships
    await client.mutation(api.concepts.createRelationship, {
      source_concept_id: concept2,
      target_concept_id: concept1,
      relationship_type: "subset_of",
      strength: 0.9,
      context: "Machine Learning is a subset of Artificial Intelligence",
      document_id: document
    });
    
    await client.mutation(api.concepts.createRelationship, {
      source_concept_id: concept4,
      target_concept_id: concept2,
      relationship_type: "subset_of", 
      strength: 0.85,
      context: "Deep Learning is a subset of Machine Learning",
      document_id: document
    });
    
    await client.mutation(api.concepts.createRelationship, {
      source_concept_id: concept4,
      target_concept_id: concept3,
      relationship_type: "uses",
      strength: 0.9,
      context: "Deep Learning uses Neural Networks",
      document_id: document
    });
    
    console.log("Sample data added successfully!");
    
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

addSampleData();