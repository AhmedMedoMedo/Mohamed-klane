import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../firebase';
import { formatMoney, formatCartonBreakdown } from '../utils/formatters';

interface InventorySectionProps {
  inventory: InventoryItem[];
  onQuickWithdraw: (itemId: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}

export type InventorySortOption =
  | 'newest'
  | 'highest_price'
  | 'lowest_price'
  | 'highest_qty'
  | 'lowest_qty'
  | 'oldest'
  | 'alphabetical';

const getItemTimestamp = (item: InventoryItem): number => {
  if (!item.createdAt) return 0;
  if (typeof item.createdAt === 'number') return item.createdAt;
  if (typeof item.createdAt?.toMillis === 'function') return item.createdAt.toMillis();
  if (typeof item.createdAt?.seconds === 'number') return item.createdAt.seconds * 1000;
  if (item.createdAt instanceof Date) return item.createdAt.getTime();
  const parsed = Date.parse(item.createdAt);
  return isNaN(parsed) ? 0 : parsed;
};

export const InventorySection: React.FC<InventorySectionProps> = ({
  inventory,
  onQuickWithdraw,
  onEditItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<InventorySortOption>('newest');

  // التصفية والترتيب
  const sortedAndFilteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = inventory.filter((item) =>
      (item.name || '').toLowerCase().includes(query)
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const timeA = getItemTimestamp(a);
          const timeB = getItemTimestamp(b);
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        }
        case 'oldest': {
          const timeA = getItemTimestamp(a);
          const timeB = getItemTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (a.id || '').localeCompare(b.id || '');
        }
        case 'highest_price': {
          const priceA = a.unitSellPrice || (a.cartonSellPrice && a.unitsPerCarton ? a.cartonSellPrice / a.unitsPerCarton : 0) || 0;
          const priceB = b.unitSellPrice || (b.cartonSellPrice && b.unitsPerCarton ? b.cartonSellPrice / b.unitsPerCarton : 0) || 0;
          return priceB - priceA;
        }
        case 'lowest_price': {
          const priceA = a.unitSellPrice || (a.cartonSellPrice && a.unitsPerCarton ? a.cartonSellPrice / a.unitsPerCarton : 0) || 0;
          const priceB = b.unitSellPrice || (b.cartonSellPrice && b.unitsPerCarton ? b.cartonSellPrice / b.unitsPerCarton : 0) || 0;
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
    { id: 'newest', label: 'المضاف حديثاً', icon: 'fa-clock' },
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
              <option value="newest">🕒 المضاف حديثاً (الأحدث)</option>
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
                  <i className={`fa-solid ${chip.icon} text-[10px] ${isActive ? 'text-brand-accent' : 'text-slate-400'}`}></i>
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
            const fullCartons = item.cartons !== undefined
              ? Number(item.cartons)
              : Math.floor(item.totalUnits / uPerCarton);
            const looseUnits = item.looseUnits !== undefined
              ? Number(item.looseUnits)
              : (item.totalUnits % uPerCarton);

            // إذا كان الصنف فرط فقط ولا يحتوي على قيمة فعلية للكرتونة، يظهر 0، ولو بقيمة فعلية تظهر القيمة
            const hasRealCartonValue = fullCartons > 0
              ? (Boolean(item.unitsPerCarton) && item.unitsPerCarton > 0)
              : (Boolean(item.unitsPerCarton) && item.unitsPerCarton > 0 && item.unitsPerCarton !== 12);
            const cartonUnitsDisplay = hasRealCartonValue ? Number(item.unitsPerCarton) : 0;

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
                    {isOutOfStock ? 'نفذت الكمية' : formatCartonBreakdown(item.totalUnits, item.unitsPerCarton, item.cartons, item.looseUnits)}
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
                <div className="flex justify-between items-center text-[11px] text-slate-500 mb-3 bg-white/70 px-1">
                  <div>
                    تكلفة القطعة: <span className="font-en font-bold text-amber-700">{formatMoney(item.unitBuyPrice)}</span>
                  </div>
                  <div>
                    بيع القطعة: <span className="font-en font-bold text-emerald-700">{formatMoney(item.unitSellPrice)}</span>
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
    </section>
  );
};
