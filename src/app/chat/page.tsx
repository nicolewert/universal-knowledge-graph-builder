"use client"

import { ChatInterface } from "@/components/chat/ChatInterface"

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Natural Language Q&A System
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ask questions about your knowledge graph and get intelligent, context-aware responses 
            powered by Claude AI and your document collection.
          </p>
        </div>
        
        <ChatInterface />
      </div>
    </div>
  )
}