import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRightIcon } from "lucide-react";

// TypeScript interfaces for props and concept data
interface Concept {
  id: string;
  name: string;
  aliases: string[];
  documents: string[];
  confidence: number;
}

interface ConceptMergePreviewProps {
  beforeConcepts: Concept[];
  afterConcept: Concept;
}

/**
 * Component to visualize concept merge operations before and after
 */
export const ConceptMergePreview: React.FC<ConceptMergePreviewProps> = ({
  beforeConcepts,
  afterConcept
}) => {
  // Compute added aliases
  const addedAliases = afterConcept.aliases.filter(
    alias => !beforeConcepts.some(
      concept => concept.aliases.includes(alias)
    )
  );

  // Compute added documents
  const addedDocuments = afterConcept.documents.filter(
    doc => !beforeConcepts.some(
      concept => concept.documents.includes(doc)
    )
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Concept Merge Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Before Concepts */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Before Merge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beforeConcepts.map((concept, index) => (
              <Card key={concept.id} className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Concept {index + 1}
                    <Badge variant="outline" className="ml-2">
                      Confidence: {concept.confidence.toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-bold mb-2">{concept.name}</p>
                  <Separator className="mb-2" />
                  <div>
                    <strong>Aliases:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {concept.aliases.map((alias, aliasIndex) => (
                        <Badge key={aliasIndex} variant="secondary">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <strong>Documents:</strong>
                    <div className="text-sm text-muted-foreground">
                      {concept.documents.length} documents
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Merge Arrow */}
        <div className="flex justify-center my-4">
          <ArrowRightIcon className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* After Concept */}
        <div>
          <h3 className="text-lg font-semibold mb-2">After Merge</h3>
          <Card>
            <CardHeader>
              <CardTitle>
                Merged Concept
                <Badge variant="outline" className="ml-2">
                  Confidence: {afterConcept.confidence.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold mb-2">{afterConcept.name}</p>
              <Separator className="mb-2" />
              
              {/* Aliases Section */}
              <div className="mb-2">
                <strong>Aliases:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {afterConcept.aliases.map((alias, index) => (
                    <Badge 
                      key={index} 
                      variant={addedAliases.includes(alias) ? "default" : "secondary"}
                    >
                      {alias}
                      {addedAliases.includes(alias) && (
                        <span className="ml-1 text-xs">(New)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <strong>Documents:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {afterConcept.documents.map((doc, index) => (
                    <Badge 
                      key={index} 
                      variant={addedDocuments.includes(doc) ? "default" : "secondary"}
                    >
                      {doc}
                      {addedDocuments.includes(doc) && (
                        <span className="ml-1 text-xs">(Added)</span>
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total: {afterConcept.documents.length} documents
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};