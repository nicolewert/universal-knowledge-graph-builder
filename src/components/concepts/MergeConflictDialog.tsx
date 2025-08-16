import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// TypeScript interfaces for props and concept data
interface Concept {
  id: string;
  name: string;
  aliases: string[];
  documents: string[];
  confidence: number;
}

interface MergeConflictDialogProps {
  isOpen: boolean;
  primaryConcept: Concept;
  duplicateConcepts: Concept[];
  onMergeApprove: (primaryConceptId: string, duplicateConceptId: string) => void;
  onMergeReject: (duplicateConceptId: string) => void;
  onClose: () => void;
}

/**
 * Dialog component for manually reviewing and resolving concept merge conflicts
 */
export const MergeConflictDialog: React.FC<MergeConflictDialogProps> = ({
  isOpen,
  primaryConcept,
  duplicateConcepts,
  onMergeApprove,
  onMergeReject,
  onClose
}) => {
  const [selectedDuplicateIndex, setSelectedDuplicateIndex] = useState(0);

  // Compute potential merged confidence
  const computeMergedConfidence = (primary: Concept, duplicate: Concept) => {
    return Math.min(1, (primary.confidence + duplicate.confidence) / 2);
  };

  // Compute potential merged aliases
  const computeMergedAliases = (primary: Concept, duplicate: Concept) => {
    const mergedAliases = [...new Set([...primary.aliases, ...duplicate.aliases])];
    return mergedAliases;
  };

  const currentDuplicate = duplicateConcepts[selectedDuplicateIndex];
  const potentialMergedConfidence = computeMergedConfidence(primaryConcept, currentDuplicate);
  const potentialMergedAliases = computeMergedAliases(primaryConcept, currentDuplicate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Concept Merge Suggestion</DialogTitle>
          <DialogDescription>
            Review and resolve potential concept duplicates
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Concept Column */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Concept</CardTitle>
              <Badge variant="outline">Confidence: {primaryConcept.confidence.toFixed(2)}</Badge>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{primaryConcept.name}</p>
              <Separator className="my-2" />
              <div>
                <strong>Aliases:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {primaryConcept.aliases.map((alias, index) => (
                    <Badge key={index} variant="secondary">{alias}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Concept Column */}
          <Card>
            <CardHeader>
              <CardTitle>
                Duplicate Concept 
                <span className="ml-2 text-sm text-muted-foreground">
                  {selectedDuplicateIndex + 1} / {duplicateConcepts.length}
                </span>
              </CardTitle>
              <Badge variant="outline">Confidence: {currentDuplicate.confidence.toFixed(2)}</Badge>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{currentDuplicate.name}</p>
              <Separator className="my-2" />
              <div>
                <strong>Aliases:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentDuplicate.aliases.map((alias, index) => (
                    <Badge key={index} variant="secondary">{alias}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merge Preview */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Merge Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <strong>Potential Merged Aliases:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {potentialMergedAliases.map((alias, index) => (
                  <Badge key={index} variant="outline">{alias}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <strong>Potential Merged Confidence:</strong>
              <Badge variant="outline" className="ml-2">
                {potentialMergedConfidence.toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Actions */}
        <div className="flex justify-between mt-4">
          <div>
            {duplicateConcepts.length > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedDuplicateIndex(prev => 
                  (prev - 1 + duplicateConcepts.length) % duplicateConcepts.length
                )}
              >
                Previous Duplicate
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => onMergeReject(currentDuplicate.id)}
            >
              Reject Merge
            </Button>
            <Button 
              onClick={() => onMergeApprove(primaryConcept.id, currentDuplicate.id)}
            >
              Approve Merge
            </Button>
          </div>
          <div>
            {duplicateConcepts.length > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedDuplicateIndex(prev => 
                  (prev + 1) % duplicateConcepts.length
                )}
              >
                Next Duplicate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};