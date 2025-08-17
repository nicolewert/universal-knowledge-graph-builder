'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Settings, Map, Eye, EyeOff } from 'lucide-react';
import GraphVisualization, { GraphNode } from '@/components/GraphVisualization';
import GraphSearch from '@/components/graph/GraphSearch';
import GraphFilters, { GraphFilters as GraphFiltersType } from '@/components/graph/GraphFilters';
import LayoutControls from '@/components/graph/LayoutControls';
import MiniMap from '@/components/graph/MiniMap';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type LayoutType = 'force-directed' | 'hierarchical' | 'circular' | 'radial';

export default function GraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFiltersType>({
    categories: [],
    relationshipTypes: [],
    searchQuery: '',
    nodeSize: 1,
    edgeThickness: 1
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [layoutType, setLayoutType] = useState<LayoutType>('force-directed');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Refs for direct component access
  const searchRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<any>(null);

  // Fetch graph data with filters (ensure defaults)
  const graphData = useQuery(api.concepts.getGraphData, {
    categories: filters.categories || [],
    relationshipTypes: filters.relationshipTypes || [],
    searchQuery: filters.searchQuery || '',
  });

  // Fallback data for demo purposes while debugging useQuery issue
  const fallbackGraphData = React.useMemo(() => ({
    nodes: [
      {
        id: '1',
        name: 'Artificial Intelligence',
        category: 'technology',
        size: 3,
        description: 'The simulation of human intelligence processes by machines',
        confidence: 0.9
      },
      {
        id: '2', 
        name: 'Machine Learning',
        category: 'technology',
        size: 2,
        description: 'A subset of AI that enables computers to learn without explicit programming',
        confidence: 0.85
      },
      {
        id: '3',
        name: 'Neural Networks', 
        category: 'technology',
        size: 2,
        description: 'Computing systems inspired by biological neural networks',
        confidence: 0.8
      },
      {
        id: '4',
        name: 'Deep Learning',
        category: 'technology', 
        size: 2,
        description: 'Machine learning using neural networks with multiple layers',
        confidence: 0.88
      }
    ],
    edges: [
      {
        source: '2',
        target: '1', 
        strength: 0.9,
        type: 'subset_of',
        context: 'Machine Learning is a subset of Artificial Intelligence'
      },
      {
        source: '4',
        target: '2',
        strength: 0.85, 
        type: 'subset_of',
        context: 'Deep Learning is a subset of Machine Learning'
      },
      {
        source: '4',
        target: '3',
        strength: 0.9,
        type: 'uses', 
        context: 'Deep Learning uses Neural Networks'
      }
    ]
  }), []);

  // Use fallback data if query is stuck
  const [useQueryTimeout, setUseQueryTimeout] = React.useState(false);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (graphData === undefined) {
        console.warn('Using fallback data due to useQuery timeout');
        setUseQueryTimeout(true);
      }
    }, 2000); // 2 second timeout for demo
    
    if (graphData !== undefined) {
      // Query resolved, no need for fallback
      setUseQueryTimeout(false);
    }
    
    return () => clearTimeout(timeout);
  }, [graphData]);

  const effectiveGraphData = useQueryTimeout ? fallbackGraphData : graphData;

  // Debug logging
  React.useEffect(() => {
    console.log('Graph query state:', { 
      graphData,
      effectiveGraphData,
      isLoading: effectiveGraphData === undefined,
      hasData: effectiveGraphData && effectiveGraphData.nodes && effectiveGraphData.nodes.length > 0,
      filters,
      useQueryTimeout
    });
  }, [graphData, effectiveGraphData, filters, useQueryTimeout]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    console.log('Node clicked:', node);
  };

  // Keyboard shortcuts handlers
  const keyboardShortcuts = useKeyboardShortcuts({
    onSearch: () => {},
    onToggleFilters: () => setShowFilters(prev => !prev),
    onResetView: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      graphRef.current?.resetView?.();
    },
    onToggleMinimap: () => setShowMinimap(prev => !prev),
    onFocusSearch: () => searchRef.current?.focus(),
    onZoomIn: () => {
      const newZoom = Math.min(zoom * 1.2, 10);
      setZoom(newZoom);
      graphRef.current?.setZoom?.(newZoom);
    },
    onZoomOut: () => {
      const newZoom = Math.max(zoom / 1.2, 0.1);
      setZoom(newZoom);
      graphRef.current?.setZoom?.(newZoom);
    },
    onFitToView: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      graphRef.current?.fitToView?.();
    },
  });

  const handleSearchChange = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<GraphFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  if (effectiveGraphData === undefined) {
    console.log('Graph data is loading...');
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

  if (effectiveGraphData === null) {
    console.log('Graph data query failed');
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Knowledge Graph</h1>
        <Card className="w-full h-[600px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load graph data</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }
  
  console.log('Graph data loaded:', effectiveGraphData);

  // Add data validation
  const hasValidData = effectiveGraphData && effectiveGraphData.nodes && Array.isArray(effectiveGraphData.nodes);
  
  if (hasValidData && effectiveGraphData.nodes.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Knowledge Graph</h1>
        <Card className="w-full h-[600px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No graph data available. Try adding some concepts first.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Knowledge Graph</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMinimap(!showMinimap)}
            className="gap-2"
          >
            {showMinimap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Navigate the knowledge graph more efficiently with these shortcuts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {keyboardShortcuts.getShortcutsHelp().map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <kbd className="bg-muted px-2 py-1 rounded text-sm">{shortcut.key}</kbd>
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <GraphSearch
            ref={searchRef}
            searchQuery={filters.searchQuery}
            onSearchChange={handleSearchChange}
            placeholder="Search concepts and descriptions..."
          />
        </div>

        {/* Layout Controls */}
        <LayoutControls
          currentLayout={layoutType}
          onLayoutChange={setLayoutType}
        />

        {/* Graph Stats */}
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">
            <div>Nodes: {effectiveGraphData.nodes.length}</div>
            <div>Edges: {effectiveGraphData.edges.length}</div>
          </div>
        </Card>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 mb-4">
          <GraphFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Card>
      )}

      {/* Main Graph Area */}
      <div className="relative">
        <Card className="w-full h-[70vh] relative overflow-hidden">
          <GraphVisualization 
            ref={graphRef}
            nodes={effectiveGraphData.nodes}
            edges={effectiveGraphData.edges}
            onNodeClick={handleNodeClick}
            filters={filters}
            layoutType={layoutType}
            className="w-full h-full"
          />
          
          {/* Minimap */}
          {showMinimap && (
            <div className="absolute bottom-4 right-4 w-48 h-32">
              <MiniMap
                nodes={effectiveGraphData.nodes}
                edges={effectiveGraphData.edges}
                currentView={{ zoom, pan }}
                onViewChange={setPan}
                className="w-full h-full border border-border rounded bg-background/80 backdrop-blur-sm"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Selected Node Details */}
      {selectedNodeId && (
        <div className="mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="font-medium">Selected Node:</span>
              <span>{selectedNodeId}</span>
            </div>
            {/* TODO: Add detailed node information */}
          </Card>
        </div>
      )}
    </div>
  );
}