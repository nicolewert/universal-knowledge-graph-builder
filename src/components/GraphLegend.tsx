import React, { useState } from 'react'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Define color mapping for chart variables
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

// Interface for component props
interface GraphLegendProps {
  categories: Array<{
    name: string; 
    count: number;
  }>;
  relationshipTypes: Array<{
    name: string; 
    count: number;
  }>;
  className?: string;
}

// Node size ranges
const NODE_SIZES = [
  { label: 'Small (1-10 docs)', size: 'w-4 h-4' },
  { label: 'Medium (11-50 docs)', size: 'w-6 h-6' },
  { label: 'Large (50+ docs)', size: 'w-8 h-8' }
]

// Relationship strength ranges
const EDGE_STRENGTHS = [
  { label: 'Weak', thickness: 'border-2' },
  { label: 'Medium', thickness: 'border-4' },
  { label: 'Strong', thickness: 'border-6' }
]

export function GraphLegend({ 
  categories, 
  relationshipTypes, 
  className 
}: GraphLegendProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card className={cn(
      "fixed top-4 right-4 z-50 w-64 p-4 bg-background/80 backdrop-blur-sm",
      "border border-border/50 shadow-lg rounded-lg",
      className
    )}>
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Graph Legend</h3>
          <CollapsibleTrigger className="hover:bg-accent p-2 rounded-md">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          {/* Node Categories Section */}
          <section className="mt-4">
            <h4 className="text-sm font-medium mb-2">Node Categories</h4>
            <div className="space-y-1">
              {categories.map((category, index) => (
                <div 
                  key={category.name} 
                  className="flex items-center space-x-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                    }}
                  />
                  <span className="text-xs">{category.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {category.count}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Node Sizes Section */}
          <section className="mt-4">
            <h4 className="text-sm font-medium mb-2">Node Sizes</h4>
            <div className="space-y-1">
              {NODE_SIZES.map((size) => (
                <div 
                  key={size.label} 
                  className="flex items-center space-x-2"
                >
                  <div 
                    className={`rounded-full bg-muted ${size.size}`} 
                  />
                  <span className="text-xs">{size.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Relationship Types Section */}
          <section className="mt-4">
            <h4 className="text-sm font-medium mb-2">Relationship Types</h4>
            <div className="space-y-1">
              {relationshipTypes.map((type, index) => (
                <div 
                  key={type.name} 
                  className="flex items-center space-x-2"
                >
                  <div 
                    className="w-12 border-dashed" 
                    style={{ 
                      borderColor: CHART_COLORS[index % CHART_COLORS.length],
                      borderTopWidth: '2px'
                    }}
                  />
                  <span className="text-xs">{type.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {type.count}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Edge Strengths Section */}
          <section className="mt-4">
            <h4 className="text-sm font-medium mb-2">Relationship Strengths</h4>
            <div className="space-y-1">
              {EDGE_STRENGTHS.map((strength) => (
                <div 
                  key={strength.label} 
                  className="flex items-center space-x-2"
                >
                  <div 
                    className={`w-12 border-dashed border-primary ${strength.thickness}`} 
                  />
                  <span className="text-xs">{strength.label}</span>
                </div>
              ))}
            </div>
          </section>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}