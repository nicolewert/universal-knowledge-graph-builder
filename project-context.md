# Universal Knowledge-Graph Builder - Hackathon Context

## Project Overview

A real-time knowledge graph builder that converts document archives (TXT files and URLs) into an interactive, queryable knowledge graph with natural language Q&A capabilities. Users upload documents, the system extracts concepts and relationships using Claude API, visualizes them as an interactive graph, and enables conversational queries over the knowledge base with real-time updates via Convex.

## Tech Stack

* **Framework**: Next.js 15 with App Router
* **Database**: Convex (real-time, TypeScript-native)
* **Styling**: Tailwind CSS v3
* **Components**: shadcn/ui (New York style)
* **Package Manager**: pnpm
* **Build Tool**: Turbopack for fast development
* **Language**: TypeScript
* **MCP Servers**: Convex + Playwright + Vercel for Claude Code
* **AI Integration**: Claude API

## Database Schema

### documents
```typescript
{
  _id: Id<"documents">,
  title: string,
  content: string,
  source_type: "file" | "url",
  source_url?: string,
  file_size?: number,
  processing_status: "pending" | "processing" | "completed" | "failed",
  upload_timestamp: number,
  processed_timestamp?: number,
  error_message?: string
}
```

### concepts
```typescript
{
  _id: Id<"concepts">,
  name: string,
  description: string,
  document_ids: Id<"documents">[],
  confidence_score: number, // 0-1
  category?: string,
  aliases: string[],
  created_timestamp: number
}
```

### relationships
```typescript
{
  _id: Id<"relationships">,
  source_concept_id: Id<"concepts">,
  target_concept_id: Id<"concepts">,
  relationship_type: "related_to" | "part_of" | "causes" | "influences" | "mentions",
  strength: number, // 0-1
  context: string,
  document_id: Id<"documents">,
  created_timestamp: number
}
```

### chat_sessions
```typescript
{
  _id: Id<"chat_sessions">,
  user_id: string,
  title: string,
  created_timestamp: number,
  last_message_timestamp: number
}
```

### chat_messages
```typescript
{
  _id: Id<"chat_messages">,
  session_id: Id<"chat_sessions">,
  role: "user" | "assistant",
  content: string,
  timestamp: number,
  context_concepts?: Id<"concepts">[],
  context_documents?: Id<"documents">[]
}
```

## API Contract

### Convex Queries

```typescript
// queries.ts
export const getDocuments = query({
  args: {},
  handler: async (ctx) => Doc<"documents">[]
});

export const getGraphData = query({
  args: {},
  handler: async (ctx) => {
    nodes: Array<{id: string, name: string, category?: string, size: number}>,
    edges: Array<{source: string, target: string, strength: number, type: string}>
  }
});

export const getConcept = query({
  args: { conceptId: v.id("concepts") },
  handler: async (ctx, args) => Doc<"concepts"> | null
});

export const getConceptRelationships = query({
  args: { conceptId: v.id("concepts") },
  handler: async (ctx, args) => Doc<"relationships">[]
});

export const getChatSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => Doc<"chat_sessions">[]
});

export const getChatMessages = query({
  args: { sessionId: v.id("chat_sessions") },
  handler: async (ctx, args) => Doc<"chat_messages">[]
});
```

### Convex Mutations

```typescript
// mutations.ts
export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    source_type: v.union(v.literal("file"), v.literal("url")),
    source_url: v.optional(v.string()),
    file_size: v.optional(v.number())
  },
  handler: async (ctx, args) => Id<"documents">
});

export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    error_message: v.optional(v.string())
  },
  handler: async (ctx, args) => void
});

export const createConcept = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    document_ids: v.array(v.id("documents")),
    confidence_score: v.number(),
    category: v.optional(v.string()),
    aliases: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => Id<"concepts">
});

export const createRelationship = mutation({
  args: {
    source_concept_id: v.id("concepts"),
    target_concept_id: v.id("concepts"),
    relationship_type: v.string(),
    strength: v.number(),
    context: v.string(),
    document_id: v.id("documents")
  },
  handler: async (ctx, args) => Id<"relationships">
});

export const createChatSession = mutation({
  args: {
    user_id: v.string(),
    title: v.string()
  },
  handler: async (ctx, args) => Id<"chat_sessions">
});

export const addChatMessage = mutation({
  args: {
    session_id: v.id("chat_sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    context_concepts: v.optional(v.array(v.id("concepts"))),
    context_documents: v.optional(v.array(v.id("documents")))
  },
  handler: async (ctx, args) => Id<"chat_messages">
});
```

### Convex Actions

```typescript
// actions.ts
export const processDocument = action({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => void // Calls Claude API for concept extraction
});

export const scrapeUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    title: string,
    content: string,
    success: boolean,
    error?: string
  }
});

export const generateAnswer = action({
  args: {
    question: v.string(),
    session_id: v.id("chat_sessions")
  },
  handler: async (ctx, args) => string // Calls Claude API with graph context
});
```

## Component Architecture

### Core Layout Components
```typescript
// components/layout/
- Header.tsx: Navigation, upload button
- Sidebar.tsx: Document list, chat sessions
- Layout.tsx: Main app shell with real-time subscriptions

// components/ui/ (shadcn/ui)
- Button, Input, Card, Dialog, Progress, Alert
- Custom components: FileUpload, UrlInput
```

### Feature Components
```typescript
// components/graph/
- GraphVisualization.tsx: D3.js/react-flow integration
- NodeDetail.tsx: Concept detail modal
- GraphControls.tsx: Zoom, filter, layout controls

// components/documents/
- DocumentList.tsx: Real-time document status
- DocumentUpload.tsx: Drag-drop + URL input
- DocumentCard.tsx: Individual document preview

// components/chat/
- ChatInterface.tsx: Main chat UI
- MessageList.tsx: Scrollable message history
- MessageInput.tsx: Question input with suggestions
- ChatSessionList.tsx: Session management
```

### Shared Patterns
```typescript
// hooks/
- useConvexQuery: Wrapper for real-time queries
- useFileUpload: Upload logic with progress
- useGraphData: Graph state management

// utils/
- formatters.ts: Date, size, confidence formatting
- constants.ts: App config, limits, colors
- types.ts: Shared TypeScript interfaces
```

## Routing Structure

```
app/
├── page.tsx                    # Dashboard: Recent docs + graph preview
├── documents/
│   ├── page.tsx               # Document management
│   └── [id]/page.tsx          # Document detail view
├── graph/
│   └── page.tsx               # Full-screen graph visualization
├── chat/
│   ├── page.tsx               # Chat session list
│   └── [sessionId]/page.tsx   # Individual chat interface
├── api/
│   ├── upload/route.ts        # File upload handler
│   └── webhook/route.ts       # Convex webhook endpoint
└── layout.tsx                 # Root layout with providers
```

### Navigation Flow
1. **Home** → Upload documents or view existing graph
2. **Documents** → Manage uploads, view processing status
3. **Graph** → Interactive visualization, click nodes for details
4. **Chat** → Q&A interface, create/switch sessions
5. **Cross-linking**: Graph nodes link to documents, chat references link to concepts

## Integration Points

### Document Processing Pipeline
```
Upload → Store in Convex → Trigger action → Claude API → Extract concepts → Store relationships → Update graph
```

### Real-time Updates
```
Convex subscriptions → React components → Auto-refresh graph/chat/documents
```

### AI Context Flow
```
User question → Gather relevant concepts/documents → Build context → Claude API → Stream response → Store in chat
```

### Graph Interactivity
```
Click node → Show concept details → List related documents → Option to chat about concept
```

### Cross-Feature Integration
- **Documents ↔ Graph**: Document processing creates graph nodes
- **Graph ↔ Chat**: Clicking graph nodes suggests related questions
- **Chat ↔ Documents**: Chat responses reference source documents
- **All ↔ Real-time**: Convex subscriptions keep everything synchronized

## Success Metrics
- **Upload Speed**: Documents processed within 30 seconds
- **Graph Quality**: 80%+ of concepts accurately extracted
- **Query Accuracy**: Natural language answers reference correct concepts
- **Real-time UX**: Updates appear within 2 seconds across all clients