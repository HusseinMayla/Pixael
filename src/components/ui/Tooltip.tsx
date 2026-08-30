import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  position = 'top',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className="relative flex items-center justify-center inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-slate-100 bg-studio-900 border border-studio-700/80 rounded-md shadow-xl whitespace-nowrap pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 ${getPositionClasses()}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-studio-800 border border-studio-600/60 rounded text-slate-300">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
