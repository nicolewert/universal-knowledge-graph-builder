"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from 'lucide-react';

interface ContextDisplayProps {
  concepts?: any[];
  documents?: any[];
}

export function ContextDisplay({ concepts = [], documents = [] }: ContextDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = concepts.length + documents.length;

  if (totalItems === 0) return null;

  return (
    <div className="w-full space-y-2 mt-2">
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen}
      >
      <div className="flex items-center space-x-2">
        <h4 className="text-xs font-medium text-muted-foreground">
          Knowledge Context ({totalItems} reference{totalItems !== 1 ? 's' : ''})
        </h4>
        <CollapsibleTrigger>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
            <ChevronDownIcon 
              className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
            <span className="sr-only">Toggle context</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="space-y-2">
          {concepts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Concepts:</p>
              <div className="flex flex-wrap gap-1">
                {concepts.map((concept) => (
                  <TooltipProvider key={concept._id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline"
                          className="cursor-help text-xs"
                        >
                          {concept.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-medium text-sm">{concept.name}</p>
                          {concept.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {concept.description.length > 150 
                                ? concept.description.substring(0, 150) + '...' 
                                : concept.description
                              }
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          
          {documents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Documents:</p>
              <div className="flex flex-wrap gap-1">
                {documents.map((document) => (
                  <TooltipProvider key={document._id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="secondary"
                          className="cursor-help text-xs"
                        >
                          {document.title}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-medium text-sm">{document.title}</p>
                          {document.content && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {document.content.length > 200 
                                ? document.content.substring(0, 200) + '...' 
                                : document.content
                              }
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
      </Collapsible>
    </div>
  );
}