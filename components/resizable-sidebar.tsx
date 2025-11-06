'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizableSidebarProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right'; // Which side the resize handle is on
  storageKey?: string; // Custom localStorage key
}

export function ResizableSidebar({ 
  children, 
  defaultWidth = 256, 
  minWidth = 200, 
  maxWidth = 500,
  side = 'left',
  storageKey = 'resizable-sidebar-width'
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, [storageKey]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth;
      if (side === 'left') {
        // For left sidebar, width is based on mouse X position
        newWidth = e.clientX;
      } else {
        // For right sidebar, width is based on distance from right edge
        newWidth = window.innerWidth - e.clientX;
      }
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        localStorage.setItem(storageKey, newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, side, storageKey]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handlePosition = side === 'left' ? 'right-0' : 'left-0';
  const handleMargin = side === 'left' ? { marginRight: '-8px' } : { marginLeft: '-8px' };

  return (
    <div 
      ref={sidebarRef}
      className="relative flex-shrink-0 h-full"
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize Handle - Wider hit area */}
      <div
        className={`absolute top-0 ${handlePosition} w-4 h-full cursor-col-resize z-50 flex items-center justify-center`}
        onMouseDown={handleMouseDown}
        style={handleMargin}
      >
        {/* Visual indicator */}
        <div className="w-1 h-full bg-border hover:bg-primary transition-colors" />
      </div>
    </div>
  );
}

