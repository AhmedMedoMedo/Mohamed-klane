import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../firebase';
import { formatCartonBreakdown, formatMoney, normalizeArabic } from '../utils/formatters';

export interface AddStockData {
  existingId?: string;
  name: string;
  addType: 'cartons' | 'units';
  quantity: number;
  unitsPerCarton: number;
  unitBuyPrice: number;
  cartonBuyPrice: number;
  unitSellPrice: number;
  cartonSellPrice: number;
  note: string;
}

interface AddStockSectionProps {
  inventory: InventoryItem[];
  onAddStock: (data: AddStockData) => void;
}

export const AddStockSection: React.FC<AddStockSectionProps> = ({
  inventory,
  onAddStock,
}) => {
  const [name, setName] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // نوع الإضافة: كراتين مقفولة أو قطع فرط
  const [addType, setAddType] = useState<'cartons' | 'units'>('cartons');
  const [quantity, setQuantity] = useState<string>('');
  const [unitsPerCarton, setUnitsPerCarton] = useState<string>('12');

  // أسعار التكلفة
  const [unitBuyPrice, setUnitBuyPrice] = useState<string>('');
  const [cartonBuyPrice, setCartonBuyPrice] = useState<string>('');
  const [totalBatchBuyPrice, setTotalBatchBuyPrice] = useState<string>(''); // إجمالي تكلفة القطع الفرط

  // أسعار البيع
  const [unitSellPrice, setUnitSellPrice] = useState<string>('');
  const [cartonSellPrice, setCartonSellPrice] = useState<string>('');
  const [totalBatchSellPrice, setTotalBatchSellPrice] = useState<string>(''); // إجمالي بيع القطع الفرط

  const [note, setNote] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing inventory based on search query or abbreviation
  const filteredSuggestions = React.useMemo(() => {
    const query = normalizeArabic(name);
    if (!query || selectedItem) return [];

    return inventory.filter((item) => {
      const normName = normalizeArabic(item.name || '');
      if (normName.includes(query)) return true;

      const initials = normName
        .split(/\s+/)
        .map((w) => w[0])
        .join('');
      return initials.includes(query);
    });
  }, [name, inventory, selectedItem]);

  // When an existing item is selected from the quick search
  const handleSelectExistingItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setName(item.name);
    setIsDropdownOpen(false);

    const uPerCarton = Math.max(1, item.unitsPerCarton || 1);
    setUnitsPerCarton(String(uPerCarton));

    const qty = parseInt(quantity) || 0;

    if (item.unitBuyPrice !== undefined) {
      setUnitBuyPrice(String(item.unitBuyPrice));
      if (qty > 0) {
        setTotalBatchBuyPrice((item.unitBuyPrice * qty).toFixed(2));
      }
    }
    if (item.cartonBuyPrice !== undefined) {
      setCartonBuyPrice(String(item.cartonBuyPrice));
    } else if (item.unitBuyPrice !== undefined) {
      setCartonBuyPrice((item.unitBuyPrice * uPerCarton).toFixed(2));
    }

    if (item.unitSellPrice !== undefined) {
      setUnitSellPrice(String(item.unitSellPrice));
      if (qty > 0) {
        setTotalBatchSellPrice((item.unitSellPrice * qty).toFixed(2));
      }
    }
    if (item.cartonSellPrice !== undefined) {
      setCartonSellPrice(String(item.cartonSellPrice));
    } else if (item.unitSellPrice !== undefined) {
      setCartonSellPrice((item.unitSellPrice * uPerCarton).toFixed(2));
    }

    if (item.note) {
      setNote(item.note);
    }
  };

  // Reset to new product mode
  const handleClearSelected = () => {
    setSelectedItem(null);
    setName('');
    setQuantity('');
    setUnitsPerCarton('12');
    setUnitBuyPrice('');
    setCartonBuyPrice('');
    setTotalBatchBuyPrice('');
    setUnitSellPrice('');
    setCartonSellPrice('');
    setTotalBatchSellPrice('');
    setNote('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Switching addition type
  const handleTypeChange = (newType: 'cartons' | 'units') => {
    setAddType(newType);
    const qty = parseInt(quantity) || 0;
    const units = parseInt(unitsPerCarton) || 1;

    if (newType === 'units') {
      if (unitBuyPrice !== '' && qty > 0) {
        setTotalBatchBuyPrice((parseFloat(unitBuyPrice) * qty).toFixed(2));
      }
      if (unitSellPrice !== '' && qty > 0) {
        setTotalBatchSellPrice((parseFloat(unitSellPrice) * qty).toFixed(2));
      }
    } else {
      if (unitBuyPrice !== '') {
        setCartonBuyPrice((parseFloat(unitBuyPrice) * units).toFixed(2));
      }
      if (unitSellPrice !== '') {
        setCartonSellPrice((parseFloat(unitSellPrice) * units).toFixed(2));
      }
    }
  };

  // Quantity change handler: recalculates batch totals in units mode
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const qty = parseInt(val) || 0;

    if (addType === 'units' && qty > 0) {
      if (unitBuyPrice !== '') {
        setTotalBatchBuyPrice((parseFloat(unitBuyPrice) * qty).toFixed(2));
      }
      if (unitSellPrice !== '') {
        setTotalBatchSellPrice((parseFloat(unitSellPrice) * qty).toFixed(2));
      }
    }
  };

  // Units per carton change handler
  const handleUnitsPerCartonInput = (val: string) => {
    setUnitsPerCarton(val);
    const units = parseInt(val) || 1;
    if (unitBuyPrice !== '') {
      const u = parseFloat(unitBuyPrice) || 0;
      setCartonBuyPrice((u * units).toFixed(2));
    }
    if (unitSellPrice !== '') {
      const u = parseFloat(unitSellPrice) || 0;
      setCartonSellPrice((u * units).toFixed(2));
    }
  };

  // Handlers for Cost (شراء / تكلفة)
  const handleUnitBuyChange = (val: string) => {
    setUnitBuyPrice(val);
    const u = parseFloat(val) || 0;
    const units = parseInt(unitsPerCarton) || 1;
    const qty = parseInt(quantity) || 0;

    if (val !== '') {
      setCartonBuyPrice((u * units).toFixed(2));
      if (qty > 0) {
        setTotalBatchBuyPrice((u * qty).toFixed(2));
      }
    } else {
      setTotalBatchBuyPrice('');
    }
  };

  const handleCartonBuyChange = (val: string) => {
    setCartonBuyPrice(val);
    const c = parseFloat(val) || 0;
    const units = parseInt(unitsPerCarton) || 1;
    const qty = parseInt(quantity) || 0;

    if (val !== '') {
      const u = c / units;
      setUnitBuyPrice(u.toFixed(2));
      if (qty > 0) {
        setTotalBatchBuyPrice((u * qty).toFixed(2));
      }
    }
  };

  const handleTotalBatchBuyChange = (val: string) => {
    setTotalBatchBuyPrice(val);
    const total = parseFloat(val) || 0;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const units = parseInt(unitsPerCarton) || 1;

    if (val !== '') {
      const u = total / qty;
      setUnitBuyPrice(u.toFixed(2));
      setCartonBuyPrice((u * units).toFixed(2));
    } else {
      setUnitBuyPrice('');
    }
  };

  // Handlers for Sell (بيع)
  const handleUnitSellChange = (val: string) => {
    setUnitSellPrice(val);
    const u = parseFloat(val) || 0;
    const units = parseInt(unitsPerCarton) || 1;
    const qty = parseInt(quantity) || 0;

    if (val !== '') {
      setCartonSellPrice((u * units).toFixed(2));
      if (qty > 0) {
        setTotalBatchSellPrice((u * qty).toFixed(2));
      }
    } else {
      setTotalBatchSellPrice('');
    }
  };

  const handleCartonSellChange = (val: string) => {
    setCartonSellPrice(val);
    const c = parseFloat(val) || 0;
    const units = parseInt(unitsPerCarton) || 1;
    const qty = parseInt(quantity) || 0;

    if (val !== '') {
      const u = c / units;
      setUnitSellPrice(u.toFixed(2));
      if (qty > 0) {
        setTotalBatchSellPrice((u * qty).toFixed(2));
      }
    }
  };

  const handleTotalBatchSellChange = (val: string) => {
    setTotalBatchSellPrice(val);
    const total = parseFloat(val) || 0;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const units = parseInt(unitsPerCarton) || 1;

    if (val !== '') {
      const u = total / qty;
      setUnitSellPrice(u.toFixed(2));
      setCartonSellPrice((u * units).toFixed(2));
    } else {
      setUnitSellPrice('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return;

    const units = addType === 'cartons'
      ? (parseInt(unitsPerCarton) || 1)
      : (selectedItem && selectedItem.cartons && selectedItem.cartons > 0 ? (selectedItem.unitsPerCarton || 0) : 0);
    const uBuy = parseFloat(unitBuyPrice) || 0;
    const cBuy = parseFloat(cartonBuyPrice) || (uBuy * (units || 1));
    const uSell = parseFloat(unitSellPrice) || 0;
    const cSell = parseFloat(cartonSellPrice) || (uSell * (units || 1));

    onAddStock({
      existingId: selectedItem ? selectedItem.id : undefined,
      name: name.trim(),
      addType,
      quantity: qty,
      unitsPerCarton: units,
      unitBuyPrice: uBuy,
      cartonBuyPrice: cBuy,
      unitSellPrice: uSell,
      cartonSellPrice: cSell,
      note: note.trim(),
    });

    // Reset form after submit
    setSelectedItem(null);
    setName('');
    setQuantity('');
    setUnitsPerCarton('12');
    setUnitBuyPrice('');
    setCartonBuyPrice('');
    setTotalBatchBuyPrice('');
    setUnitSellPrice('');
    setCartonSellPrice('');
    setTotalBatchSellPrice('');
    setNote('');
  };

  const qtyNumber = parseInt(quantity) || 0;
  const calculatedAddedUnits =
    addType === 'cartons'
      ? qtyNumber * (parseInt(unitsPerCarton) || 1)
      : qtyNumber;

  return (
    <section id="sectionAdd" className="bg-white rounded-2xl soft-shadow overflow-hidden scroll-mt-28">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-emerald-500 text-lg">
            <i className="fa-solid fa-circle-plus"></i>
          </div>
          <h3 className="font-bold text-slate-800">دخّل بضاعة جديدة للمخزن</h3>
        </div>
        {selectedItem && (
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <i className="fa-solid fa-circle-check"></i> منتج مسجل بالمخزن
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* اختيار / البحث عن الصنف */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-600">
              اسم البضاعة (ابحث للزيادة أو اكتب صنف جديد) <span className="text-red-500">*</span>
            </label>
            {selectedItem && (
              <button
                type="button"
                onClick={handleClearSelected}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer flex items-center gap-1"
              >
                <i className="fa-solid fa-rotate-left"></i> إلغاء التحديد (تسجيل صنف جديد)
              </button>
            )}
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSelectedItem(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="ابحث بالاسم أو اكتب اسم بضاعة جديدة (مثال: كشاف ليد)..."
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                selectedItem
                  ? 'bg-emerald-50/40 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 focus:border-brand-primary'
              }`}
            />
            {name && !selectedItem && (
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setIsDropdownOpen(false);
                }}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* معلومات المنتج المسجل مسبقاً إذا تم اختياره */}
          {selectedItem && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-fade">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-warehouse text-emerald-600"></i>
                <div>
                  <span className="font-bold text-emerald-900">{selectedItem.name}</span>
                  <span className="text-slate-600 mr-2 text-[11px]">
                    الرصيد الحالي بالمخزن:{' '}
                    <strong className="text-emerald-700">
                      {formatCartonBreakdown(selectedItem.totalUnits, selectedItem.unitsPerCarton, selectedItem.cartons, selectedItem.looseUnits)}
                    </strong>
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                سيتم زيادة الرصيد تلقائياً
              </span>
            </div>
          )}

          {/* قائمة البحث السريع المنبثقة */}
          {isDropdownOpen && !selectedItem && name.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto animate-fade">
              <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-100 flex justify-between">
                <span>نتائج البحث في المخزن ({filteredSuggestions.length})</span>
                <span className="text-[10px] text-slate-400">اختر لزيادة الرصيد فوراً</span>
              </div>
              {filteredSuggestions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectExistingItem(item)}
                      className="p-3 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-500">
                          الرصيد المتاح: {formatCartonBreakdown(item.totalUnits, item.unitsPerCarton, item.cartons, item.looseUnits)}
                        </div>
                      </div>
                      <div className="text-left text-[11px]">
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                          تكلفة: {formatMoney(item.unitBuyPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  <i className="fa-solid fa-sparkles text-amber-500 ml-1"></i>
                  صنف جديد غير مسجل، سيتم حفظه في المخزن بالبيانات التالية
                </div>
              )}
            </div>
          )}
        </div>

        {/* اختيار الإضافة بكرتونة أو بقطع فرط */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            هتضيف إيه للمخزن؟ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('cartons')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                addType === 'cartons'
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>كراتين مقفولة</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('units')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                addType === 'units'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-shapes"></i>
              <span>قطع (فرط)</span>
            </button>
          </div>
        </div>

        {/* حقول الكميات: كرتونة خانتين، والقطع الفرط خانة واحدة فقط */}
        {addType === 'cartons' ? (
          <div className="grid grid-cols-2 gap-3 animate-fade">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                جبت كام كرتونة؟ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="مثال: 5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-en outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                الكرتونة فيها كام قطعة؟ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={unitsPerCarton}
                onChange={(e) => handleUnitsPerCartonInput(e.target.value)}
                placeholder="مثال: 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-en outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        ) : (
          <div className="animate-fade">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              جبت كام قطعة فرط؟ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="اكتب عدد القطع الفرط (مثال: 10)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-en outline-none focus:border-emerald-600"
            />
          </div>
        )}

        {/* ملخص الكمية المضافة الحالية */}
        {qtyNumber > 0 && (
          <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900 animate-fade">
            <span>
              <i className="fa-solid fa-arrow-down-short-wide ml-1 text-blue-600"></i>
              إجمالي القطع المضافة للرصيد:{' '}
              <strong className="font-en text-sm text-blue-700">{calculatedAddedUnits}</strong> قطعة
            </span>
            {addType === 'cartons' && (
              <span className="text-[11px] text-blue-600 font-bold">
                ({qtyNumber} كرتونة × {unitsPerCarton} قطعة)
              </span>
            )}
          </div>
        )}

        {/* الأسعار اللي اشتريت بيها (التكلفة) - تتغير بذكاء حسب كرتونة أو قطع فرط */}
        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 relative">
          <span className="absolute top-2 left-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
            {addType === 'units'
              ? `حساب تكلفة الـ ${qtyNumber > 0 ? qtyNumber : ''} قطع`
              : 'حساب تلقائي للكرتونة'}
          </span>

          <div className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
            <i className="fa-solid fa-money-bill-wave"></i>
            {addType === 'units'
              ? 'الأسعار اللي اشتريت بيها (تكلفة القطع الفرط)'
              : 'الأسعار اللي اشتريت بيها (التكلفة بالكرتونة)'}
          </div>

          {addType === 'units' ? (
            /* نظام حساب التكلفة للقطع الفرط */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  القطعة الواحدة واقفة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitBuyPrice}
                  onChange={(e) => handleUnitBuyChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  إجمالي تكلفة الـ {qtyNumber > 0 ? qtyNumber : ''} قطع كلها؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={totalBatchBuyPrice}
                  onChange={(e) => handleTotalBatchBuyChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-amber-400 font-bold text-amber-900"
                />
              </div>
            </div>
          ) : (
            /* نظام حساب التكلفة للكراتين */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  القطعة واقفة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitBuyPrice}
                  onChange={(e) => handleUnitBuyChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  الكرتونة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={cartonBuyPrice}
                  onChange={(e) => handleCartonBuyChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* هتبيع بكام؟ (سعر البيع) - يتغير بذكاء حسب كرتونة أو قطع فرط */}
        <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 relative">
          <span className="absolute top-2 left-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
            {addType === 'units'
              ? `حساب بيع الـ ${qtyNumber > 0 ? qtyNumber : ''} قطع`
              : 'حساب تلقائي للكرتونة'}
          </span>

          <div className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1">
            <i className="fa-solid fa-tags"></i>
            {addType === 'units'
              ? 'هتبيع بكام؟ (سعر بيع القطع الفرط)'
              : 'هتبيع بكام؟ (سعر البيع بالكرتونة)'}
          </div>

          {addType === 'units' ? (
            /* نظام حساب البيع للقطع الفرط */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  هتبيع القطعة الواحدة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitSellPrice}
                  onChange={(e) => handleUnitSellChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  إجمالي بيع الـ {qtyNumber > 0 ? qtyNumber : ''} قطع كلها؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={totalBatchSellPrice}
                  onChange={(e) => handleTotalBatchSellChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-indigo-400 font-bold text-indigo-900"
                />
              </div>
            </div>
          ) : (
            /* نظام حساب البيع للكراتين */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  هتبيع القطعة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitSellPrice}
                  onChange={(e) => handleUnitSellChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  هتبيع الكرتونة بكام؟ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={cartonSellPrice}
                  onChange={(e) => handleCartonSellChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-en outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: اسم المورد، تاريخ الصلاحية..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-brand-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition cursor-pointer"
        >
          <i className="fa-solid fa-check"></i>
          {selectedItem
            ? `حفظ وزيادة رصيد (${selectedItem.name}) بالمخزن`
            : 'حفظ في المخزن'}
        </button>
      </form>
    </section>
  );
};
