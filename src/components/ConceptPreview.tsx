'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Loader2 } from 'lucide-react';

// Define types for Concept and Relationship
interface Concept {
  id: string;
  name: string;
  description?: string;
  confidenceScore: number;
  category?: string;
}

interface Relationship {
  id: string;
  sourceConcept: string;
  targetConcept: string;
  type: string;
  confidenceScore: number;
}

interface ConceptPreviewProps {
  concepts: Concept[];
  relationships: Relationship[];
  isLoading?: boolean;
}

export const ConceptPreview: React.FC<ConceptPreviewProps> = ({
  concepts = [],
  relationships = [],
  isLoading = false
}) => {
  const getConfidenceVariant = (score: number) => {
    if (score > 0.8) return 'default';
    if (score > 0.5) return 'outline';
    return 'secondary';
  };

  const renderConcepts = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (concepts.length === 0) {
      return (
        <div className="text-center text-muted-foreground text-sm py-4">
          No concepts extracted yet
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {concepts.map((concept) => (
          <Card key={concept.id} className="w-full hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>{concept.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-sm font-medium">{concept.name}</CardTitle>
              </div>
              {concept.category && (
                <Badge variant="secondary" className="capitalize">
                  {concept.category}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {concept.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {concept.description}
                </p>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <Progress 
                  value={concept.confidenceScore * 100} 
                  className="w-full max-w-[200px]" 
                />
                <Badge variant={getConfidenceVariant(concept.confidenceScore)}>
                  {(concept.confidenceScore * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRelationships = () => {
    if (isLoading) {
      return null;
    }

    if (relationships.length === 0) {
      return (
        <div className="text-center text-muted-foreground text-sm py-4">
          No relationships mapped yet
        </div>
      );
    }

    return (
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3">Concept Relationships</h3>
        <div className="space-y-2">
          {relationships.map((rel) => (
            <div 
              key={rel.id} 
              className="flex items-center justify-between bg-accent/50 p-2 rounded-md"
            >
              <div className="text-xs">
                <span className="font-medium">{rel.sourceConcept}</span>
                {' → '}
                <span className="font-medium">{rel.targetConcept}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="capitalize">
                  {rel.type}
                </Badge>
                <Badge variant={getConfidenceVariant(rel.confidenceScore)}>
                  {(rel.confidenceScore * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Extracted Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          {renderConcepts()}
          {renderRelationships()}
        </CardContent>
      </Card>
    </div>
  );
};