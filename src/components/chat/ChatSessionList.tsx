"use client"

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';

interface ChatSessionListProps {
  userId: Id<"users">;
  activeSessionId: Id<"chat_sessions"> | undefined;
  onSelectSession: (sessionId: Id<"chat_sessions">) => void;
}

export function ChatSessionList({ 
  userId, 
  activeSessionId, 
  onSelectSession 
}: ChatSessionListProps) {
  const sessions = useQuery(api.chat.getChatSessions, { userId });
  const createSession = useMutation(api.chat.createChatSession);
  const deleteSession = useMutation(api.chat.deleteSession);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    setError(null);
    try {
      const newSessionId = await createSession({
        user_id: userId,
        title: `New Chat ${new Date().toLocaleTimeString()}`
      });
      onSelectSession(newSessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: Id<"chat_sessions">, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSession({ session_id: sessionId });
      if (activeSessionId === sessionId) {
        // Select another session if available
        const remainingSessions = sessions?.filter(s => s._id !== sessionId);
        if (remainingSessions && remainingSessions.length > 0) {
          onSelectSession(remainingSessions[0]._id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (sessions === undefined) {
    return (
      <div className="w-80 border-r border-border bg-background p-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Chat Sessions</h2>
        
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleCreateSession} 
          disabled={isCreatingSession}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreatingSession ? 'Creating...' : 'New Chat'}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions === null || sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Create your first chat to get started</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card 
              key={session._id}
              className={`cursor-pointer hover:bg-accent transition-colors ${
                activeSessionId === session._id ? 'bg-accent border-primary' : ''
              }`}
              onClick={() => onSelectSession(session._id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium truncate flex-1 mr-2">
                    {session.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => handleDeleteSession(session._id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {formatTime(session.created_timestamp)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}