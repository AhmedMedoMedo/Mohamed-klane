import React, { useState, useMemo } from 'react';
import { WithdrawalLog } from '../firebase';
import { formatMoney } from '../utils/formatters';

interface SalesLogSectionProps {
  logs: WithdrawalLog[];
  onDeleteLog?: (log: WithdrawalLog) => void;
  activeDateLabel?: string;
}

export const SalesLogSection: React.FC<SalesLogSectionProps> = ({
  logs,
  onDeleteLog,
  activeDateLabel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return logs;

    return logs.filter((log) => {
      const itemNameMatch = (log.itemName || '').toLowerCase().includes(query);
      const noteMatch = (log.note || '').toLowerCase().includes(query);
      return itemNameMatch || noteMatch;
    });
  }, [logs, searchQuery]);

  // إجماليات سريعة للسجل المعروض
  const summary = useMemo(() => {
    return filteredLogs.reduce(
      (acc, l) => ({
        income: acc.income + Number(l.incomeValue || 0),
        profit: acc.profit + Number(l.profit || 0),
      }),
      { income: 0, profit: 0 }
    );
  }, [filteredLogs]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl soft-shadow border border-slate-200/70 dark:border-slate-800 overflow-hidden mb-6 animate-fade">
      {/* رأس قسم سجل المسحوبات */}
      <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <i className="fa-solid fa-clipboard-list text-xs"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">سجل المسحوبات</h3>
            {activeDateLabel && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                الفترة: {activeDateLabel}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-bold">
          {filteredLogs.length} حركة
        </span>
      </div>

      {/* شريط البحث وملخص السجل */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-3 text-slate-400 dark:text-slate-500"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في سجل المسحوبات (باسم البضاعة أو الملاحظات)..."
            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pr-10 pl-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-accent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
              title="مسح البحث"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* ملخص سريع للحركات المعروضة */}
        {filteredLogs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">إجمالي الدخل:</span>
              <span className="font-en font-black text-sm text-emerald-700 dark:text-emerald-400">
                +{formatMoney(summary.income)}
              </span>
            </div>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">صافي المكسب:</span>
              <span className="font-en font-black text-sm text-indigo-700 dark:text-indigo-400">
                +{formatMoney(summary.profit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* قائمة بطاقات الحركات المطورة */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/40 max-h-[600px] overflow-y-auto space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <i className="fa-solid fa-receipt text-3xl mb-2 block text-slate-300 dark:text-slate-700"></i>
            مفيش أي مسحوبات متسجلة في الفترة أو البحث ده
          </div>
        ) : (
          filteredLogs.map((log) => (
            <article
              key={log.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 hover:border-amber-200 dark:hover:border-slate-700 transition shadow-2xs hover:shadow-md animate-fade"
            >
              {/* الصف العلوي: اسم الصنف + الكمية المسحوبة + زر الحذف */}
              <div className="flex justify-between items-start gap-2 mb-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                      {log.itemName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                        <i className="fa-solid fa-cubes text-[9px]"></i>
                        {log.withdrawTypeLabel}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[10px]"></i>
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {onDeleteLog && (
                  <button
                    type="button"
                    onClick={() => onDeleteLog(log)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 p-2 rounded-xl transition cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 shrink-0"
                    title="حذف الحركة من سجل المسحوبات"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                )}
              </div>

              {/* شبكة تفاصيل السعر والتكلفة والمكسب */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                    قيمة البيع
                  </div>
                  <div className="font-en font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    +{formatMoney(log.incomeValue)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-2 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                    التكلفة
                  </div>
                  <div className="font-en font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {formatMoney(log.costValue)}
                  </div>
                </div>

                <div className="bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-2 text-center">
                  <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-0.5">
                    صافي المكسب
                  </div>
                  <div className="font-en font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-300">
                    +{formatMoney(log.profit)}
                  </div>
                </div>
              </div>

              {/* الملاحظات */}
              {log.note && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 bg-slate-100/80 dark:bg-slate-800/70 p-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5">
                  <i className="fa-solid fa-note-sticky text-slate-400 dark:text-slate-500"></i>
                  <span>{log.note}</span>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
};
