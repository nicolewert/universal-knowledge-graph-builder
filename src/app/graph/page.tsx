'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import GraphVisualization, { GraphNode, GraphFilters } from '@/components/GraphVisualization';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function GraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    categories: [],
    relationshipTypes: [],
    searchQuery: '',
    nodeSize: 1,
    edgeThickness: 1
  });

  // Fetch graph data with real-time updates
  const graphData = useQuery(api.concepts.getGraphData);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    console.log('Node clicked:', node);
  };

  if (!graphData) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Knowledge Graph</h1>
        <Card className="w-full h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Knowledge Graph</h1>
      
      <div className="relative">
        <Card className="w-full h-[80vh] relative overflow-hidden">
          <GraphVisualization 
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeClick={handleNodeClick}
            filters={filters}
            className="w-full h-full"
          />
        </Card>
      </div>

      {selectedNodeId && (
        <div className="mt-4">
          <Card className="p-4">
            <p>Selected Node: {selectedNodeId}</p>
          </Card>
        </div>
      )}
    </div>
  );
}