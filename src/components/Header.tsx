import React from 'react';

interface HeaderProps {
  onClearAll: () => void;
  onScrollTo: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onClearAll, onScrollTo }) => {
  return (
    <header className="bg-brand-dark text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-slate-900 text-xl shadow-md">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white font-en">MK SYSTEM</h1>
            <p className="text-[10px] text-slate-400">إدارة البضاعة ببساطة</p>
          </div>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg transition flex items-center gap-1.5 border border-red-500/30 cursor-pointer"
        >
          <i className="fa-solid fa-trash-can"></i>
          <span>تصفير</span>
        </button>
      </div>

      {/* اختصارات سريعة */}
      <div className="bg-slate-800 border-t border-slate-700 p-2">
        <div className="max-w-3xl mx-auto flex gap-2">
          <button
            onClick={() => onScrollTo('sectionAdd')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-down text-emerald-400"></i> دخول بضاعة
          </button>
          <button
            onClick={() => onScrollTo('sectionWithdraw')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-up text-brand-accent"></i> بيع أو سحب
          </button>
        </div>
      </div>
    </header>
  );
};
