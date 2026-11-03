import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../firebase';
import { formatArabicDateTime, formatArabicDateOnly } from '../utils/formatters';

interface EditModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [cartons, setCartons] = useState<string>('0');
  const [looseUnits, setLooseUnits] = useState<string>('0');
  const [unitsPerCarton, setUnitsPerCarton] = useState<string>('12');

  const [unitBuyPrice, setUnitBuyPrice] = useState<string>('');
  const [cartonBuyPrice, setCartonBuyPrice] = useState<string>('');
  const [unitSellPrice, setUnitSellPrice] = useState<string>('');
  const [cartonSellPrice, setCartonSellPrice] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      const isDepleted =
        (item.totalUnits || 0) <= 0 ||
        (Number(item.cartons || 0) === 0 && Number(item.looseUnits || 0) === 0);

      const c = isDepleted ? 0 : (item.cartons !== undefined ? item.cartons : 0);
      const l = isDepleted ? 0 : (item.looseUnits !== undefined ? item.looseUnits : item.totalUnits);
      const upc = isDepleted ? 0 : (c > 0 && item.unitsPerCarton ? item.unitsPerCarton : 0);

      setName(item.name || '');
      setCartons(String(c));
      setLooseUnits(String(l));
      setUnitsPerCarton(String(upc));

      setUnitBuyPrice(item.unitBuyPrice !== undefined && item.unitBuyPrice > 0 ? String(item.unitBuyPrice) : '');
      setCartonBuyPrice(item.cartonBuyPrice !== undefined && item.cartonBuyPrice > 0 ? String(item.cartonBuyPrice) : '');
      setUnitSellPrice(item.unitSellPrice !== undefined && item.unitSellPrice > 0 ? String(item.unitSellPrice) : '');
      setCartonSellPrice(item.cartonSellPrice !== undefined && item.cartonSellPrice > 0 ? String(item.cartonSellPrice) : '');
      setNote(item.note || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const currentUpc = parseInt(unitsPerCarton) || 1;

  const handleUnitBuyChange = (val: string) => {
    setUnitBuyPrice(val);
    if (val !== '') {
      const u = parseFloat(val) || 0;
      setCartonBuyPrice((u * currentUpc).toFixed(2));
    }
  };

  const handleCartonBuyChange = (val: string) => {
    setCartonBuyPrice(val);
    if (val !== '') {
      const c = parseFloat(val) || 0;
      setUnitBuyPrice((c / currentUpc).toFixed(2));
    }
  };

  const handleUnitSellChange = (val: string) => {
    setUnitSellPrice(val);
    if (val !== '') {
      const u = parseFloat(val) || 0;
      setCartonSellPrice((u * currentUpc).toFixed(2));
    }
  };

  const handleCartonSellChange = (val: string) => {
    setCartonSellPrice(val);
    if (val !== '') {
      const c = parseFloat(val) || 0;
      setUnitSellPrice((c / currentUpc).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const c = Math.max(0, parseInt(cartons) || 0);
    const l = Math.max(0, parseInt(looseUnits) || 0);
    const isDepleted = c === 0 && l === 0;
    const rawUpc = parseInt(unitsPerCarton) || 0;
    // إذا نفذ الصنف أو أصبح 0 كراتين و 0 قطع، تصبح الكرتونة 0 تماماً
    const upc = isDepleted ? 0 : (c > 0 ? Math.max(1, rawUpc) : 0);
    const total = isDepleted ? 0 : ((c * (upc > 0 ? upc : 1)) + l);

    onSave({
      ...item,
      name: name.trim(),
      cartons: isDepleted ? 0 : c,
      looseUnits: isDepleted ? 0 : l,
      totalUnits: total,
      unitsPerCarton: upc,
      unitBuyPrice: parseFloat(unitBuyPrice) || 0,
      cartonBuyPrice: parseFloat(cartonBuyPrice) || 0,
      unitSellPrice: parseFloat(unitSellPrice) || 0,
      cartonSellPrice: parseFloat(cartonSellPrice) || 0,
      note: note.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade">
      <div className="bg-white rounded-2xl w-full max-w-md soft-shadow overflow-hidden my-8 max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl sticky top-0 z-10">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <i className="fa-solid fa-pen-to-square text-brand-primary"></i>
            <span>تعديل بيانات الصنف والرصيد</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 text-lg cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">اسم البضاعة</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>

          {/* معلومات مواعيد وتاريخ الإضافة */}
          {(item.lastAddedAt || item.createdAt) && (
            <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1">
                  <i className="fa-solid fa-clock-rotate-left text-brand-primary text-xs"></i>
                  <span>موعد آخر إضافة:</span>
                </span>
                <span className="font-en font-bold text-slate-800">
                  {formatArabicDateTime(item.lastAddedAt || item.createdAt)}
                  {item.lastAddedText ? ` (${item.lastAddedText})` : ''}
                </span>
              </div>
              {item.createdAt && (
                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <i className="fa-regular fa-calendar text-slate-400"></i>
                    <span>تاريخ أول تسجيل للصنف:</span>
                  </span>
                  <span className="font-en font-bold text-slate-600">
                    {formatArabicDateOnly(item.createdAt)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* تعديل رصيد الكراتين والقطع الفرط يدوياً بشكل مستقل */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
            <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
              <i className="fa-solid fa-boxes-stacked"></i> رصيد المخزن (تحديد يدوي مستقل)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 font-bold mb-1">عدد الكراتين</label>
                <input
                  type="number"
                  min="0"
                  value={cartons}
                  onChange={(e) => setCartons(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-sm font-en outline-none text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-bold mb-1">قطع فرط</label>
                <input
                  type="number"
                  min="0"
                  value={looseUnits}
                  onChange={(e) => setLooseUnits(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-sm font-en outline-none text-center font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-bold mb-1">القطعة/كرتونة</label>
                <input
                  type="number"
                  min="0"
                  value={unitsPerCarton}
                  onChange={(e) => setUnitsPerCarton(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-sm font-en outline-none text-center"
                />
              </div>
            </div>
            <div className="text-[10px] text-blue-700 mt-2 font-bold flex justify-between">
              <span>الإجمالي المحسوب:</span>
              <span className="font-en">
                {((parseInt(cartons) || 0) * (parseInt(unitsPerCarton) || 1)) + (parseInt(looseUnits) || 0)} قطعة
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">شراء القطعة</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={unitBuyPrice}
                onChange={(e) => handleUnitBuyChange(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-sm font-en outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">شراء الكرتونة</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={cartonBuyPrice}
                onChange={(e) => handleCartonBuyChange(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-sm font-en outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">بيع القطعة</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={unitSellPrice}
                onChange={(e) => handleUnitSellChange(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-sm font-en outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">بيع الكرتونة</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={cartonSellPrice}
                onChange={(e) => handleCartonSellChange(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-sm font-en outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي ملاحظات عن الصنف..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-primary hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 cursor-pointer transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
