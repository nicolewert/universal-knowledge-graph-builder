"use client"

import React, { useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface NodeDetailProps {
  conceptId: Id<'concepts'> | null
  open: boolean
  onClose: () => void
}

export const NodeDetail: React.FC<NodeDetailProps> = ({ 
  conceptId, 
  open, 
  onClose 
}) => {
  // Fetch concept details and relationships
  const concept = useQuery(api.concepts.getConcept, { 
    conceptId: conceptId ?? undefined 
  })
  const relationships = useQuery(api.concepts.getConceptRelationships, { 
    conceptId: conceptId ?? undefined 
  })

  // Prevent rendering if no concept is selected
  if (!conceptId || !open) {
    return null
  }

  // Loading state
  if (!concept || !relationships) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Not found state
  if (!concept) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Concept Not Found</DialogTitle>
            <DialogDescription>
              The requested concept could not be retrieved.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{concept.name}</DialogTitle>
              {concept.category && (
                <Badge variant="secondary" className="mt-2">
                  {concept.category}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="mt-2">
            {concept.description}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Confidence Score */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Confidence Score</h3>
          <Progress 
            value={concept.confidence_score * 100} 
            className="w-full" 
          />
        </div>

        <Separator />

        {/* Related Concepts */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Related Concepts</h3>
          {relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No related concepts found.
            </p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => (
                <Card key={rel._id} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {rel.target_concept_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {rel.relationship_type}
                      </span>
                      <Progress 
                        value={rel.strength * 100} 
                        className="flex-grow" 
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Associated Documents */}
        <section>
          <h3 className="text-sm font-semibold mb-3">
            Associated Documents ({concept.document_ids.length})
          </h3>
          {concept.document_ids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents associated with this concept.
            </p>
          ) : (
            <div className="space-y-2">
              {concept.document_ids.map((docId) => (
                <Card key={docId} className="w-full">
                  <CardContent className="p-3 text-sm">
                    Document: {docId}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Metadata */}
        <Separator />
        <section className="text-xs text-muted-foreground">
          <div>Created: {new Date(concept.created_timestamp).toLocaleString()}</div>
          {concept.aliases.length > 0 && (
            <div>Aliases: {concept.aliases.join(', ')}</div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}

export default NodeDetail