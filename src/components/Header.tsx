import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
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
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (!showStatusModal) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showStatusModal]);

  // Status configuration
  let statusBadgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80';
  let statusDotClass = 'bg-emerald-400 animate-pulse';
  let statusLabel = 'فايربيز متصل';
  let statusIcon = 'fa-cloud-arrow-up text-emerald-400';

  if (!isOnline) {
    statusBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90';
    statusDotClass = 'bg-amber-400';
    statusLabel = pendingSyncCount > 0 ? `أوفلاين (${pendingSyncCount})` : 'أوفلاين';
    statusIcon = 'fa-hard-drive text-amber-400';
  } else if (isSyncing) {
    statusBadgeClass = 'bg-blue-950/80 text-blue-300 border-blue-500/50 hover:bg-blue-900/90';
    statusDotClass = 'bg-blue-400 animate-ping';
    statusLabel = 'جاري المزامنة';
    statusIcon = 'fa-rotate animate-spin text-blue-400';
  } else if (pendingSyncCount > 0) {
    statusBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90';
    statusDotClass = 'bg-amber-400 animate-bounce';
    statusLabel = `معلق (${pendingSyncCount})`;
    statusIcon = 'fa-cloud-arrow-up text-amber-400';
  } else if (!isFirebaseActive) {
    statusBadgeClass = 'bg-slate-800 text-slate-300 border-slate-600';
    statusDotClass = 'bg-slate-400';
    statusLabel = 'حفظ محلي';
    statusIcon = 'fa-database text-slate-400';
  }

  return (
    <>
      <header className="bg-slate-900 dark:bg-slate-950 text-white sticky top-0 z-30 shadow-lg border-b border-slate-800 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-slate-900 text-xl shadow-md shrink-0">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div className="truncate">
              <h1 className="font-bold text-base tracking-wide text-white font-en leading-tight">MK SYSTEM</h1>
              <p className="text-[10px] text-slate-400">إدارة البضاعة والمخزن</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* زر تثبيت التطبيق PWA */}
            <PWAInstallButton />

            {/* زر الوضع الليلي / النهاري (Dark Mode Toggle) */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 dark:text-amber-300 flex items-center justify-center transition cursor-pointer shadow-xs"
              title={isDarkMode ? 'تبديل للوضع النهاري' : 'تبديل للوضع الليلي'}
              aria-label={isDarkMode ? 'تبديل للوضع النهاري' : 'تبديل للوضع الليلي'}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
            </button>

            {/* مؤشر حالة الاتصال والمزامنة السحابية */}
            <button
              onClick={() => setShowStatusModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${statusBadgeClass}`}
              title="اضغط للتأكد من حالة السحابة والتخزين بدون إنترنت"
            >
              <span className={`w-2 h-2 rounded-full ${statusDotClass}`}></span>
              <span className="text-[11px] font-bold hidden xs:inline sm:inline">{statusLabel}</span>
              <i className={`fa-solid ${statusIcon} text-[10px]`}></i>
            </button>

            <button
              onClick={onClearAll}
              className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-red-500/30 cursor-pointer"
              title="تصفير المخزن"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span className="hidden sm:inline">تصفير</span>
            </button>
          </div>
        </div>

        {/* اختصارات سريعة */}
        <div className="bg-slate-800 dark:bg-slate-900 border-t border-slate-700 dark:border-slate-800 p-2">
          <div className="max-w-4xl mx-auto flex gap-2">
            <button
              onClick={() => onScrollTo('sectionAdd')}
              className="flex-1 bg-slate-700/90 dark:bg-slate-800 hover:bg-slate-600 dark:hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition cursor-pointer border border-slate-600/30 dark:border-slate-700"
            >
              <i className="fa-solid fa-arrow-down text-emerald-400"></i> دخول بضاعة
            </button>
            <button
              onClick={() => onScrollTo('sectionWithdraw')}
              className="flex-1 bg-slate-700/90 dark:bg-slate-800 hover:bg-slate-600 dark:hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition cursor-pointer border border-slate-600/30 dark:border-slate-700"
            >
              <i className="fa-solid fa-arrow-up text-brand-accent"></i> بيع أو سحب
            </button>
          </div>
        </div>
      </header>

      {/* نافذة تفاصيل الاتصال والمزامنة السحابية والتخزين بدون إنترنت */}
      {showStatusModal &&
        createPortal(
          <div
            onClick={() => setShowStatusModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl max-h-[90vh] overflow-y-auto w-[95%] max-w-md p-5 shadow-2xl text-slate-800 dark:text-slate-100 space-y-4 animate-fade"
            >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-brand-primary">
                <i className="fa-solid fa-cloud-arrow-up text-xl text-blue-600 dark:text-blue-400"></i>
                <h4 className="font-bold text-base text-slate-800 dark:text-white">حالة السحابة والعمل بدون إنترنت</h4>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* شريط حالة الإنترنت الفعلي */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              }`}>
                <i className={`fa-solid ${isOnline ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-triangle-exclamation text-amber-600 dark:text-amber-400'} text-base mt-0.5`}></i>
                <div>
                  <div className="font-bold text-sm mb-0.5">
                    {isOnline ? 'الاتصال بالإنترنت متوفر ✅' : 'أنت في وضع عدم الاتصال (أوفلاين) 📴'}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {isOnline
                      ? 'النظام متصل بالسحابة وتتم المزامنة بشكل فوري وتلقائي مع فايربيز.'
                      : 'يمكنك العمل وإضافة البضاعة والبيع طبيعياً بدون إنترنت، وجميع حركاتك محفوظة محلياً.'}
                  </div>
                </div>
              </div>

              {/* تفاصيل المزامنة */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span>المشروع السحابي:</span>
                  <span className="font-bold text-slate-800 dark:text-white font-mono">mohammed-al---kailani</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span>التخزين المحلي المستمر:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <i className="fa-solid fa-check text-[10px]"></i> مفعل (IndexedDB + Storage)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span>حركات تنتظر المزامنة بالسحابة:</span>
                  <span className={`font-bold font-en ${pendingSyncCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                    {pendingSyncCount > 0 ? `${pendingSyncCount} حركة محفوظة محلياً` : 'لا يوجد (كل شيء متزامن)'}
                  </span>
                </div>
                {lastSyncTime > 0 && (
                  <div className="flex items-center justify-between py-1">
                    <span>آخر مزامنة ناجحة:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 font-en">
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

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                💡 <strong>ميزة المزامنة الذكية:</strong> عندما ينقطع الإنترنت، يسجل النظام كل عملية محلياً في جهازك فوراً وبدون أي تعطيل. وبمجرد عودة الاتصال، يرسل النظام كافة البيانات تلقائياً للتخزين السحابي دون تدخل منك.
              </p>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>,
          document.body
        )}
    </>
  );
};
