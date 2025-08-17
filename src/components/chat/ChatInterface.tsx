"use client"

import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatSessionList } from './ChatSessionList';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ChatInterface() {
  // Get the current user's ID (replace with actual authentication logic)
  const user = useQuery(api.users.getCurrentUser);
  const [activeSessionId, setActiveSessionId] = useState<Id<"chat_sessions"> | undefined>();
  const [error, setError] = useState<string | null>(null);
  const createSession = useMutation(api.chat.createChatSession);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Handle case where no users exist
  const createDemoUser = useMutation(api.users.createDemoUser);
  
  const handleCreateDemoUser = async () => {
    try {
      await createDemoUser();
      // The user query will automatically update
    } catch (error) {
      console.error('Failed to create demo user:', error);
      setError('Failed to create demo user');
    }
  };
  
  // If no user exists, offer to create demo user
  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to Knowledge Chat</h2>
          <p className="text-muted-foreground">No users found. Create a demo user to get started.</p>
          
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button onClick={handleCreateDemoUser} size="lg">
            Create Demo User
          </Button>
        </div>
      </div>
    );
  }

  // Loading state for user
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  // Create a new session if no active session exists
  const handleCreateFirstSession = async () => {
    if (!user) return;
    
    setIsCreatingSession(true);
    setError(null);
    
    try {
      const newSessionId = await createSession({ 
        user_id: user._id, 
        title: 'New Chat' 
      });
      setActiveSessionId(newSessionId);
    } catch (err: any) {
      console.error('Failed to create chat session:', err);
      setError(err.message || 'Failed to create chat session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // If no active session, prompt to create one
  if (!activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to Knowledge Chat</h2>
          <p className="text-muted-foreground">Start a conversation to explore your knowledge graph</p>
          
          <Button 
            onClick={handleCreateFirstSession}
            disabled={isCreatingSession}
            size="lg"
          >
            {isCreatingSession ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Start a New Chat'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar with chat sessions */}
      <ErrorBoundary>
        <ChatSessionList 
          userId={user._id}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
        />
      </ErrorBoundary>

      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {/* Message list */}
        <ErrorBoundary>
          <MessageList sessionId={activeSessionId} />
        </ErrorBoundary>

        {/* Message input */}
        <div className="p-4 border-t">
          <ErrorBoundary>
            <MessageInput 
              sessionId={activeSessionId} 
              onMessageSent={() => {
                // Optional: Implement any post-message-sent logic
              }} 
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Something went wrong with this component. Please refresh the page.
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary>Error details</summary>
                  <pre className="text-xs mt-1">{this.state.error.message}</pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}