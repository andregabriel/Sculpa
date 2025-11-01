

import React from 'react';

interface Shortcut {
  id: string;
  label: string;
}

interface ShortcutMenuProps {
  sections: Shortcut[];
  activeSectionId: string | null;
  onSectionSelect: (id: string) => void;
}

const ShortcutMenu: React.FC<ShortcutMenuProps> = ({ sections, activeSectionId, onSectionSelect }) => {

  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <ul className="flex items-center gap-1 px-4 md:px-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        {sections.map(section => (
          <li key={section.id}>
            <button
              onClick={() => onSectionSelect(section.id)}
              className={`block px-3 py-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
                activeSectionId === section.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
      {/* A simple way to hide scrollbar across browsers without extra dependencies */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { 
          display: none; 
        }
        .hide-scrollbar { 
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
};

export default ShortcutMenu;
