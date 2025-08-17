"use client"

import React, { useRef, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContextDisplay } from "./ContextDisplay";
import { UserIcon, BotIcon, AlertCircle } from 'lucide-react';

interface MessageListProps {
  sessionId: Id<"chat_sessions">;
}

export function MessageList({ sessionId }: MessageListProps) {
  const messages = useQuery(api.chat.getChatMessages, { sessionId });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages === undefined) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        {[1, 2, 3].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  
  if (messages === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load messages. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-muted-foreground">
        <p>Start a conversation by sending a message below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message._id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageItem({ message }: { message: any }) {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex items-start space-x-3 ${
        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      }`}
    >
      <Avatar className="flex-shrink-0">
        <AvatarImage src={isUser ? '/user-avatar.png' : '/ai-avatar.png'} />
        <AvatarFallback>
          {isUser ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <BotIcon className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 max-w-[85%] min-w-0">
        <Card 
          className={`p-4 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content || 'Message content unavailable'}
          </div>
        </Card>
        {!isUser && (message.contextConcepts?.length > 0 || message.contextDocuments?.length > 0) && (
          <div className="mt-2">
            <ContextDisplay 
              concepts={message.contextConcepts || []}
              documents={message.contextDocuments || []}
            />
          </div>
        )}
      </div>
    </div>
  );
}