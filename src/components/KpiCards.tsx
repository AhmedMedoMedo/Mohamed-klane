import React from 'react';
import { formatMoney } from '../utils/formatters';

interface KpiCardsProps {
  totalCartons: number;
  totalUnits: number;
  totalAllPieces: number;
  totalCost: number;
  totalSellValue: number;
  realizedProfit: number;
  totalIncome: number;
  dateFilterLabel?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalCartons,
  totalUnits,
  totalAllPieces,
  totalCost,
  totalSellValue,
  realizedProfit,
  totalIncome,
  dateFilterLabel,
}) => {
  const expectedProfit = totalSellValue - totalCost;
  const formattedCartons = Number.isInteger(totalCartons)
    ? totalCartons
    : totalCartons.toFixed(2);

  return (
    <section className="grid grid-cols-2 gap-3 animate-fade">
      {/* إجمالي الكراتين */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 soft-shadow border border-slate-100 dark:border-slate-800 border-r-4 border-r-brand-primary dark:border-r-blue-500 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الكراتين</div>
          <div className="text-xl font-black text-slate-800 dark:text-white font-en">
            {formattedCartons}{' '}
            <span className="text-[11px] font-sans font-bold text-slate-400 dark:text-slate-500">كرتونة</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-[10px]">
          <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>قطع فرط مسجلة:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 font-en">
              {totalUnits} <span className="font-normal font-sans text-slate-400 dark:text-slate-500">قطعة</span>
            </span>
          </div>
          <div className="bg-blue-50/80 dark:bg-blue-950/50 text-brand-primary dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100/80 dark:border-blue-900/50 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-cubes text-[9px]"></i>
              <span>إجمالي قطع المخزن:</span>
            </span>
            <span className="font-black font-en text-brand-primary dark:text-blue-300">
              {totalAllPieces.toLocaleString('en-US')}{' '}
              <span className="font-normal font-sans text-[9px]">قطعة</span>
            </span>
          </div>
        </div>
      </div>

      {/* فلوس البضاعة */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 soft-shadow border border-slate-100 dark:border-slate-800 border-r-4 border-r-amber-500 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">فلوس البضاعة (التكلفة)</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-en">{formatMoney(totalCost)}</div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <i className="fa-solid fa-boxes-packing text-amber-500/70"></i>
          <span>رأس مال البضاعة الحالية</span>
        </div>
      </div>

      {/* لو بعنا كله هيجيب */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 soft-shadow border border-slate-100 dark:border-slate-800 border-r-4 border-r-indigo-500">
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">لو بعنا كله هيجيب</div>
        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-en">{formatMoney(totalSellValue)}</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
          المكسب المتوقع:{' '}
          <span className="font-bold text-indigo-500 dark:text-indigo-300 font-en">{formatMoney(expectedProfit)}</span>
        </div>
      </div>

      {/* المكسب الفعلي */}
      <div className="bg-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:to-emerald-950/60 text-white rounded-2xl p-4 soft-shadow border border-slate-800 dark:border-emerald-800/50 border-r-4 border-r-emerald-400 relative overflow-hidden">
        <i className="fa-solid fa-coins absolute left-[-10px] bottom-[-10px] text-5xl text-white/5"></i>
        <div className="flex items-center justify-between gap-1 mb-1 relative z-10">
          <span className="text-[10px] font-bold text-emerald-300">المكسب الفعلي (اللي اتباع)</span>
          {dateFilterLabel && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
              {dateFilterLabel}
            </span>
          )}
        </div>
        <div className="text-xl font-black text-white font-en relative z-10">{formatMoney(realizedProfit)}</div>
        <div className="text-[10px] text-slate-300 mt-1 relative z-10">
          إجمالي الدخل: <span className="font-bold text-emerald-400 font-en">{formatMoney(totalIncome)}</span>
        </div>
      </div>
    </section>
  );
};
