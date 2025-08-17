import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RefreshCw, PlayIcon, PauseIcon, SearchIcon, XIcon } from 'lucide-react';

// Types for GraphControls props
interface GraphControlsProps {
  nodes: any[]; // Replace with actual node type
  edges: any[]; // Replace with actual edge type
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFilterChange: (filters: GraphFilters) => void;
  onSimulationToggle: () => void;
  isSimulationRunning: boolean;
}

// Interface for graph filters
interface GraphFilters {
  categories: string[];
  relationshipTypes: string[];
  nodeSize: number;
  edgeThickness: number;
  searchTerm: string;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  nodes,
  edges,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFilterChange,
  onSimulationToggle,
  isSimulationRunning
}) => {
  // State for filters
  const [filters, setFilters] = useState<GraphFilters>({
    categories: [],
    relationshipTypes: [],
    nodeSize: 5,
    edgeThickness: 1,
    searchTerm: ''
  });

  // Memoized category and relationship type calculations
  const categoryCounts = useMemo(() => {
    return nodes.reduce((acc, node) => {
      acc[node.category] = (acc[node.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [nodes]);

  const relationshipTypeCounts = useMemo(() => {
    return edges.reduce((acc, edge) => {
      acc[edge.type] = (acc[edge.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [edges]);

  // Debounced filter change handler
  const handleFilterChange = useCallback((newFilters: Partial<GraphFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [filters, onFilterChange]);

  // Category toggle handler
  const toggleCategory = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    handleFilterChange({ categories: newCategories });
  }, [filters.categories, handleFilterChange]);

  // Relationship type toggle handler
  const toggleRelationshipType = useCallback((type: string) => {
    const newTypes = filters.relationshipTypes.includes(type)
      ? filters.relationshipTypes.filter(t => t !== type)
      : [...filters.relationshipTypes, type];
    
    handleFilterChange({ relationshipTypes: newTypes });
  }, [filters.relationshipTypes, handleFilterChange]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 rounded-lg shadow-lg p-4 space-y-4 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Zoom Controls */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="icon" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onResetView}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Simulation Controls */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onSimulationToggle}
        >
          {isSimulationRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </Button>
        <span className="text-sm">
          {isSimulationRunning ? 'Pause' : 'Play'} Simulation
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input 
          placeholder="Search nodes..." 
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {filters.searchTerm ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleFilterChange({ searchTerm: '' })}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          ) : (
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Node Size Slider */}
      <div>
        <label className="block text-sm font-medium mb-2">Node Size</label>
        <Slider 
          defaultValue={[filters.nodeSize]} 
          max={10} 
          step={1} 
          onValueChange={(value) => handleFilterChange({ nodeSize: value[0] })}
        />
      </div>

      {/* Edge Thickness Slider */}
      <div>
        <label className="block text-sm font-medium mb-2">Edge Thickness</label>
        <Slider 
          defaultValue={[filters.edgeThickness]} 
          max={5} 
          step={1} 
          onValueChange={(value) => handleFilterChange({ edgeThickness: value[0] })}
        />
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-sm font-medium mb-2">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <Badge 
              key={category} 
              variant={filters.categories.includes(category) ? 'default' : 'secondary'}
              onClick={() => toggleCategory(category)}
              className="cursor-pointer"
            >
              {category} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Relationship Type Filters */}
      <div>
        <h3 className="text-sm font-medium mb-2">Relationship Types</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(relationshipTypeCounts).map(([type, count]) => (
            <Badge 
              key={type} 
              variant={filters.relationshipTypes.includes(type) ? 'default' : 'secondary'}
              onClick={() => toggleRelationshipType(type)}
              className="cursor-pointer"
            >
              {type} ({count})
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphControls;