const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api.js");

const client = new ConvexHttpClient("https://hidden-dogfish-116.convex.cloud");

async function testGraphQuery() {
  console.log("Testing graph data query...");
  
  try {
    const graphData = await client.query(api.concepts.getGraphData, {
      categories: [],
      relationshipTypes: [],
      searchQuery: '',
    });
    
    console.log("Graph query result:", {
      nodes: graphData?.nodes?.length || 0,
      edges: graphData?.edges?.length || 0,
      data: graphData
    });
    
  } catch (error) {
    console.error("Graph query error:", error);
  }
}

testGraphQuery();