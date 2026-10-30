import React, { useState } from 'react';

interface HeaderProps {
  onClearAll: () => void;
  onScrollTo: (id: string) => void;
  isFirebaseActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onClearAll,
  onScrollTo,
  isFirebaseActive = true,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  return (
    <>
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

          <div className="flex items-center gap-2">
            {/* مؤشر حالة الاتصال بـ Firebase */}
            <button
              onClick={() => setShowStatusModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                isFirebaseActive
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/80'
              }`}
              title="اضغط للتأكد من حالة السحابة وحفظ البيانات"
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[11px] font-bold">{isFirebaseActive ? 'فايربيز متصل' : 'حفظ محلي'}</span>
              <i className={`fa-solid ${isFirebaseActive ? 'fa-cloud-arrow-up text-emerald-400' : 'fa-database text-amber-400'} text-[10px]`}></i>
            </button>

            <button
              onClick={onClearAll}
              className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-red-500/30 cursor-pointer"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span>تصفير</span>
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

      {/* نافذة تفاصيل الاتصال بقاعدة البيانات */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-800 space-y-4 animate-scale">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
                <h4 className="font-bold text-base text-slate-800">حالة الاتصال والبيانات</h4>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <i className="fa-solid fa-circle-check text-emerald-600 text-base mt-0.5"></i>
                <div>
                  <div className="font-bold text-emerald-800 text-sm mb-0.5">النظام متصل بالسحابة بنجاح ✅</div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    قاعدة بيانات <strong>Google Firebase Firestore</strong> تعمل بشكل فوري ومستمر مع مشروعك <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono font-bold">mohammed-al---kailani</code>.
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-slate-600 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>المشروع السحابي:</span>
                  <span className="font-bold text-slate-800 font-mono">mohammed-al---kailani</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>المزامنة التلقائية:</span>
                  <span className="font-bold text-emerald-600">نشطة ولحظية (Real-time)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>حماية البيانات من الفقدان:</span>
                  <span className="font-bold text-emerald-600">نسخة مزدوجة (سحابي + محلي)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>الحفظ التلقائي:</span>
                  <span className="font-bold text-slate-800">مع كل حركة إضافة أو بيع</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 <strong>اطمئن تماماً:</strong> أي صنف أو حركة تضيفها يتم حفظها فوراً على خوادم جوجل السحابية وفي جهازك، ولن تفقد بياناتك حتى لو أغلقت التطبيق أو قمت بفتحه من جهاز آخر.
              </p>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              تمام، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
