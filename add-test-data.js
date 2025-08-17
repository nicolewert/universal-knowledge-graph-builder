const { ConvexHttpClient } = require('convex/browser');

// Read the Convex URL from environment
require('dotenv').config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function addTestData() {
  console.log('🚀 Adding test data to Convex...');
  
  try {
    // First, create a test document
    console.log('📄 Creating test document...');
    const documentId = await client.mutation('documents:createDocument', {
      title: 'Test Document - AI and Machine Learning',
      content: 'This document discusses artificial intelligence, machine learning algorithms, neural networks, and deep learning. It covers supervised learning, unsupervised learning, and reinforcement learning. Topics include linear regression, decision trees, support vector machines, and convolutional neural networks.',
      source_type: 'url',
      source_url: 'https://example.com/ai-ml-doc',
      file_size: 1024
    });
    
    console.log('📄 Document created:', documentId);
    
    // Create test concepts
    console.log('🧠 Creating test concepts...');
    const concepts = [
      {
        name: 'Artificial Intelligence',
        description: 'The simulation of human intelligence in machines',
        document_ids: [documentId],
        confidence_score: 0.95,
        category: 'Technology',
        aliases: ['AI', 'Machine Intelligence']
      },
      {
        name: 'Machine Learning',
        description: 'A subset of AI that enables computers to learn without explicit programming',
        document_ids: [documentId],
        confidence_score: 0.92,
        category: 'Technology',
        aliases: ['ML', 'Statistical Learning']
      },
      {
        name: 'Neural Networks',
        description: 'Computing systems inspired by biological neural networks',
        document_ids: [documentId],
        confidence_score: 0.88,
        category: 'Technology',
        aliases: ['NN', 'Artificial Neural Networks']
      },
      {
        name: 'Deep Learning',
        description: 'Machine learning using artificial neural networks with multiple layers',
        document_ids: [documentId],
        confidence_score: 0.85,
        category: 'Technology',
        aliases: ['DL']
      },
      {
        name: 'Supervised Learning',
        description: 'Learning with labeled training data',
        document_ids: [documentId],
        confidence_score: 0.82,
        category: 'Concept',
        aliases: []
      },
      {
        name: 'Unsupervised Learning',
        description: 'Learning patterns from unlabeled data',
        document_ids: [documentId],
        confidence_score: 0.80,
        category: 'Concept',
        aliases: []
      }
    ];
    
    const conceptIds = [];
    for (const concept of concepts) {
      const conceptId = await client.mutation('concepts:createConcept', concept);
      conceptIds.push(conceptId);
      console.log('✅ Created concept:', concept.name);
    }
    
    // Create test relationships
    console.log('🔗 Creating test relationships...');
    const relationships = [
      {
        source_concept_id: conceptIds[1], // Machine Learning
        target_concept_id: conceptIds[0], // Artificial Intelligence
        relationship_type: 'is_subset_of',
        strength: 0.9,
        context: 'ML is a subset of AI',
        document_id: documentId
      },
      {
        source_concept_id: conceptIds[3], // Deep Learning
        target_concept_id: conceptIds[1], // Machine Learning
        relationship_type: 'is_subset_of',
        strength: 0.85,
        context: 'Deep Learning is a subset of Machine Learning',
        document_id: documentId
      },
      {
        source_concept_id: conceptIds[3], // Deep Learning
        target_concept_id: conceptIds[2], // Neural Networks
        relationship_type: 'uses',
        strength: 0.92,
        context: 'Deep Learning uses Neural Networks',
        document_id: documentId
      },
      {
        source_concept_id: conceptIds[4], // Supervised Learning
        target_concept_id: conceptIds[1], // Machine Learning
        relationship_type: 'is_type_of',
        strength: 0.88,
        context: 'Supervised Learning is a type of Machine Learning',
        document_id: documentId
      },
      {
        source_concept_id: conceptIds[5], // Unsupervised Learning
        target_concept_id: conceptIds[1], // Machine Learning
        relationship_type: 'is_type_of',
        strength: 0.88,
        context: 'Unsupervised Learning is a type of Machine Learning',
        document_id: documentId
      }
    ];
    
    for (const relationship of relationships) {
      await client.mutation('concepts:createRelationship', relationship);
      console.log('✅ Created relationship');
    }
    
    console.log('🎉 Test data added successfully!');
    console.log('📊 Created:', concepts.length, 'concepts and', relationships.length, 'relationships');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

addTestData();