
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Home, LayoutGrid, Flag, Clock, Target } from 'lucide-react';

interface NavMenuProps {
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => void;
  currentPage: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills';
}

export const NavMenu: React.FC<NavMenuProps> = ({ onNavigate, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => {
    onNavigate(page);
    setIsOpen(false);
  };

  const itemClass = (page: string) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors w-full text-left ${
      currentPage === page 
        ? 'bg-emerald-600/10 text-emerald-400 border-l-2 border-emerald-500' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'
    }`;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        title="Menu"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="py-2">
            <button onClick={() => handleNav('home')} className={itemClass('home')}>
              <Home size={16} />
              Homepage
            </button>
            <button onClick={() => handleNav('builder')} className={itemClass('builder')}>
              <LayoutGrid size={16} />
              Lineup Builder
            </button>
            <button onClick={() => handleNav('setpieces')} className={itemClass('setpieces')}>
              <Flag size={16} />
              Set Pieces
            </button>
            <button onClick={() => handleNav('drills')} className={itemClass('drills')}>
              <Target size={16} />
              Drills
            </button>
            <button onClick={() => handleNav('minutes')} className={itemClass('minutes')}>
              <Clock size={16} />
              Minutes Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
