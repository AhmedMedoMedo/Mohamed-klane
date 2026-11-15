import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../firebase';
import {
  formatMoney,
  formatCartonBreakdown,
  parseTimestamp,
  formatArabicDateTime,
  formatArabicDateOnly,
  formatTimeAgoArabic,
} from '../utils/formatters';

interface InventorySectionProps {
  inventory: InventoryItem[];
  totalInventoryCount?: number;
  activeDateLabel?: string;
  onQuickWithdraw: (itemId: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}

export type InventorySortOption =
  | 'last_added'
  | 'newest'
  | 'highest_price'
  | 'lowest_price'
  | 'highest_qty'
  | 'lowest_qty'
  | 'oldest'
  | 'alphabetical';

export const InventorySection: React.FC<InventorySectionProps> = ({
  inventory,
  totalInventoryCount,
  activeDateLabel,
  onQuickWithdraw,
  onEditItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<InventorySortOption>('last_added');
  const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);

  // التصفية والترتيب
  const sortedAndFilteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = inventory.filter((item) =>
      (item.name || '').toLowerCase().includes(query)
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'last_added': {
          const timeA = parseTimestamp(a.lastAddedAt || a.createdAt);
          const timeB = parseTimestamp(b.lastAddedAt || b.createdAt);
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        }
        case 'newest': {
          const timeA = parseTimestamp(a.createdAt || a.lastAddedAt);
          const timeB = parseTimestamp(b.createdAt || b.lastAddedAt);
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        }
        case 'oldest': {
          const timeA = parseTimestamp(a.createdAt || a.lastAddedAt);
          const timeB = parseTimestamp(b.createdAt || b.lastAddedAt);
          if (timeA !== timeB) return timeA - timeB;
          return (a.id || '').localeCompare(b.id || '');
        }
        case 'highest_price': {
          const priceA =
            a.unitSellPrice ||
            (a.cartonSellPrice && a.unitsPerCarton ? a.cartonSellPrice / a.unitsPerCarton : 0) ||
            0;
          const priceB =
            b.unitSellPrice ||
            (b.cartonSellPrice && b.unitsPerCarton ? b.cartonSellPrice / b.unitsPerCarton : 0) ||
            0;
          return priceB - priceA;
        }
        case 'lowest_price': {
          const priceA =
            a.unitSellPrice ||
            (a.cartonSellPrice && a.unitsPerCarton ? a.cartonSellPrice / a.unitsPerCarton : 0) ||
            0;
          const priceB =
            b.unitSellPrice ||
            (b.cartonSellPrice && b.unitsPerCarton ? b.cartonSellPrice / b.unitsPerCarton : 0) ||
            0;
          return priceA - priceB;
        }
        case 'highest_qty': {
          return (b.totalUnits || 0) - (a.totalUnits || 0);
        }
        case 'lowest_qty': {
          return (a.totalUnits || 0) - (b.totalUnits || 0);
        }
        case 'alphabetical': {
          return (a.name || '').localeCompare(b.name || '', 'ar');
        }
        default:
          return 0;
      }
    });
  }, [inventory, searchQuery, sortBy]);

  // إجماليات ديناميكية للبضاعة المعروضة حالياً (تتحدث تلقائياً مع البحث)
  const inventorySummary = useMemo(() => {
    return sortedAndFilteredItems.reduce(
      (acc, item) => {
        const isOutOfStock =
          (item.totalUnits || 0) <= 0 ||
          (Number(item.cartons || 0) === 0 && Number(item.looseUnits || 0) === 0);

        if (isOutOfStock) return acc;

        const uPerCarton = Math.max(1, item.unitsPerCarton || 1);
        const itemCartons =
          item.cartons !== undefined
            ? Number(item.cartons)
            : Math.floor(item.totalUnits / uPerCarton);
        const itemLoose =
          item.looseUnits !== undefined
            ? Number(item.looseUnits)
            : item.totalUnits % uPerCarton;

        const itemCost =
          itemCartons * Number(item.cartonBuyPrice || 0) +
          itemLoose * Number(item.unitBuyPrice || 0);
        const itemSell =
          itemCartons * Number(item.cartonSellPrice || 0) +
          itemLoose * Number(item.unitSellPrice || 0);

        return {
          totalCost: acc.totalCost + itemCost,
          expectedProfit: acc.expectedProfit + (itemSell - itemCost),
        };
      },
      { totalCost: 0, expectedProfit: 0 }
    );
  }, [sortedAndFilteredItems]);

  const sortChips: { id: InventorySortOption; label: string; icon: string }[] = [
    { id: 'last_added', label: 'آخر تزويد بالمخزن', icon: 'fa-clock-rotate-left' },
    { id: 'newest', label: 'أحدث تسجيل', icon: 'fa-sparkles' },
    { id: 'highest_qty', label: 'الأكثر كمية', icon: 'fa-arrow-up-wide-short' },
    { id: 'lowest_qty', label: 'الأقل كمية', icon: 'fa-arrow-down-short-wide' },
    { id: 'highest_price', label: 'الأعلى سعراً', icon: 'fa-arrow-trend-up' },
    { id: 'lowest_price', label: 'الأرخص سعراً', icon: 'fa-arrow-trend-down' },
    { id: 'oldest', label: 'الأقدم', icon: 'fa-calendar-days' },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl soft-shadow border border-slate-200/70 dark:border-slate-800 overflow-hidden animate-fade">
      {/* رأس قسم الجرد */}
      <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-brand-primary dark:text-blue-400 flex items-center justify-center">
            <i className="fa-solid fa-warehouse text-xs"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">بضاعة المخزن (الجرد)</h3>
            {activeDateLabel && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                الفترة: {activeDateLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-bold">
            {sortedAndFilteredItems.length} / {totalInventoryCount ?? inventory.length} صنف
          </span>
        </div>
      </div>

      {/* شريط البحث وخيارات الترتيب */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
        {/* حقل البحث */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-3 text-slate-400 dark:text-slate-500"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دور باسم البضاعة..."
            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pr-10 pl-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary transition"
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

        {/* شريط فلتر وترتيب البضاعة */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-arrow-down-short-wide text-brand-primary dark:text-blue-400 text-xs"></i>
              <span>ترتيب البضاعة حسب:</span>
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as InventorySortOption)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              <option value="last_added">🕒 آخر تزويد / إضافة بالمخزن</option>
              <option value="newest">✨ أحدث تسجيل (تاريخ الإنشاء)</option>
              <option value="highest_qty">📦 الأكثر كمية</option>
              <option value="lowest_qty">⚠️ الأقل كمية (تنبيه النفاذ)</option>
              <option value="highest_price">💎 الأعلى سعراً</option>
              <option value="lowest_price">🏷️ الأرخص سعراً</option>
              <option value="oldest">📅 الأقدم إضافة</option>
              <option value="alphabetical">🔤 أبجدي (أ - ي)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {sortChips.map((chip) => {
              const isActive = sortBy === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSortBy(chip.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-slate-800 dark:bg-blue-600 text-white border-slate-800 dark:border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <i
                    className={`fa-solid ${chip.icon} text-[10px] ${
                      isActive ? 'text-brand-accent dark:text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  ></i>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ملخص سريع لإجمالي التكلفة والمكسب المتوقع للبضاعة المعروضة */}
        {sortedAndFilteredItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">إجمالي التكلفة:</span>
              <span className="font-en font-black text-sm text-emerald-700 dark:text-emerald-400">
                {formatMoney(inventorySummary.totalCost)}
              </span>
            </div>
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">المكسب المتوقع:</span>
              <span className="font-en font-black text-sm text-indigo-700 dark:text-indigo-400">
                {inventorySummary.expectedProfit >= 0 ? '+' : ''}
                {formatMoney(inventorySummary.expectedProfit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* شبكة بطاقات البضاعة المطورة */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/40 min-h-[140px]">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <i className="fa-solid fa-box-open text-3xl mb-2 block text-slate-300 dark:text-slate-700"></i>
            {(totalInventoryCount ?? inventory.length) === 0
              ? 'القائمة فاضية.. ضيف بضاعة الأول من الرئيسية'
              : inventory.length === 0
              ? 'مفيش بضاعة مضافة في الفترة الزمنية المختارة'
              : 'مفيش صنف مطابق لنتيجة البحث أو الفلتر'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {sortedAndFilteredItems.map((item) => {
              const isOutOfStock =
                (item.totalUnits || 0) <= 0 ||
                (Number(item.cartons || 0) === 0 && Number(item.looseUnits || 0) === 0);

              const fullCartons = isOutOfStock
                ? 0
                : (item.cartons !== undefined
                    ? Number(item.cartons)
                    : (item.unitsPerCarton && item.unitsPerCarton > 0
                        ? Math.floor(item.totalUnits / item.unitsPerCarton)
                        : 0));

              const looseUnits = isOutOfStock
                ? 0
                : (item.looseUnits !== undefined
                    ? Number(item.looseUnits)
                    : (item.unitsPerCarton && item.unitsPerCarton > 0
                        ? item.totalUnits % item.unitsPerCarton
                        : item.totalUnits));

              const isLowStock = !isOutOfStock && item.totalUnits > 0 && item.totalUnits <= 5;

              // تصفير خانة عدد الكرتونة (يظهر 0) تماماً عند نفاذ الصنف لحين إضافة كراتين بعدد جديد أو إضافة قطع فرط
              const cartonUnitsDisplay = isOutOfStock
                ? 0
                : (fullCartons > 0 && item.unitsPerCarton && item.unitsPerCarton > 0
                    ? Number(item.unitsPerCarton)
                    : 0);

              const lastAddedTime = item.lastAddedAt || item.createdAt;
              const createdTime = item.createdAt;
              const hasHistory =
                Array.isArray(item.additionHistory) && item.additionHistory.length > 0;

              const unitProfit = (item.unitSellPrice || 0) - (item.unitBuyPrice || 0);

              return (
                <article
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition shadow-xs hover:shadow-md animate-fade ${
                    isOutOfStock
                      ? 'border-red-200/90 dark:border-red-900/60 bg-red-50/10 dark:bg-red-950/10'
                      : isLowStock
                      ? 'border-amber-200 dark:border-amber-800/60'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'
                  }`}
                >
                  {/* رأس البطاقة: اسم الصنف + شارات الحالة */}
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${
                          isOutOfStock
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                            : isLowStock
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-brand-primary dark:text-blue-400'
                        }`}
                      >
                        <i className={`fa-solid ${isOutOfStock ? 'fa-box-open' : 'fa-boxes-stacked'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-en text-slate-700 dark:text-slate-300">
                            {isOutOfStock
                              ? '0 قطعة متاحة'
                              : formatCartonBreakdown(
                                  item.totalUnits,
                                  item.unitsPerCarton,
                                  item.cartons,
                                  item.looseUnits
                                )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* شارة حالة المخزون */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          نفذت الكمية
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          رصيد منخفض
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          متوفر بالمخزن
                        </span>
                      )}
                    </div>
                  </div>

                  {/* شبكة إحصائيات المخزون الحديثة (3 أعمدة + شريط الإجمالي) */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                        الكرتونة فيها
                      </div>
                      <div className="text-sm font-black text-slate-800 dark:text-white font-en">
                        {cartonUnitsDisplay}{' '}
                        <span className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500">
                          قطعة
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mb-0.5">
                        عدد الكراتين
                      </div>
                      <div className="text-sm font-black text-blue-900 dark:text-blue-200 font-en">
                        {fullCartons}{' '}
                        <span className="text-[10px] font-sans font-bold text-blue-500 dark:text-blue-400">
                          كرتونة
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-center">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mb-0.5">
                        قطع فرط
                      </div>
                      <div className="text-sm font-black text-emerald-900 dark:text-emerald-200 font-en">
                        {looseUnits}{' '}
                        <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400">
                          قطعة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* شريط الإجمالي وتصنيف الوحدات */}
                  <div className="mb-3 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-calculator text-emerald-600 dark:text-emerald-400"></i>
                      <span>الإجمالي الفعلي بالمخزن:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-en text-sm font-black text-emerald-700 dark:text-emerald-400">
                        {item.totalUnits} قطعة
                      </strong>
                      {fullCartons > 0 && looseUnits > 0 ? (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          منها {looseUnits} فرط
                        </span>
                      ) : fullCartons === 0 && looseUnits > 0 ? (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                          كلها فرط
                        </span>
                      ) : fullCartons > 0 && looseUnits === 0 ? (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                          كلها كراتين
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* شبكة إبراز الأسعار والربحية */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-2.5">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                        <i className="fa-solid fa-tag text-[9px]"></i>
                        <span>تكلفة القطعة</span>
                      </div>
                      <div className="font-en font-black text-sm text-amber-900 dark:text-amber-200">
                        {formatMoney(item.unitBuyPrice)}
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-2.5">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                        <i className="fa-solid fa-money-bill-trend-up text-[9px]"></i>
                        <span>بيع القطعة</span>
                      </div>
                      <div className="font-en font-black text-sm text-emerald-900 dark:text-emerald-200">
                        {formatMoney(item.unitSellPrice)}
                      </div>
                    </div>

                    <div className="bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-2.5">
                      <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mb-0.5">
                        <i className="fa-solid fa-chart-line text-[9px]"></i>
                        <span>ربح القطعة</span>
                      </div>
                      <div className="font-en font-black text-sm text-indigo-900 dark:text-indigo-200">
                        +{formatMoney(unitProfit)}
                      </div>
                    </div>
                  </div>

                  {/* بطاقة تاريخ وموعد إضافة القطع أو الكراتين للمخزن */}
                  <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-800/70 dark:via-slate-800/50 dark:to-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-brand-primary dark:text-blue-400 flex items-center justify-center text-[10px]">
                          <i className="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          آخر إضافة:
                        </span>
                        <span className="font-en font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                          {lastAddedTime ? formatArabicDateTime(lastAddedTime) : 'مسجل مسبقاً'}
                        </span>
                        {item.lastAddedText && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                            {item.lastAddedText}
                          </span>
                        )}
                      </div>

                      {lastAddedTime && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 font-bold px-2 py-0.5 rounded-full">
                          {formatTimeAgoArabic(lastAddedTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar-check text-slate-400 dark:text-slate-500 text-xs"></i>
                        <span>تاريخ التسجيل:</span>
                        <span className="font-en font-bold text-slate-700 dark:text-slate-300">
                          {createdTime
                            ? formatArabicDateOnly(createdTime)
                            : lastAddedTime
                            ? formatArabicDateOnly(lastAddedTime)
                            : 'مسجل مسبقاً'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHistoryModalItem(item)}
                        className="text-brand-primary dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 text-[11px] transition cursor-pointer hover:underline"
                        title="عرض سجل ومواعيد إضافات هذا الصنف بالتفصيل"
                      >
                        <i className="fa-solid fa-list-ol text-xs"></i>
                        <span>سجل الإضافات {hasHistory ? `(${item.additionHistory!.length})` : ''}</span>
                      </button>
                    </div>
                  </div>

                  {/* ملاحظات الصنف */}
                  {item.note && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 bg-slate-100 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
                      <i className="fa-solid fa-note-sticky text-slate-400 dark:text-slate-500"></i>
                      <span>{item.note}</span>
                    </div>
                  )}

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onQuickWithdraw(item.id)}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <i className="fa-solid fa-cart-shopping text-xs"></i>
                      <span>بيع / سحب</span>
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => onDeleteItem(item)}
                      className="w-10 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-900/50 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center"
                      title="حذف"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* نافذة منبثقة لسجل مواعيد وتفاصيل إضافات وتوريدات الصنف */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-accent">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm">سجل مواعيد إضافات وتوريدات الصنف</h3>
                  <p className="text-[11px] text-slate-300 font-bold">{historyModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">
                    الرصيد المتاح حالياً بالمخزن:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {formatCartonBreakdown(
                      historyModalItem.totalUnits,
                      historyModalItem.unitsPerCarton,
                      historyModalItem.cartons,
                      historyModalItem.looseUnits
                    )}
                  </span>
                </div>
                <div className="text-left font-en">
                  <span className="text-[10px] text-slate-400 block font-sans">إجمالي القطع</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {historyModalItem.totalUnits}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <i className="fa-solid fa-timeline text-brand-primary dark:text-blue-400"></i>
                  <span>الحركات المسجلة لإضافة القطع أو الكراتين:</span>
                </h4>

                {historyModalItem.additionHistory && historyModalItem.additionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {historyModalItem.additionHistory.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <i
                              className={`fa-solid ${
                                rec.type === 'cartons'
                                  ? 'fa-boxes-stacked text-blue-500 dark:text-blue-400'
                                  : 'fa-shapes text-emerald-600 dark:text-emerald-400'
                              } text-xs`}
                            ></i>
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-en font-bold text-slate-800 dark:text-slate-100">
                              {rec.text || `+${rec.quantity} ${rec.type === 'cartons' ? 'كرتونة' : 'قطعة'}`}
                            </span>
                          </span>

                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            {formatTimeAgoArabic(rec.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-en">
                            <i className="fa-regular fa-calendar-days ml-1 text-slate-400 dark:text-slate-500"></i>
                            {formatArabicDateTime(rec.timestamp)}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                              أحدث إضافة
                            </span>
                          )}
                        </div>

                        {rec.note && (
                          <div className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                            ملاحظة: {rec.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1.5">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      تم تسجيل الصنف بموعد إضافة مبدئي:
                    </p>
                    <div className="font-en text-xs text-brand-primary dark:text-blue-400 font-bold">
                      {historyModalItem.lastAddedAt || historyModalItem.createdAt
                        ? formatArabicDateTime(historyModalItem.lastAddedAt || historyModalItem.createdAt)
                        : 'تاريخ الإضافة مسجل مسبقاً'}
                    </div>
                    {historyModalItem.lastAddedText && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                        الكمية: {historyModalItem.lastAddedText}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      أي تزويد قادم لهذا الصنف (كراتين أو قطع فرط) سيتم تسجيل موعده وتاريخه وتفاصيله تلقائياً في هذا السجل.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
