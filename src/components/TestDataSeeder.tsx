'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const testConcepts = [
  {
    name: "Machine Learning",
    description: "A branch of artificial intelligence focusing on algorithms that can learn from data",
    category: "Technology",
    confidence_score: 0.9,
    aliases: ["ML", "Statistical Learning"],
    document_ids: [],
  },
  {
    name: "Neural Networks",
    description: "Computing systems inspired by biological neural networks",
    category: "Technology", 
    confidence_score: 0.85,
    aliases: ["Artificial Neural Networks", "ANNs"],
    document_ids: [],
  },
  {
    name: "Deep Learning",
    description: "Machine learning using neural networks with multiple layers",
    category: "Technology",
    confidence_score: 0.88,
    aliases: ["DL"],
    document_ids: [],
  },
  {
    name: "Data Science",
    description: "Interdisciplinary field using scientific methods to extract insights from data",
    category: "Science",
    confidence_score: 0.82,
    aliases: ["DS"],
    document_ids: [],
  },
  {
    name: "Artificial Intelligence",
    description: "Intelligence demonstrated by machines, in contrast to human intelligence",
    category: "Technology",
    confidence_score: 0.95,
    aliases: ["AI"],
    document_ids: [],
  },
];

export default function TestDataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');
  
  const createConcept = useMutation(api.concepts.createConcept);

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedStatus('Creating test concepts...');
    
    try {
      let createdCount = 0;
      
      for (const concept of testConcepts) {
        try {
          await createConcept(concept);
          createdCount++;
          setSeedStatus(`Created ${createdCount}/${testConcepts.length} concepts...`);
        } catch (error) {
          console.error(`Failed to create concept ${concept.name}:`, error);
        }
      }
      
      setSeedStatus(`Successfully created ${createdCount} test concepts! Check the graph page.`);
    } catch (error) {
      setSeedStatus(`Error seeding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Test Data Seeder</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Add sample concepts to test the graph visualization.
      </p>
      
      <Button 
        onClick={handleSeedData} 
        disabled={isSeeding}
        className="w-full mb-4"
      >
        {isSeeding ? 'Seeding...' : 'Add Test Data'}
      </Button>
      
      {seedStatus && (
        <div className="text-sm p-3 bg-muted rounded">
          {seedStatus}
        </div>
      )}
    </Card>
  );
}