import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  onSearch: () => void;
  onToggleFilters: () => void;
  onResetView: () => void;
  onToggleMinimap: () => void;
  onFocusSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow Escape to blur input elements
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    switch (event.key.toLowerCase()) {
      case '/':
        event.preventDefault();
        shortcuts.onFocusSearch();
        break;
      
      case 'f':
        if (isCtrl) {
          event.preventDefault();
          shortcuts.onFocusSearch();
        } else if (!isCtrl && !isShift) {
          event.preventDefault();
          shortcuts.onToggleFilters();
        }
        break;
      
      case 'r':
        if (isCtrl) {
          event.preventDefault();
          shortcuts.onResetView();
        }
        break;
      
      case 'm':
        if (!isCtrl && !isShift) {
          event.preventDefault();
          shortcuts.onToggleMinimap();
        }
        break;
      
      case '=':
      case '+':
        if (isCtrl) {
          event.preventDefault();
          shortcuts.onZoomIn();
        }
        break;
      
      case '-':
        if (isCtrl) {
          event.preventDefault();
          shortcuts.onZoomOut();
        }
        break;
      
      case '0':
        if (isCtrl) {
          event.preventDefault();
          shortcuts.onFitToView();
        }
        break;
      
      case 'escape':
        // General escape - can be used to close modals, clear search, etc.
        shortcuts.onSearch?.();
        break;
      
      default:
        break;
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    getShortcutsHelp: () => [
      { key: '/', description: 'Focus search input' },
      { key: 'Ctrl/Cmd + F', description: 'Focus search input' },
      { key: 'F', description: 'Toggle filters panel' },
      { key: 'M', description: 'Toggle minimap' },
      { key: 'Ctrl/Cmd + R', description: 'Reset graph view' },
      { key: 'Ctrl/Cmd + +', description: 'Zoom in' },
      { key: 'Ctrl/Cmd + -', description: 'Zoom out' },
      { key: 'Ctrl/Cmd + 0', description: 'Fit graph to view' },
      { key: 'Escape', description: 'Clear search/close panels' },
    ]
  };
};