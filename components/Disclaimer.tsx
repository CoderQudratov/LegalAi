import React, { useState, useEffect } from 'react';
import { Icons, DISCLAIMER_TEXT } from '../constants';

const Disclaimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('legalai_disclaimer_accepted');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('legalai_disclaimer_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in border-t-4 border-amber-500">
        <div className="flex items-center gap-3 text-amber-600 mb-4">
          <Icons.Warning />
          <h2 className="text-xl font-bold">Muhim Ogohlantirish</h2>
        </div>
        
        <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
          {DISCLAIMER_TEXT}
        </p>

        <button
          onClick={handleAccept}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Tushundim va Qabul qilaman
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;