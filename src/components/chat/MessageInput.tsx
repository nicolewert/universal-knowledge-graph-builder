"use client"

import React, { useRef, useState, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2Icon, SendIcon, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  sessionId: Id<"chat_sessions">;
  onMessageSent?: () => void;
}

export function MessageInput({ sessionId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateAnswer = useAction(api.chat.generateAnswer);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;
    
    // Clear previous errors
    setError(null);
    
    // Validate message length
    if (message.trim().length > 10000) {
      setError('Message is too long (maximum 10,000 characters)');
      return;
    }

    setIsLoading(true);
    try {
      // Generate the AI response (this handles adding both user and assistant messages)
      const result = await generateAnswer({ 
        session_id: sessionId, 
        question: message.trim() 
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to send message');
        return;
      }

      // Reset message and clear textarea
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Optional callback for parent components
      onMessageSent?.();
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [message, sessionId, generateAnswer, onMessageSent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift), allow newline with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && message.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  return (
    <div className="w-full space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            adjustTextareaHeight();
            // Clear error when user starts typing
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="pr-12 resize-none min-h-[48px] max-h-[200px]"
          disabled={isLoading}
          maxLength={10000}
        />
        
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          <span className="text-xs text-muted-foreground">
            {message.length}/10000
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || message.trim().length > 10000}
            className="h-8 w-8"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}