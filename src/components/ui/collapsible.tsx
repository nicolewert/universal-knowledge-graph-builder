import React, { useState } from 'react';

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleToggle = () => {
    if (onOpenChange) {
      onOpenChange(!isOpen);
    } else {
      setInternalOpen(!isOpen);
    }
  };

  return (
    <div data-open={isOpen} data-toggle={handleToggle}>
      {children}
    </div>
  );
}

export function CollapsibleTrigger({ 
  children, 
  onClick, 
  className = '' 
}: CollapsibleTriggerProps) {
  return (
    <button onClick={onClick} className={`cursor-pointer ${className}`}>
      {children}
    </button>
  );
}

export function CollapsibleContent({ 
  children, 
  className = '' 
}: CollapsibleContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}