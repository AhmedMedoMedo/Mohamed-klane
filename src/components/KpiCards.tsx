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
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalCartons,
  totalUnits,
  totalAllPieces,
  totalCost,
  totalSellValue,
  realizedProfit,
  totalIncome,
}) => {
  const expectedProfit = totalSellValue - totalCost;
  const formattedCartons = Number.isInteger(totalCartons)
    ? totalCartons
    : totalCartons.toFixed(2);

  return (
    <section className="grid grid-cols-2 gap-3 animate-fade">
      {/* إجمالي الكراتين */}
      <div className="bg-white rounded-2xl p-4 soft-shadow border-r-4 border-brand-primary flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">إجمالي الكراتين</div>
          <div className="text-xl font-black text-slate-800 font-en">
            {formattedCartons}{' '}
            <span className="text-[11px] font-sans font-bold text-slate-400">كرتونة</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[10px]">
          <div className="text-slate-500 flex items-center justify-between">
            <span>قطع فرط مسجلة:</span>
            <span className="font-bold text-slate-700 font-en">
              {totalUnits} <span className="font-normal font-sans text-slate-400">قطعة</span>
            </span>
          </div>
          <div className="bg-blue-50/80 text-brand-primary px-1.5 py-0.5 rounded border border-blue-100/80 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-cubes text-[9px]"></i>
              <span>إجمالي قطع المخزن:</span>
            </span>
            <span className="font-black font-en text-brand-primary">
              {totalAllPieces.toLocaleString('en-US')}{' '}
              <span className="font-normal font-sans text-[9px]">قطعة</span>
            </span>
          </div>
        </div>
      </div>

      {/* فلوس البضاعة */}
      <div className="bg-white rounded-2xl p-4 soft-shadow border-r-4 border-amber-500">
        <div className="text-[10px] font-bold text-slate-500 mb-1">فلوس البضاعة (التكلفة)</div>
        <div className="text-xl font-black text-amber-600 font-en">{formatMoney(totalCost)}</div>
      </div>

      {/* لو بعنا كله هيجيب */}
      <div className="bg-white rounded-2xl p-4 soft-shadow border-r-4 border-indigo-500">
        <div className="text-[10px] font-bold text-slate-500 mb-1">لو بعنا كله هيجيب</div>
        <div className="text-xl font-black text-indigo-600 font-en">{formatMoney(totalSellValue)}</div>
        <div className="text-[10px] text-slate-400 mt-1">
          المكسب المتوقع: <span className="font-bold text-indigo-500 font-en">{formatMoney(expectedProfit)}</span>
        </div>
      </div>

      {/* المكسب الفعلي */}
      <div className="bg-brand-dark text-white rounded-2xl p-4 soft-shadow border-r-4 border-emerald-400 relative overflow-hidden">
        <i className="fa-solid fa-coins absolute left-[-10px] bottom-[-10px] text-5xl text-white/5"></i>
        <div className="text-[10px] font-bold text-emerald-300 mb-1">المكسب الفعلي (اللي اتباع)</div>
        <div className="text-xl font-black text-white font-en relative z-10">{formatMoney(realizedProfit)}</div>
        <div className="text-[10px] text-slate-300 mt-1 relative z-10">
          إجمالي الدخل: <span className="font-bold text-emerald-400 font-en">{formatMoney(totalIncome)}</span>
        </div>
      </div>
    </section>
  );
};
