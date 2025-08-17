# Natural Language Q&A System Documentation

## Overview

The Natural Language Q&A System is an advanced AI-powered chat interface that leverages a knowledge graph to provide context-aware, intelligent responses. By integrating Anthropic's Claude AI with a dynamic knowledge management system, this solution offers a powerful conversational experience that adapts to user queries.

## Technical Architecture

### Core Components
- **Frontend**: React-based chat interface
- **Backend**: Convex serverless functions
- **AI Engine**: Claude 3 Sonnet
- **Knowledge Base**: Graph-based context retrieval

## API Documentation

### Convex Queries

#### `getChatSessions(userId: Id<'users'>)`
- **Purpose**: Retrieve chat sessions for a specific user
- **Returns**: Array of chat sessions sorted by timestamp
- **Access Pattern**: Uses Convex index `by_user`

#### `getChatMessages(sessionId: Id<'chat_sessions'>)`
- **Purpose**: Fetch messages for a specific chat session
- **Returns**: Enriched messages with context (concepts and documents)
- **Features**:
  - Retrieves messages in chronological order
  - Dynamically loads related concepts and documents

#### `getRelevantContext(question: string)`
- **Purpose**: Extract contextually relevant information from knowledge graph
- **Returns**: Object with `{ concepts: Concept[], documents: Document[] }`
- **Context Retrieval Strategy**:
  1. Filter top 100 concepts by confidence
  2. Match against question text
  3. Select top 5 most relevant concepts
  4. Fetch up to 3 related documents

### Convex Mutations

#### `createChatSession(userId: Id<'users'>, title: string)`
- **Purpose**: Initialize a new chat session
- **Validations**:
  - Verify user exists
  - Sanitize and validate title
  - Prevent empty or excessively long titles

#### `addChatMessage(sessionId: Id<'chat_sessions'>, ...)`
- **Purpose**: Add a message to a chat session
- **Parameters**:
  - `role`: 'user' or 'assistant'
  - `content`: Message text
  - `context_concepts`: Optional related concept IDs
  - `context_documents`: Optional related document IDs
- **Features**:
  - Input sanitization
  - Length validation
  - Automatic session timestamp update

### Convex Actions

#### `generateAnswer(question: string, sessionId: Id<'chat_sessions'>)`
- **Purpose**: Generate AI-powered response with knowledge graph context
- **Key Steps**:
  1. Validate input
  2. Apply rate limiting
  3. Retrieve relevant context
  4. Call Claude API
  5. Store response with contextual metadata
- **Error Handling**:
  - Graceful error messages
  - Detailed logging
  - User-friendly feedback

## Frontend Components

### `ChatInterface`
- **Responsibilities**:
  - User authentication
  - Session management
  - Rendering chat layout
- **Key Features**:
  - Dynamic demo user creation
  - Error handling
  - Responsive design

### `MessageList`
- **Purpose**: Display chat messages
- **Features**:
  - Real-time updates
  - Context visualization
  - Scroll management

### `MessageInput`
- **Purpose**: Handle user message submission
- **Features**:
  - Input validation
  - Submission state management
  - Error handling

## Advanced Features

### Context-Aware AI Responses
- Dynamically retrieve relevant concepts and documents
- Augment Claude's response with contextual information
- Improve answer accuracy and relevance

### Rate Limiting
- Prevent abuse with session-based request throttling
- Configurable limits (default: 10 requests per minute)

### Error Resilience
- Comprehensive error handling
- Graceful degradation
- Detailed logging for debugging

## Performance Optimizations

- Parallel document fetching
- In-memory rate limiting
- Timeout management for AI API calls
- Efficient Convex indexing

## Security Measures

- Input sanitization
- Length restrictions
- Environment-based error masking
- Secure API key management

## Setup and Configuration

### Prerequisites
- Node.js 18+
- Convex account
- Anthropic API key

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_claude_api_key
```

### Installation
```bash
# Install dependencies
pnpm install

# Set up Convex project
pnpm setup-convex

# Start development server
pnpm dev
```

## Hackathon Judging Highlights

1. **Innovation**: Context-aware AI chat system
2. **Technical Complexity**: Multi-layered architecture
3. **Scalability**: Serverless design with Convex
4. **AI Integration**: Claude 3 Sonnet for intelligent responses
5. **Performance**: Optimized context retrieval

## Future Roadmap
- Implement persistent rate limiting
- Add advanced context weighting
- Support multiple knowledge graph sources
- Enhance AI prompt engineering
- Implement user feedback mechanism

## Troubleshooting

1. **No User Found**: Use "Create Demo User" button
2. **Slow Responses**: Check network connection
3. **High Traffic**: Wait and retry

## License
MIT License - Open for hackathon and further development

---

**Built with ❤️ for Innovative Problem Solving**