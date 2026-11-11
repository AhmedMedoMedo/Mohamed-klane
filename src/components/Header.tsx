import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { formatArabicDateTime } from '../utils/formatters';

interface HeaderProps {
  onClearAll: () => void;
  onScrollTo: (id: string) => void;
  isFirebaseActive?: boolean;
  isOnline?: boolean;
  pendingSyncCount?: number;
  isSyncing?: boolean;
  onTriggerSync?: () => void;
  lastSyncTime?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onClearAll,
  onScrollTo,
  isFirebaseActive = true,
  isOnline = true,
  pendingSyncCount = 0,
  isSyncing = false,
  onTriggerSync,
  lastSyncTime = 0,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Status configuration
  let statusBadgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80';
  let statusDotClass = 'bg-emerald-400 animate-pulse';
  let statusLabel = 'فايربيز متصل ومزامن';
  let statusIcon = 'fa-cloud-arrow-up text-emerald-400';

  if (!isOnline) {
    statusBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90';
    statusDotClass = 'bg-amber-400';
    statusLabel = pendingSyncCount > 0 ? `أوفلاين (${pendingSyncCount} محفوظ)` : 'أوفلاين (بدون نت)';
    statusIcon = 'fa-hard-drive text-amber-400';
  } else if (isSyncing) {
    statusBadgeClass = 'bg-blue-950/80 text-blue-300 border-blue-500/50 hover:bg-blue-900/90';
    statusDotClass = 'bg-blue-400 animate-ping';
    statusLabel = 'جاري المزامنة...';
    statusIcon = 'fa-rotate animate-spin text-blue-400';
  } else if (pendingSyncCount > 0) {
    statusBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90';
    statusDotClass = 'bg-amber-400 animate-bounce';
    statusLabel = `بانتظار الرفع (${pendingSyncCount})`;
    statusIcon = 'fa-cloud-arrow-up text-amber-400';
  } else if (!isFirebaseActive) {
    statusBadgeClass = 'bg-slate-800 text-slate-300 border-slate-600';
    statusDotClass = 'bg-slate-400';
    statusLabel = 'حفظ محلي فقط';
    statusIcon = 'fa-database text-slate-400';
  }

  return (
    <>
      <header className="bg-brand-dark text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-slate-900 text-xl shadow-md">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white font-en">MK SYSTEM</h1>
              <p className="text-[10px] text-slate-400">إدارة البضاعة والمخزن</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* زر تثبيت التطبيق PWA */}
            <PWAInstallButton />

            {/* مؤشر حالة الاتصال والمزامنة السحابية */}
            <button
              onClick={() => setShowStatusModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${statusBadgeClass}`}
              title="اضغط للتأكد من حالة السحابة والتخزين بدون إنترنت"
            >
              <span className={`w-2 h-2 rounded-full ${statusDotClass}`}></span>
              <span className="text-[11px] font-bold">{statusLabel}</span>
              <i className={`fa-solid ${statusIcon} text-[10px]`}></i>
            </button>

            <button
              onClick={onClearAll}
              className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-red-500/30 cursor-pointer"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span className="hidden sm:inline">تصفير</span>
            </button>
          </div>
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

      {/* نافذة تفاصيل الاتصال والمزامنة السحابية والتخزين بدون إنترنت */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-800 space-y-4 animate-scale">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-brand-primary">
                <i className="fa-solid fa-cloud-arrow-up text-xl text-blue-600"></i>
                <h4 className="font-bold text-base text-slate-800">حالة السحابة والعمل بدون إنترنت</h4>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* شريط حالة الإنترنت الفعلي */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <i className={`fa-solid ${isOnline ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-amber-600'} text-base mt-0.5`}></i>
                <div>
                  <div className="font-bold text-sm mb-0.5">
                    {isOnline ? 'الاتصال بالإنترنت متوفر ✅' : 'أنت في وضع عدم الاتصال (أوفلاين) 📴'}
                  </div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    {isOnline
                      ? 'النظام متصل بالسحابة وتتم المزامنة بشكل فوري وتلقائي مع فايربيز.'
                      : 'يمكنك العمل وإضافة البضاعة والبيع طبيعياً بدون إنترنت، وجميع حركاتك محفوظة محلياً.'}
                  </div>
                </div>
              </div>

              {/* تفاصيل المزامنة */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-slate-600 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>المشروع السحابي:</span>
                  <span className="font-bold text-slate-800 font-mono">mohammed-al---kailani</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>التخزين المحلي المستمر:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <i className="fa-solid fa-check text-[10px]"></i> مفعل (IndexedDB + Storage)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>حركات تنتظر المزامنة بالسحابة:</span>
                  <span className={`font-bold font-en ${pendingSyncCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {pendingSyncCount > 0 ? `${pendingSyncCount} حركة محفوظة محلياً` : 'لا يوجد (كل شيء متزامن)'}
                  </span>
                </div>
                {lastSyncTime > 0 && (
                  <div className="flex items-center justify-between py-1">
                    <span>آخر مزامنة ناجحة:</span>
                    <span className="font-bold text-slate-700 font-en">
                      {formatArabicDateTime(lastSyncTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* زر مزامنة يدوي فوري */}
              {onTriggerSync && (
                <button
                  onClick={() => {
                    onTriggerSync();
                  }}
                  disabled={isSyncing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <i className={`fa-solid fa-cloud-arrow-up ${isSyncing ? 'animate-bounce' : ''}`}></i>
                  <span>{isSyncing ? 'جاري المزامنة مع السحابة...' : 'مزامنة السحابة الآن يدوياً ☁️'}</span>
                </button>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                💡 <strong>ميزة المزامنة الذكية:</strong> عندما ينقطع الإنترنت، يسجل النظام كل عملية محلياً في جهازك فوراً وبدون أي تعطيل. وبمجرد عودة الاتصال، يرسل النظام كافة البيانات تلقائياً للتخزين السحابي دون تدخل منك.
              </p>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
