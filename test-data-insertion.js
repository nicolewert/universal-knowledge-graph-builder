// Simple test to insert demo data via Convex mutations

const fetch = require('node-fetch');
const { concepts, relationships } = require('./add-demo-data.js');

const CONVEX_URL = process.env.CONVEX_URL || 'https://hidden-dogfish-116.convex.cloud';

async function insertConcepts() {
  console.log('Inserting test concepts...');
  
  const conceptIds = {};
  
  for (const concept of concepts) {
    try {
      const response = await fetch(`${CONVEX_URL}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'concepts:createConcept',
          args: concept
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        conceptIds[concept.name] = result.value;
        console.log(`✓ Created concept: ${concept.name}`);
      } else {
        console.log(`✗ Failed to create concept: ${concept.name} (${response.status})`);
      }
    } catch (error) {
      console.log(`✗ Error creating concept ${concept.name}:`, error.message);
    }
  }
  
  return conceptIds;
}

async function insertRelationships(conceptIds) {
  console.log('\\nInserting test relationships...');
  
  for (const rel of relationships) {
    try {
      const sourceId = conceptIds[rel.source_concept_name];
      const targetId = conceptIds[rel.target_concept_name];
      
      if (!sourceId || !targetId) {
        console.log(`✗ Skipping relationship: ${rel.source_concept_name} -> ${rel.target_concept_name} (missing concept IDs)`);
        continue;
      }
      
      const response = await fetch(`${CONVEX_URL}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'concepts:createRelationship',
          args: {
            source_concept_id: sourceId,
            target_concept_id: targetId,
            relationship_type: rel.relationship_type,
            strength: rel.strength,
            context: rel.context,
            document_id: '0000000000000000' // Fake document ID for now
          }
        })
      });
      
      if (response.ok) {
        console.log(`✓ Created relationship: ${rel.source_concept_name} ${rel.relationship_type} ${rel.target_concept_name}`);
      } else {
        console.log(`✗ Failed to create relationship: ${rel.source_concept_name} -> ${rel.target_concept_name} (${response.status})`);
      }
    } catch (error) {
      console.log(`✗ Error creating relationship ${rel.source_concept_name} -> ${rel.target_concept_name}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  try {
    const conceptIds = await insertConcepts();
    await insertRelationships(conceptIds);
    console.log('\\nDemo data insertion completed!');
    console.log('You can now test the graph at http://localhost:3000/graph');
  } catch (error) {
    console.error('Error inserting demo data:', error);
  }
}

main();