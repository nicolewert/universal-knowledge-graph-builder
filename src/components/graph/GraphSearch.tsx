import React, { useCallback, useRef, forwardRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export interface GraphSearchProps {
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
  placeholder?: string;
}

export const GraphSearch = forwardRef<HTMLInputElement, GraphSearchProps>(({ 
  searchQuery,
  onSearchChange,
  placeholder = "Search concepts..."
}, ref) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    
    // Update input immediately for responsive UI
    e.target.value = value;
  }, [onSearchChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input 
        ref={ref}
        type="search"
        placeholder={placeholder}
        defaultValue={searchQuery}
        onChange={handleSearchChange}
        className="pl-9"
        aria-label="Search knowledge graph concepts"
      />
    </div>
  );
});

GraphSearch.displayName = 'GraphSearch';

export default GraphSearch;