import React, { useRef, useEffect } from 'react';
import { GraphNode, GraphEdge } from '@/components/GraphVisualization';

export interface MiniMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentView: { zoom: number; pan: { x: number; y: number } };
  onViewChange: (pan: { x: number; y: number }) => void;
  className?: string;
}

export function MiniMap({ 
  nodes, 
  edges, 
  currentView,
  onViewChange,
  className = ""
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate minimap scale and bounds
  const calculateBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    
    const nodeXPositions = nodes.map(n => n.x || 0);
    const nodeYPositions = nodes.map(n => n.y || 0);

    return {
      minX: Math.min(...nodeXPositions),
      maxX: Math.max(...nodeXPositions),
      minY: Math.min(...nodeYPositions),
      maxY: Math.max(...nodeYPositions)
    };
  };

  const drawMiniMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = calculateBounds();
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (nodes.length === 0) {
      // Draw empty state
      ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.fillRect(width/2 - 20, height/2 - 5, 40, 10);
      return;
    }

    // Calculate scale
    const graphWidth = bounds.maxX - bounds.minX || 1;
    const graphHeight = bounds.maxY - bounds.minY || 1;
    const scaleX = (width - 20) / graphWidth;
    const scaleY = (height - 20) / graphHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (width - graphWidth * scale) / 2;
    const offsetY = (height - graphHeight * scale) / 2;

    // Draw edges first
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const x1 = ((sourceNode.x || 0) - bounds.minX) * scale + offsetX;
      const y1 = ((sourceNode.y || 0) - bounds.minY) * scale + offsetY;
      const x2 = ((targetNode.x || 0) - bounds.minX) * scale + offsetX;
      const y2 = ((targetNode.y || 0) - bounds.minY) * scale + offsetY;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw nodes
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    nodes.forEach(node => {
      if (typeof node.x === 'undefined' || typeof node.y === 'undefined') return;
      
      const x = (node.x - bounds.minX) * scale + offsetX;
      const y = (node.y - bounds.minY) * scale + offsetY;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw viewport indicator
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;
    const viewportX = (currentView.pan.x - bounds.minX) * scale + offsetX;
    const viewportY = (currentView.pan.y - bounds.minY) * scale + offsetY;
    const viewportWidth = (100 / currentView.zoom) * scale; // Approximate viewport size
    const viewportHeight = (100 / currentView.zoom) * scale;

    ctx.strokeRect(
      viewportX - viewportWidth/2, 
      viewportY - viewportHeight/2, 
      viewportWidth, 
      viewportHeight
    );
  };

  // Handle minimap click to pan
  const handleMiniMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const bounds = calculateBounds();
    
    const graphWidth = bounds.maxX - bounds.minX || 1;
    const graphHeight = bounds.maxY - bounds.minY || 1;
    const scaleX = (canvas.width - 20) / graphWidth;
    const scaleY = (canvas.height - 20) / graphHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (canvas.width - graphWidth * scale) / 2;
    const offsetY = (canvas.height - graphHeight * scale) / 2;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const graphX = (clickX - offsetX) / scale + bounds.minX;
    const graphY = (clickY - offsetY) / scale + bounds.minY;

    onViewChange({ x: graphX, y: graphY });
  };

  useEffect(() => {
    drawMiniMap();
  }, [nodes, edges, currentView]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={192}
        height={128}
        className="w-full h-full cursor-pointer border border-border rounded"
        onClick={handleMiniMapClick}
        aria-label="Graph minimap navigator"
      />
    </div>
  );
}

export default MiniMap;