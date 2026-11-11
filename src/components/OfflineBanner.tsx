import React from 'react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingSyncCount,
  isSyncing,
  onTriggerSync,
}) => {
  // If online and nothing is syncing or pending, keep the screen clean
  if (isOnline && !isSyncing && pendingSyncCount === 0) {
    return null;
  }

  // If syncing pending changes right now
  if (isSyncing) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md animate-fade">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-cloud-arrow-up animate-bounce"></i>
          <span>جاري إرسال ومزامنة {pendingSyncCount} حركة إلى التخزين السحابي...</span>
        </div>
        <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded font-en">Syncing...</span>
      </div>
    );
  }

  // If online but there are still items pending in queue
  if (isOnline && pendingSyncCount > 0) {
    return (
      <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md animate-fade">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-rotate animate-spin text-amber-200"></i>
          <span>تمت استعادة النت! يوجد {pendingSyncCount} حركة بانتظار المزامنة للسحابة.</span>
        </div>
        <button
          onClick={onTriggerSync}
          className="bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
        >
          مزامنة الآن ☁️
        </button>
      </div>
    );
  }

  // Offline mode
  return (
    <div className="bg-slate-900 border-b border-amber-500/40 text-amber-300 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-fade">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-white">أنت تعمل الآن بدون إنترنت (أوفلاين)</span>
          <span className="text-amber-300/90 text-[11px] font-normal">
            — كل الحركات والبضاعة تُسجل محلياً بأمان، وتُرفع تلقائياً للسحابة عند عودة النت.
          </span>
        </div>
      </div>
      {pendingSyncCount > 0 && (
        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-200 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
          {pendingSyncCount} حركة محفوظة
        </span>
      )}
    </div>
  );
};
