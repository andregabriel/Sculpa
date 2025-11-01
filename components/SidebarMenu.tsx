
import React from 'react';
import CloseIcon from './icons/CloseIcon';

interface Shortcut {
  id: string;
  label: string;
}

interface SidebarMenuProps {
  sections: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
  activeSectionId: string | null;
  onSectionSelect: (id: string) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ sections, isOpen, onClose, activeSectionId, onSectionSelect }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-200">
          <h2 id="sidebar-title" className="text-lg font-semibold text-indigo-600">Menu</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>
        <nav>
          <ul className="p-2">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  onClick={() => onSectionSelect(section.id)}
                  className={`w-full text-left px-4 py-3 my-1 rounded-md text-base font-medium transition-colors duration-200 ${
                    activeSectionId === section.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default SidebarMenu;
