// Debug script to check graph data query
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://hidden-dogfish-116.convex.cloud");

async function debugGraphData() {
  try {
    console.log("Testing graph data query...");
    
    // Test basic concepts query
    const concepts = await client.query("concepts:getConcepts");
    console.log(`✓ Found ${concepts.length} concepts in database`);
    concepts.forEach((concept, i) => {
      console.log(`  ${i+1}. "${concept.name}" (${concept.category})`);
    });
    
    // Test graph data query
    const graphData = await client.query("concepts:getGraphData", {});
    console.log(`\\n✓ Graph query returned:`);
    console.log(`  - ${graphData.nodes.length} nodes`);
    console.log(`  - ${graphData.edges.length} edges`);
    
    if (graphData.nodes.length === 0) {
      console.log("\\n❌ ISSUE FOUND: Graph data query returns 0 nodes despite concepts existing");
      console.log("   This explains why the graph shows 'Loading...' indefinitely");
    } else {
      console.log("\\n✓ Graph data is loading correctly");
    }
    
    // Test with empty filters
    const graphDataFiltered = await client.query("concepts:getGraphData", {
      categories: [],
      relationshipTypes: [],
      searchQuery: ""
    });
    console.log(`\\n✓ Graph query with empty filters:`);
    console.log(`  - ${graphDataFiltered.nodes.length} nodes`);
    console.log(`  - ${graphDataFiltered.edges.length} edges`);
    
  } catch (error) {
    console.error("❌ Error debugging graph data:", error);
    console.log("\\nThis confirms there's an issue with the getGraphData query");
  }
}

debugGraphData();