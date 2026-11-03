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
    <section className="bg-white rounded-2xl soft-shadow overflow-hidden">
      {/* رأس قسم الجرد */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-warehouse text-slate-500"></i>
          <h3 className="font-bold text-slate-800">بضاعة المخزن (الجرد)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
            {inventory.length} صنف
          </span>
        </div>
      </div>

      {/* شريط البحث وخيارات الترتيب */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2.5">
        {/* حقل البحث */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-3 text-slate-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دور باسم البضاعة..."
            className="w-full bg-slate-100 border-none rounded-xl pr-10 pl-8 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-slate-200"
              title="مسح البحث"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* شريط فلتر وترتيب البضاعة */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-arrow-down-short-wide text-brand-primary text-xs"></i>
              <span>ترتيب البضاعة حسب:</span>
            </span>

            {/* قائمة منسدلة سريعة لاختيار الترتيب */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as InventorySortOption)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
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

          {/* أزرار سريعة للترتيب (Chips) سهلة الاستخدام بلمسة واحدة على الموبايل */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {sortChips.map((chip) => {
              const isActive = sortBy === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSortBy(chip.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i
                    className={`fa-solid ${chip.icon} text-[10px] ${
                      isActive ? 'text-brand-accent' : 'text-slate-400'
                    }`}
                  ></i>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* بطاقات البضاعة */}
      <div className="divide-y divide-slate-100 bg-white min-h-[100px]">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            {inventory.length === 0
              ? 'القائمة فاضية.. ضيف بضاعة الأول'
              : 'مفيش صنف مطابق لنتيجة البحث أو الفلتر'}
          </div>
        ) : (
          sortedAndFilteredItems.map((item) => {
            const isOutOfStock = item.totalUnits <= 0;
            const uPerCarton = Math.max(1, item.unitsPerCarton || 1);
            const fullCartons =
              item.cartons !== undefined
                ? Number(item.cartons)
                : Math.floor(item.totalUnits / uPerCarton);
            const looseUnits =
              item.looseUnits !== undefined
                ? Number(item.looseUnits)
                : item.totalUnits % uPerCarton;

            // إذا كان الصنف فرط فقط ولا يحتوي على قيمة فعلية للكرتونة، يظهر 0، ولو بقيمة فعلية تظهر القيمة
            const hasRealCartonValue =
              fullCartons > 0
                ? Boolean(item.unitsPerCarton) && item.unitsPerCarton > 0
                : Boolean(item.unitsPerCarton) &&
                  item.unitsPerCarton > 0 &&
                  item.unitsPerCarton !== 12;
            const cartonUnitsDisplay = hasRealCartonValue ? Number(item.unitsPerCarton) : 0;

            const lastAddedTime = item.lastAddedAt || item.createdAt;
            const createdTime = item.createdAt;
            const hasHistory =
              Array.isArray(item.additionHistory) && item.additionHistory.length > 0;

            return (
              <div
                key={item.id}
                className="p-4 transition hover:bg-slate-50 animate-fade"
              >
                {/* اسم الصنف وحالة الرصيد */}
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <h4 className="font-bold text-base text-slate-800">{item.name}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-700'
                        : 'bg-brand-primary/10 text-brand-primary'
                    }`}
                  >
                    {isOutOfStock
                      ? 'نفذت الكمية'
                      : formatCartonBreakdown(
                          item.totalUnits,
                          item.unitsPerCarton,
                          item.cartons,
                          item.looseUnits
                        )}
                  </span>
                </div>

                {/* تفاصيل الكرتونة فيها كام قطعة + فيه كام كرتونة + حساب الإجمالي وإظهاره بجانبها مباشرة */}
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-bold flex items-center gap-1 text-[11px]">
                    <i className="fa-solid fa-box-open text-slate-400 text-[10px]"></i>
                    الكرتونة فيها: <strong className="font-en text-slate-800">{cartonUnitsDisplay}</strong> قطعة
                  </span>

                  <span className="text-slate-300 font-bold">|</span>

                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-bold flex items-center gap-1 text-[11px]">
                    <i className="fa-solid fa-boxes-stacked text-blue-500 text-[10px]"></i>
                    فيه: <strong className="font-en text-blue-800">{fullCartons}</strong> كرتونة
                  </span>

                  <span className="text-slate-300 font-bold">|</span>

                  <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold flex items-center gap-1 text-[11px]">
                    <i className="fa-solid fa-calculator text-emerald-600 text-[10px]"></i>
                    الإجمالي: <strong className="font-en text-emerald-700">{item.totalUnits}</strong> قطعة
                    {fullCartons > 0 && looseUnits > 0 ? (
                      <span className="text-[10px] text-amber-700 font-bold mr-0.5">
                        (منها {looseUnits} فرط)
                      </span>
                    ) : fullCartons === 0 && looseUnits > 0 ? (
                      <span className="text-[10px] text-emerald-700 font-bold mr-0.5">
                        (كلها فرط)
                      </span>
                    ) : fullCartons > 0 && looseUnits === 0 ? (
                      <span className="text-[10px] text-blue-700 font-bold mr-0.5">
                        (كلها كراتين)
                      </span>
                    ) : null}
                  </span>
                </div>

                {/* صناديق تفصيل عدد الكراتين وقطع الفرط المتبقية */}
                <div className="grid grid-cols-2 gap-2 my-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold">عدد الكراتين</div>
                      <div className="text-sm font-black text-slate-800 font-en">
                        {fullCartons}{' '}
                        <span className="text-[10px] font-sans text-slate-500 font-bold">كرتونة</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shadow-xs">
                      <i className="fa-solid fa-shapes"></i>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold">قطع فرط</div>
                      <div className="text-sm font-black text-slate-800 font-en">
                        {looseUnits}{' '}
                        <span className="text-[10px] font-sans text-slate-500 font-bold">قطعة</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* أسعار التكلفة والبيع */}
                <div className="flex justify-between items-center text-[11px] text-slate-500 mb-2.5 bg-white/70 px-1">
                  <div>
                    تكلفة القطعة: <span className="font-en font-bold text-amber-700">{formatMoney(item.unitBuyPrice)}</span>
                  </div>
                  <div>
                    بيع القطعة: <span className="font-en font-bold text-emerald-700">{formatMoney(item.unitSellPrice)}</span>
                  </div>
                </div>

                {/* بطاقة تاريخ وموعد إضافة القطع أو الكراتين للمخزن */}
                <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 border border-slate-200/90 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center text-[10px]">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </div>
                      <span className="font-bold text-slate-700 text-[11px]">موعد آخر إضافة للمخزن:</span>
                      <span className="font-en font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {lastAddedTime ? formatArabicDateTime(lastAddedTime) : 'مسجل مسبقاً'}
                      </span>
                      {item.lastAddedText && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.lastAddedText}
                        </span>
                      )}
                    </div>

                    {lastAddedTime && (
                      <span className="text-[10px] text-blue-600 bg-blue-100/60 font-bold px-2 py-0.5 rounded-full">
                        {formatTimeAgoArabic(lastAddedTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-regular fa-calendar-check text-slate-400 text-xs"></i>
                      <span>تاريخ أول تسجيل للصنف:</span>
                      <span className="font-en font-bold text-slate-700">
                        {createdTime ? formatArabicDateOnly(createdTime) : (lastAddedTime ? formatArabicDateOnly(lastAddedTime) : 'مسجل مسبقاً')}
                      </span>
                    </div>

                    {/* زر الاطلاع على سجل التوريدات والإضافات السابقة */}
                    <button
                      type="button"
                      onClick={() => setHistoryModalItem(item)}
                      className="text-brand-primary hover:text-brand-primary/80 font-bold flex items-center gap-1 text-[11px] transition cursor-pointer hover:underline"
                      title="عرض سجل ومواعيد إضافات هذا الصنف بالتفصيل"
                    >
                      <i className="fa-solid fa-list-ol text-xs"></i>
                      <span>سجل الإضافات {hasHistory ? `(${item.additionHistory!.length})` : ''}</span>
                    </button>
                  </div>
                </div>

                {/* ملاحظات الصنف */}
                {item.note && (
                  <div className="text-[10px] text-slate-600 mb-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <i className="fa-solid fa-note-sticky text-slate-400 ml-1"></i> {item.note}
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onQuickWithdraw(item.id)}
                    className="flex-[2] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-cart-shopping text-xs"></i>
                    <span>بيع / سحب</span>
                  </button>
                  <button
                    onClick={() => onEditItem(item)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="w-10 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-center"
                    title="حذف"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* نافذة منبثقة لسجل مواعيد وتفاصيل إضافات وتوريدات الصنف */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* رأس النافذة */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
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

            {/* محتوى السجل */}
            <div className="p-4 overflow-y-auto space-y-3">
              {/* ملخص الرصيد الحالي للصنف */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">الرصيد المتاح حالياً بالمخزن:</span>
                  <span className="font-bold text-slate-800 text-sm">
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
                  <span className="font-black text-emerald-600 text-base">
                    {historyModalItem.totalUnits}
                  </span>
                </div>
              </div>

              {/* قائمة الإضافات والتوريدات السابقة */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-timeline text-brand-primary"></i>
                  <span>الحركات المسجلة لإضافة القطع أو الكراتين:</span>
                </h4>

                {historyModalItem.additionHistory && historyModalItem.additionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {historyModalItem.additionHistory.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <i
                              className={`fa-solid ${
                                rec.type === 'cartons'
                                  ? 'fa-boxes-stacked text-blue-500'
                                  : 'fa-shapes text-emerald-600'
                              } text-xs`}
                            ></i>
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-en font-bold text-slate-800">
                              {rec.text || `+${rec.quantity} ${rec.type === 'cartons' ? 'كرتونة' : 'قطعة'}`}
                            </span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-bold">
                            {formatTimeAgoArabic(rec.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-en">
                            <i className="fa-regular fa-calendar-days ml-1 text-slate-400"></i>
                            {formatArabicDateTime(rec.timestamp)}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                              أحدث إضافة
                            </span>
                          )}
                        </div>

                        {rec.note && (
                          <div className="mt-1.5 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                            ملاحظة: {rec.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <p className="text-xs text-slate-600 font-bold">
                      تم تسجيل الصنف بموعد إضافة مبدئي:
                    </p>
                    <div className="font-en text-xs text-brand-primary font-bold">
                      {historyModalItem.lastAddedAt || historyModalItem.createdAt
                        ? formatArabicDateTime(historyModalItem.lastAddedAt || historyModalItem.createdAt)
                        : 'تاريخ الإضافة مسجل مسبقاً'}
                    </div>
                    {historyModalItem.lastAddedText && (
                      <div className="text-[11px] text-emerald-700 font-bold">
                        الكمية: {historyModalItem.lastAddedText}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400">
                      أي تزويد قادم لهذا الصنف (كراتين أو قطع فرط) سيتم تسجيل موعده وتاريخه وتفاصيله تلقائياً في هذا السجل.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* تذييل النافذة */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
