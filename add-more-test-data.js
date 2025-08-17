const { ConvexHttpClient } = require('convex/browser');

require('dotenv').config({ path: '.env.local' });
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function addMoreTestData() {
  console.log('🚀 Adding additional test data for real-time testing...');
  
  try {
    // Create another test document
    console.log('📄 Creating second document...');
    const documentId = await client.mutation('documents:createDocument', {
      title: 'Test Document - Data Science',
      content: 'This document covers data science, statistics, data visualization, big data, and analytics. It includes topics like data mining, predictive modeling, business intelligence, and data warehousing.',
      source_type: 'url',
      source_url: 'https://example.com/data-science-doc',
      file_size: 2048
    });
    
    console.log('📄 Second document created:', documentId);
    
    // Create additional concepts
    console.log('🧠 Creating additional concepts...');
    const newConcepts = [
      {
        name: 'Data Science',
        description: 'Interdisciplinary field that uses statistics and algorithms to extract insights from data',
        document_ids: [documentId],
        confidence_score: 0.93,
        category: 'Technology',
        aliases: ['Data Analytics']
      },
      {
        name: 'Statistics',
        description: 'Branch of mathematics dealing with data collection, analysis, and interpretation',
        document_ids: [documentId],
        confidence_score: 0.91,
        category: 'Mathematics',
        aliases: ['Statistical Analysis']
      },
      {
        name: 'Data Visualization',
        description: 'Graphical representation of information and data',
        document_ids: [documentId],
        confidence_score: 0.87,
        category: 'Technology',
        aliases: ['Data Viz', 'Information Visualization']
      },
      {
        name: 'Big Data',
        description: 'Large and complex data sets that require specialized tools',
        document_ids: [documentId],
        confidence_score: 0.84,
        category: 'Technology',
        aliases: ['Large Scale Data']
      }
    ];
    
    const newConceptIds = [];
    for (const concept of newConcepts) {
      const conceptId = await client.mutation('concepts:createConcept', concept);
      newConceptIds.push(conceptId);
      console.log('✅ Created concept:', concept.name);
      
      // Add a small delay to see real-time updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Create relationships between new and existing concepts
    console.log('🔗 Creating cross-domain relationships...');
    
    // Get existing ML concept ID (we'll need to query for it)
    const existingConcepts = await client.query('concepts:getConcepts');
    const mlConcept = existingConcepts.find(c => c.name === 'Machine Learning');
    const aiConcept = existingConcepts.find(c => c.name === 'Artificial Intelligence');
    
    if (mlConcept && newConceptIds.length > 0) {
      const crossRelationships = [
        {
          source_concept_id: newConceptIds[0], // Data Science
          target_concept_id: mlConcept._id, // Machine Learning
          relationship_type: 'related_to',
          strength: 0.85,
          context: 'Data Science and Machine Learning are closely related fields',
          document_id: documentId
        },
        {
          source_concept_id: newConceptIds[1], // Statistics
          target_concept_id: mlConcept._id, // Machine Learning
          relationship_type: 'foundation_of',
          strength: 0.92,
          context: 'Statistics provides the mathematical foundation for Machine Learning',
          document_id: documentId
        }
      ];
      
      for (const relationship of crossRelationships) {
        await client.mutation('concepts:createRelationship', relationship);
        console.log('✅ Created cross-domain relationship');
        
        // Add delay for real-time visualization
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    console.log('🎉 Additional test data added successfully!');
    console.log('📊 Created:', newConcepts.length, 'new concepts');
    
  } catch (error) {
    console.error('❌ Error adding additional test data:', error);
  }
}

addMoreTestData();