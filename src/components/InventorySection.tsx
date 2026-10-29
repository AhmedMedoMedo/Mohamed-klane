import React, { useState } from 'react';
import { InventoryItem } from '../firebase';
import { formatMoney, formatCartonBreakdown } from '../utils/formatters';

interface InventorySectionProps {
  inventory: InventoryItem[];
  onQuickWithdraw: (itemId: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  inventory,
  onQuickWithdraw,
  onEditItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = inventory.filter((item) =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-white rounded-2xl soft-shadow overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-warehouse text-slate-500"></i>
          <h3 className="font-bold text-slate-800">بضاعة المخزن (الجرد)</h3>
        </div>
        <span className="text-xs bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
          {inventory.length} صنف
        </span>
      </div>

      {/* شريط البحث */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-3 text-slate-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دور باسم البضاعة..."
            className="w-full bg-slate-100 border-none rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary transition"
          />
        </div>
      </div>

      {/* بطاقات البضاعة */}
      <div className="divide-y divide-slate-100 bg-white min-h-[100px]">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            {inventory.length === 0
              ? 'القائمة فاضية.. ضيف بضاعة الأول'
              : 'مفيش صنف مطابق لنتيجة البحث'}
          </div>
        ) : (
          filteredItems.map((item) => {
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
