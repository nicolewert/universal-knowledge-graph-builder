import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X } from 'lucide-react';

export interface GraphFilters {
  categories: string[];
  relationshipTypes: string[];
  searchQuery: string;
  nodeSize: number;
  edgeThickness: number;
}

export interface GraphFiltersProps {
  filters: GraphFilters;
  onFiltersChange: (filters: Partial<GraphFilters>) => void;
}

export function GraphFilters({ 
  filters,
  onFiltersChange 
}: GraphFiltersProps) {
  // Fetch available categories and relationship types from Convex
  const categories = useQuery(api.concepts.getCategories) || [];
  const relationshipTypes = useQuery(api.concepts.getRelationshipTypes) || [];

  // Handle category filter changes
  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onFiltersChange({ categories: newCategories });
  };

  // Handle relationship type changes
  const handleRelationshipTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.relationshipTypes, type]
      : filters.relationshipTypes.filter(t => t !== type);
    
    onFiltersChange({ relationshipTypes: newTypes });
  };

  // Handle slider changes
  const handleNodeSizeChange = (value: number[]) => {
    onFiltersChange({ nodeSize: value[0] });
  };

  const handleEdgeThicknessChange = (value: number[]) => {
    onFiltersChange({ edgeThickness: value[0] });
  };

  // Reset all filters
  const handleReset = () => {
    onFiltersChange({
      categories: [],
      relationshipTypes: [],
      nodeSize: 1,
      edgeThickness: 1
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          disabled={filters.categories.length === 0 && filters.relationshipTypes.length === 0 && filters.nodeSize === 1 && filters.edgeThickness === 1}
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Category Filters */}
      <div>
        <Label className="block mb-3 font-medium">Categories</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
              />
              <Label htmlFor={`category-${category}`} className="text-sm capitalize">
                {category}
              </Label>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories available</p>
          )}
        </div>
      </div>

      {/* Relationship Type Filters */}
      <div>
        <Label className="block mb-3 font-medium">Relationship Types</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {relationshipTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`relationship-${type}`}
                checked={filters.relationshipTypes.includes(type)}
                onCheckedChange={(checked) => handleRelationshipTypeChange(type, checked as boolean)}
              />
              <Label htmlFor={`relationship-${type}`} className="text-sm capitalize">
                {type}
              </Label>
            </div>
          ))}
          {relationshipTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">No relationship types available</p>
          )}
        </div>
      </div>

      {/* Visual Controls */}
      <div className="space-y-4">
        <div>
          <Label className="block mb-2 font-medium">Node Size</Label>
          <Slider
            value={[filters.nodeSize]}
            onValueChange={handleNodeSizeChange}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>
        
        <div>
          <Label className="block mb-2 font-medium">Edge Thickness</Label>
          <Slider
            value={[filters.edgeThickness]}
            onValueChange={handleEdgeThicknessChange}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Thin</span>
            <span>Thick</span>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.categories.length > 0 || filters.relationshipTypes.length > 0) && (
        <div className="pt-4 border-t">
          <Label className="block mb-2 font-medium">Active Filters:</Label>
          <div className="space-y-1 text-sm">
            {filters.categories.length > 0 && (
              <div>Categories: {filters.categories.join(', ')}</div>
            )}
            {filters.relationshipTypes.length > 0 && (
              <div>Relationships: {filters.relationshipTypes.join(', ')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphFilters;