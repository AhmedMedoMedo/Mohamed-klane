import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem } from '../firebase';
import { formatMoney, formatCartonBreakdown, normalizeArabic } from '../utils/formatters';

interface WithdrawSectionProps {
  inventory: InventoryItem[];
  selectedItemId: string;
  onSelectItemId: (id: string) => void;
  onWithdraw: (data: {
    itemId: string;
    type: 'cartons' | 'units';
    qty: number;
    note: string;
  }) => void;
}

export const WithdrawSection: React.FC<WithdrawSectionProps> = ({
  inventory,
  selectedItemId,
  onSelectItemId,
  onWithdraw,
}) => {
  const [withdrawType, setWithdrawType] = useState<'cartons' | 'units'>('cartons');
  const [quantity, setQuantity] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // حالة البحث السريع عن المنتج للبيع
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);

  // Auto-select or clear if current selection invalid
  useEffect(() => {
    if (selectedItemId && !inventory.some((i) => i.id === selectedItemId)) {
      onSelectItemId('');
    }
  }, [inventory, selectedItemId, onSelectItemId]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered products for quick sale search
  const filteredProducts = useMemo(() => {
    const query = normalizeArabic(searchQuery);
    if (!query) return inventory;

    return inventory.filter((item) => {
      const normName = normalizeArabic(item.name || '');
      if (normName.includes(query)) return true;

      // Match initials
      const initials = normName
        .split(/\s+/)
        .map((w) => w[0])
        .join('');
      return initials.includes(query);
    });
  }, [searchQuery, inventory]);

  const numQty = parseInt(quantity) || 0;
  const previewIncome = selectedItem && numQty > 0
    ? withdrawType === 'cartons'
      ? numQty * (selectedItem.cartonSellPrice || 0)
      : numQty * (selectedItem.unitSellPrice || 0)
    : 0;

  const handleSelectItem = (id: string) => {
    onSelectItemId(id);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onSelectItemId('');
    setSearchQuery('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseInt(quantity) || 0;
    if (!selectedItemId || parsedQty <= 0) return;

    onWithdraw({
      itemId: selectedItemId,
      type: withdrawType,
      qty: parsedQty,
      note: note.trim(),
    });

    setQuantity('');
    setNote('');
  };

  const uPerCarton = selectedItem ? Math.max(1, selectedItem.unitsPerCarton || 1) : 1;
  const fullCartons = selectedItem
    ? (selectedItem.cartons !== undefined ? selectedItem.cartons : Math.floor(selectedItem.totalUnits / uPerCarton))
    : 0;
  const looseUnits = selectedItem
    ? (selectedItem.looseUnits !== undefined ? selectedItem.looseUnits : selectedItem.totalUnits % uPerCarton)
    : 0;

  return (
    <section id="sectionWithdraw" className="bg-white rounded-2xl soft-shadow overflow-hidden scroll-mt-28">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-brand-accent text-lg">
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
          <h3 className="font-bold text-slate-800">بيّع أو اسحب بضاعة</h3>
        </div>
        {selectedItem && (
          <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <i className="fa-solid fa-check"></i> تم تحديد الصنف للبيع
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* خانة البحث عن المنتج وتحديده للبيع */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              بحث واختيار البضاعة للبيع <span className="text-red-500">*</span>
            </label>
            {selectedItem && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer flex items-center gap-1"
              >
                <i className="fa-solid fa-magnifying-glass"></i> تغيير الصنف (بحث عن غيره)
              </button>
            )}
          </div>

          {/* إذا تم اختيار صنف: نعرض بطاقته التوضيحية الأنيقة مع تفاصيل الرصيد والأسعار */}
          {selectedItem ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-fade">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent text-slate-900 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-box-check"></i>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{selectedItem.name}</div>
                    <div className="text-[11px] text-slate-500">
                      سعر بيع القطعة: <strong className="text-emerald-700 font-en">{formatMoney(selectedItem.unitSellPrice)}</strong>
                      {' | '}
                      الكرتونة: <strong className="text-emerald-700 font-en">{formatMoney(selectedItem.cartonSellPrice)}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                >
                  تغيير
                </button>
              </div>

              {/* شريط الرصيد المتاح للبيع */}
              <div className="bg-white/90 p-2 rounded-lg border border-amber-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">رصيد المخزن المتاح:</span>
                <span className="font-bold text-slate-800">
                  <span className="text-blue-700">{fullCartons} كرتونة</span>
                  {' و '}
                  <span className="text-emerald-700">{looseUnits} قطعة فرط</span>
                  <span className="text-slate-400 text-[10px] mr-1">({selectedItem.totalUnits} قطعة إجمالي)</span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              {/* حقل البحث التفاعلي السريع */}
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-3 text-slate-400"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="ابحث باسم المنتج أو بحروف سريعة للبيع..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-brand-accent transition focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* القائمة المنسدلة للبحث الفوري */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto animate-fade">
                  <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-100 flex justify-between">
                    <span>نتائج الأصناف المتاحة للبيع ({filteredProducts.length})</span>
                    <span className="text-[10px] text-slate-400">اضغط للاختيار</span>
                  </div>
                  {filteredProducts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filteredProducts.map((item) => {
                        const itemUPerCarton = Math.max(1, item.unitsPerCarton || 1);
                        const itemCartons = item.cartons !== undefined
                          ? item.cartons
                          : Math.floor(item.totalUnits / itemUPerCarton);
                        const itemLoose = item.looseUnits !== undefined
                          ? item.looseUnits
                          : item.totalUnits % itemUPerCarton;
                        const isOut = item.totalUnits <= 0;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item.id)}
                            className="p-3 hover:bg-amber-50/60 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-sm text-slate-800">{item.name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                المتاح:{' '}
                                <strong className="text-slate-700">
                                  {formatCartonBreakdown(item.totalUnits, item.unitsPerCarton, item.cartons, item.looseUnits)}
                                </strong>
                              </div>
                            </div>
                            <div className="text-left text-xs">
                              <span className="text-emerald-600 font-bold font-en bg-emerald-50 px-2 py-1 rounded">
                                بيع: {formatMoney(item.unitSellPrice)}
                              </span>
                              {isOut && (
                                <div className="text-[9px] text-red-600 font-bold mt-1">
                                  منتهي الرصيد
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      مفيش منتج مطابق في المخزن
                    </div>
                  )}
                </div>
              )}

              {/* أو اختيار مباشر من القائمة المنسدلة */}
              <div className="mt-2">
                <select
                  value={selectedItemId}
                  onChange={(e) => handleSelectItem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-accent cursor-pointer"
                >
                  <option value="">-- أو اختر الصنف مباشرة من هذه القائمة --</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatCartonBreakdown(item.totalUnits, item.unitsPerCarton, item.cartons, item.looseUnits)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* خيارات السحب والكمية */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">هتسحب إيه؟</label>
            <select
              value={withdrawType}
              onChange={(e) => setWithdrawType(e.target.value as 'cartons' | 'units')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-accent cursor-pointer"
            >
              <option value="cartons">كراتين مقفولة</option>
              <option value="units">قطع (فرط)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">الكمية</label>
            <input
              type="number"
              required
              min="1"
              placeholder="اكتب الكمية..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-en outline-none text-center focus:border-brand-accent placeholder:text-slate-400 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: مباعة لعميل كذا، أو مسحوبة للمنزل..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
          />
        </div>

        {/* معاينة المبلغ المطلوب من الزبون */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-700">المطلوب من الزبون:</span>
          <span className="text-xl font-black font-en text-emerald-600">
            {formatMoney(previewIncome)}
          </span>
        </div>

        <button
          type="submit"
          disabled={!selectedItemId}
          className="w-full bg-brand-accent hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition cursor-pointer"
        >
          <i className="fa-solid fa-hand-holding-dollar"></i> بيّع واخصم من المخزن
        </button>
      </form>
    </section>
  );
};
