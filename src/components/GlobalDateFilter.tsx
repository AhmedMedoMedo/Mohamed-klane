import React from 'react';

export type GlobalDateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

interface GlobalDateFilterProps {
  dateFilter: GlobalDateFilterType;
  startDate: string;
  endDate: string;
  onDateFilterChange: (filter: GlobalDateFilterType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  filteredCount: number;
  totalCount: number;
  unitLabel?: string;
}

export const GlobalDateFilter: React.FC<GlobalDateFilterProps> = ({
  dateFilter,
  startDate,
  endDate,
  onDateFilterChange,
  onStartDateChange,
  onEndDateChange,
  filteredCount,
  totalCount,
  unitLabel = 'حركة',
}) => {
  const presets: { id: GlobalDateFilterType; label: string; icon: string }[] = [
    { id: 'all', label: 'كل الأوقات', icon: 'fa-infinity' },
    { id: 'today', label: 'النهاردة', icon: 'fa-calendar-day' },
    { id: 'week', label: 'آخر 7 أيام', icon: 'fa-calendar-week' },
    { id: 'month', label: 'آخر 30 يوم', icon: 'fa-calendar-days' },
    { id: 'custom', label: 'فترة مخصصة', icon: 'fa-sliders' },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl soft-shadow border border-slate-200/80 dark:border-slate-800 p-3 space-y-2.5 animate-fade">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand-primary dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <i className="fa-solid fa-filter text-xs"></i>
          </div>
          <span>فلتر التاريخ العام (للأرباح والمخزن والسجل)</span>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
          عرض <strong className="font-en text-brand-primary dark:text-blue-400">{filteredCount}</strong> من أصل{' '}
          <strong className="font-en">{totalCount}</strong> {unitLabel}
        </span>
      </div>

      {/* أزرار سريعة لاختيار الفترة */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {presets.map((preset) => {
          const isActive = dateFilter === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onDateFilterChange(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition cursor-pointer ${
                isActive
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <i className={`fa-solid ${preset.icon} text-[10px] ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* حقول التاريخ المخصص */}
      {dateFilter === 'custom' && (
        <div className="grid grid-cols-2 gap-3 pt-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-brand-primary font-en"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-brand-primary font-en"
            />
          </div>
        </div>
      )}
    </section>
  );
};
