import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define layout types 
export type GraphLayout = 
  | 'force-directed' 
  | 'hierarchical' 
  | 'circular' 
  | 'radial';

export interface LayoutControlsProps {
  currentLayout: GraphLayout;
  onLayoutChange: (layout: GraphLayout) => void;
}

export function LayoutControls({ 
  currentLayout,
  onLayoutChange 
}: LayoutControlsProps) {
  const handleLayoutChange = (layout: GraphLayout) => {
    onLayoutChange(layout);
  };

  // Layout options with brief descriptions
  const layoutOptions: {
    value: GraphLayout; 
    label: string; 
    description: string;
  }[] = [
    {
      value: 'force-directed', 
      label: 'Force-Directed', 
      description: 'Minimizes edge crossings'
    },
    {
      value: 'hierarchical', 
      label: 'Hierarchical', 
      description: 'Organizes nodes by levels'
    },
    {
      value: 'circular', 
      label: 'Circular', 
      description: 'Arranges nodes in a circle'
    },
    {
      value: 'radial', 
      label: 'Radial', 
      description: 'Clusters around central nodes'
    }
  ];

  return (
    <Card className="p-3">
      <Label className="block mb-2 text-sm font-medium">Layout</Label>
      <Select 
        value={currentLayout}
        onValueChange={(value) => handleLayoutChange(value as GraphLayout)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {layoutOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
            >
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}

export default LayoutControls;