import { Id } from "../../../convex/_generated/dataModel";

export interface ChatMessage {
  id: Id<"chat_messages">;
  sessionId: Id<"chat_sessions">;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  context?: ContextItem[];
}

export interface ChatSession {
  id: Id<"chat_sessions">;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  lastMessageAt?: number;
}

export interface ContextItem {
  type: 'concept' | 'document';
  id: string;
  title: string;
  summary?: string;
  link?: string;
}

export interface ChatContextProps {
  context?: ContextItem[];
}