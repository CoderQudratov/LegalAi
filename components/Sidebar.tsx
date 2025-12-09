import React from 'react';
import { Icons, APP_NAME } from '../constants';

const Sidebar: React.FC<{
  onClear: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}> = ({ onClear, isOpen, setIsOpen }) => {
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:w-72 flex flex-col border-r border-slate-800
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Icons.Scale />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-slate-400">Virtual Yurist</p>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Asosiy
            </p>
            <button 
              onClick={() => {
                onClear();
                if(window.innerWidth < 768) setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm group"
            >
              <Icons.Chat />
              <span className="group-hover:text-white">Yangi Chat</span>
            </button>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
             <h3 className="font-medium text-sm text-blue-400 mb-2">Eslatma</h3>
             <p className="text-xs text-slate-400 leading-relaxed">
               Ushbu tizim sun'iy intellekt asosida ishlaydi. Maslahatlarni har doim rasmiy manbalar bilan solishtiring.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-2 text-xs text-slate-500">
             <span>v1.0.0</span>
             <span>&bull;</span>
             <span>Gemini 2.5 Flash</span>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;