// Quick script to add a few concepts directly via Node.js
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://hidden-dogfish-116.convex.cloud");

async function seedData() {
  try {
    console.log("Creating test concepts...");
    
    // Create a few test concepts
    const concept1 = await client.mutation("concepts:createConcept", {
      name: "Machine Learning",
      description: "A branch of artificial intelligence focusing on algorithms that can learn from data",
      category: "Technology",
      confidence_score: 0.9,
      aliases: ["ML", "Statistical Learning"],
      document_ids: [],
    });
    
    const concept2 = await client.mutation("concepts:createConcept", {
      name: "Neural Networks",
      description: "Computing systems inspired by biological neural networks",
      category: "Technology", 
      confidence_score: 0.85,
      aliases: ["Artificial Neural Networks", "ANNs"],
      document_ids: [],
    });
    
    const concept3 = await client.mutation("concepts:createConcept", {
      name: "Data Science",
      description: "Interdisciplinary field using scientific methods to extract insights from data",
      category: "Science",
      confidence_score: 0.82,
      aliases: ["DS"],
      document_ids: [],
    });
    
    console.log("✓ Created 3 test concepts successfully!");
    console.log("Visit http://localhost:3000/graph to see the knowledge graph.");
    
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seedData();