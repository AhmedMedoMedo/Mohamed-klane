import React, { useState, useMemo } from 'react';
import { WithdrawalLog } from '../firebase';
import { formatMoney } from '../utils/formatters';

interface SalesLogSectionProps {
  logs: WithdrawalLog[];
  onFilteredLogsChange?: (filtered: WithdrawalLog[]) => void;
  onDeleteLog?: (log: WithdrawalLog) => void;
}

export const SalesLogSection: React.FC<SalesLogSectionProps> = ({
  logs,
  onFilteredLogsChange,
  onDeleteLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const query = searchQuery.toLowerCase().trim();

    const result = logs.filter((log) => {
      // Date match
      const logDate = new Date(log.createdAt);
      let isDateMatch = true;

      if (dateFilter === 'today') {
        isDateMatch = logDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        isDateMatch = logDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        isDateMatch = logDate >= monthAgo;
      } else if (dateFilter === 'custom') {
        let isAfterStart = true;
        let isBeforeEnd = true;

        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          isAfterStart = logDate >= s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          isBeforeEnd = logDate <= e;
        }
        isDateMatch = isAfterStart && isBeforeEnd;
      }

      // Search query match
      let isSearchMatch = true;
      if (query !== '') {
        const itemNameMatch = (log.itemName || '').toLowerCase().includes(query);
        const noteMatch = (log.note || '').toLowerCase().includes(query);
        isSearchMatch = itemNameMatch || noteMatch;
      }

      return isDateMatch && isSearchMatch;
    });

    return result;
  }, [logs, searchQuery, dateFilter, startDate, endDate]);

  // Notify parent of filtered logs for KPI updates
  React.useEffect(() => {
    if (onFilteredLogsChange) {
      onFilteredLogsChange(filteredLogs);
    }
  }, [filteredLogs, onFilteredLogsChange]);

  return (
    <section className="bg-white rounded-2xl soft-shadow overflow-hidden mb-6">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-clipboard-list text-slate-500"></i>
          <h3 className="font-bold text-slate-800">سجل المسحوبات</h3>
        </div>
        <span className="text-xs bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
          {filteredLogs.length} حركة
        </span>
      </div>

      {/* أدوات الفلترة */}
      <div className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="relative mb-3">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-3 text-slate-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في سجل المسحوبات (باسم البضاعة أو الملاحظات)..."
            className="w-full bg-slate-100 border-none rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-accent transition"
          />
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary transition mb-2 cursor-pointer"
        >
          <option value="all">عرض كل الأوقات</option>
          <option value="today">مسحوبات النهاردة بس</option>
          <option value="week">آخر 7 أيام (أسبوع)</option>
          <option value="month">آخر 30 يوم (شهر)</option>
          <option value="custom">تحديد تاريخ مخصص...</option>
        </select>

        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fade">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            مفيش أي مسحوبات متسجلة في الوقت ده
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
            >
              <div className="flex justify-between items-start font-bold text-sm text-slate-800 mb-1">
                <div className="flex-1 pl-2">
                  <span>{log.itemName}</span>{' '}
                  <span className="text-xs text-slate-500 font-normal">
                    ({log.withdrawTypeLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-en">+{formatMoney(log.incomeValue)}</span>
                  {onDeleteLog && (
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                      title="حذف الحركة من سجل المسحوبات"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>
                  <i className="fa-regular fa-clock ml-1"></i> {log.timestamp}
                </span>
                <span className="text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded font-en">
                  مكسب: {formatMoney(log.profit)}
                </span>
              </div>
              {log.note && (
                <div className="text-[10px] text-slate-600 mt-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <i className="fa-solid fa-note-sticky text-slate-400 ml-1"></i> {log.note}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
