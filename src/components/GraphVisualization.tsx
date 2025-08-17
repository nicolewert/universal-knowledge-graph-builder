import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card } from '@/components/ui/card';

// Type definitions for nodes and edges
export interface GraphNode {
  id: string;
  name: string;
  category?: string;
  size: number;
  description?: string;
  confidence: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: string;
  context: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Color mapping for categories 
const CATEGORY_COLORS: Record<string, string> = {
  'Technology': '#3498db',
  'Science': '#2ecc71', 
  'History': '#e74c3c',
  'Art': '#f39c12',
  'Default': '#95a5a6'
};

export interface GraphFilters {
  categories: string[];
  relationshipTypes: string[];
  searchQuery: string;
  nodeSize: number;
  edgeThickness: number;
}

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  filters?: GraphFilters;
  layoutType?: 'force-directed' | 'hierarchical' | 'circular' | 'radial';
  width?: number;
  height?: number;
  className?: string;
}

export const GraphVisualization = React.forwardRef<any, GraphVisualizationProps>(({
  nodes,
  edges,
  onNodeClick,
  filters,
  layoutType = 'force-directed',
  width = 800,
  height = 600,
  className = ''
}, ref) => {
  // Refs for SVG and simulation
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  // Filter data based on filters
  const filteredNodes = React.useMemo(() => {
    if (!filters) return nodes;
    
    return nodes.filter(node => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(node.category || 'default')) {
        return false;
      }
      
      // Search filter
      if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [nodes, filters]);

  const filteredEdges = React.useMemo(() => {
    if (!filters) return edges;
    
    // Get IDs of filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    return edges.filter(edge => {
      // Only include edges where both nodes are visible
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false;
      }
      
      // Relationship type filter
      if (filters.relationshipTypes.length > 0 && !filters.relationshipTypes.includes(edge.type)) {
        return false;
      }
      
      return true;
    });
  }, [edges, filteredNodes, filters]);

  const graphData = { nodes: filteredNodes, edges: filteredEdges };

  // Main graph rendering effect
  useEffect(() => {
    if (!svgRef.current) return;
    if (graphData.nodes.length === 0) {
      // Clear the SVG when no data
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Scales
    const baseSizeMultiplier = filters?.nodeSize || 1;
    const nodeScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.nodes, d => d.size) || 1])
      .range([5 * baseSizeMultiplier, 25 * baseSizeMultiplier]);

    // Create force simulation based on layout type
    let simulation: d3.Simulation<GraphNode, GraphEdge>;
    
    switch (layoutType) {
      case 'hierarchical':
        simulation = d3.forceSimulation<GraphNode, GraphEdge>(graphData.nodes)
          .force('link', d3.forceLink<GraphNode, GraphEdge>(graphData.edges)
            .id(d => d.id)
            .distance(150)
          )
          .force('charge', d3.forceManyBody().strength(-300))
          .force('y', d3.forceY().strength(0.3))
          .force('collision', d3.forceCollide().radius(d => nodeScale(d.size) + 15))
          .on('tick', ticked);
        break;
        
      case 'circular':
        simulation = d3.forceSimulation<GraphNode, GraphEdge>(graphData.nodes)
          .force('link', d3.forceLink<GraphNode, GraphEdge>(graphData.edges)
            .id(d => d.id)
            .distance(120)
          )
          .force('charge', d3.forceManyBody().strength(-100))
          .force('radial', d3.forceRadial(Math.min(width, height) * 0.3, width / 2, height / 2).strength(0.8))
          .force('collision', d3.forceCollide().radius(d => nodeScale(d.size) + 10))
          .on('tick', ticked);
        break;
        
      case 'radial':
        simulation = d3.forceSimulation<GraphNode, GraphEdge>(graphData.nodes)
          .force('link', d3.forceLink<GraphNode, GraphEdge>(graphData.edges)
            .id(d => d.id)
            .distance(80)
          )
          .force('radial', d3.forceRadial(
            (d, i) => (i * 30) % (Math.min(width, height) * 0.4), 
            width / 2, 
            height / 2
          ).strength(1))
          .force('collision', d3.forceCollide().radius(d => nodeScale(d.size) + 10))
          .on('tick', ticked);
        break;
        
      default: // force-directed
        simulation = d3.forceSimulation<GraphNode, GraphEdge>(graphData.nodes)
          .force('link', d3.forceLink<GraphNode, GraphEdge>(graphData.edges)
            .id(d => d.id)
            .distance(100)
          )
          .force('charge', d3.forceManyBody().strength(-200))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(d => nodeScale(d.size) + 10))
          .on('tick', ticked);
    }

    simulationRef.current = simulation;

    // Create edge links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.edges)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength) * (filters?.edgeThickness || 1));

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(graphData.nodes)
      .enter().append('circle')
      .attr('r', d => nodeScale(d.size))
      .attr('fill', d => CATEGORY_COLORS[d.category || 'Default'])
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        onNodeClick?.(d);
      })
      .on('dblclick', (event, d) => {
        // Release pinned nodes on double-click
        d.fx = null;
        d.fy = null;
        simulation.alpha(1).restart();
      });

    // Add labels
    const label = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graphData.nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', '.35em')
      .attr('fill', '#333');

    // Zoom and pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom);

    // Tick function for animation
    function ticked() {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      label
        .attr('x', d => (d.x || 0) + 10)
        .attr('y', d => (d.y || 0));
    }

    // Drag handlers
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
    }

    // Cleanup function
    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graphData, width, height, onNodeClick, filters, layoutType]);

  // Expose methods to parent components via ref
  React.useImperativeHandle(ref, () => ({
    resetView: () => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(750).call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
        );
      }
    },
    setZoom: (zoomLevel: number) => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(300).call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity.scale(zoomLevel)
        );
      }
    },
    fitToView: () => {
      if (svgRef.current && graphData.nodes.length > 0) {
        const svg = d3.select(svgRef.current);
        const bounds = svg.node()?.getBBox();
        if (bounds) {
          const fullWidth = width;
          const fullHeight = height;
          const widthScale = fullWidth / bounds.width;
          const heightScale = fullHeight / bounds.height;
          const scale = Math.min(widthScale, heightScale) * 0.8;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;
          svg.transition().duration(750).call(
            d3.zoom<SVGSVGElement, unknown>().transform,
            d3.zoomIdentity.translate(fullWidth / 2, fullHeight / 2).scale(scale).translate(-centerX, -centerY)
          );
        }
      }
    }
  }));

  if (graphData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-muted-foreground">No graph data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden ${className}`}>
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
});

GraphVisualization.displayName = 'GraphVisualization';

export default GraphVisualization;