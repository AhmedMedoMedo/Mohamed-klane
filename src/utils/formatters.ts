export function formatMoney(num: number | string | undefined | null): string {
  const n = Number(num || 0);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCartonBreakdown(
  totalUnits: number,
  unitsPerCarton: number,
  explicitCartons?: number,
  explicitLooseUnits?: number
): string {
  // إذا تم تحديد عدد الكراتين والقطع الفرط صراحةً بواسطة المستخدم عند التسجيل
  if (explicitCartons !== undefined && explicitLooseUnits !== undefined) {
    const c = Math.max(0, explicitCartons);
    const l = Math.max(0, explicitLooseUnits);
    if (c === 0 && l === 0) return '0 كرتونة';
    if (l === 0) return `${c} كرتونة`;
    if (c === 0) return `${l} قطعة فرط`;
    return `${c} كرتونة و ${l} قطعة فرط`;
  }

  const uPerCarton = Math.max(1, unitsPerCarton || 1);
  const fullCartons = Math.floor(totalUnits / uPerCarton);
  const looseUnits = totalUnits % uPerCarton;

  if (looseUnits === 0) {
    return `${fullCartons} كرتونة`;
  }
  if (fullCartons === 0) {
    return `${looseUnits} قطعة فرط`;
  }
  return `${fullCartons} كرتونة و ${looseUnits} قطعة`;
}

export function getCurrentTimeString(): string {
  try {
    const timeStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `اليوم ${timeStr}`;
  } catch {
    return 'اليوم';
  }
}

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics / tashkeel
    .trim();
}

/**
 * تحويل أي نوع تاريخ (Timestamp من فايربيز، أو رقم بالمللي ثانية، أو نص، أو كائن Date) إلى رقم بالمللي ثانية
 */
export function parseTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * تنسيق التاريخ والوقت باللغة العربية مع توضيح اليوم أو أمس إن وجد
 * مثال: "اليوم 03:15 م" أو "أمس 11:20 ص" أو "3 نوفمبر 2026 - 02:40 م"
 */
export function formatArabicDateTime(val: any): string {
  const ms = parseTimestamp(val);
  if (!ms) return 'غير محدد';
  const date = new Date(ms);

  try {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return `اليوم ${timeStr}`;
    }
    if (isYesterday) {
      return `أمس ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return `${dateStr} - ${timeStr}`;
  } catch {
    return date.toLocaleString('ar-EG');
  }
}

/**
 * تنسيق التاريخ فقط باللغة العربية
 * مثال: "3 نوفمبر 2026"
 */
export function formatArabicDateOnly(val: any): string {
  const ms = parseTimestamp(val);
  if (!ms) return 'غير محدد';
  const date = new Date(ms);
  try {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * حساب الوقت المنقضي بصيغة عربية ودية
 * مثال: "الآن", "منذ 15 دقيقة", "منذ ساعتين", "منذ 3 أيام"
 */
export function formatTimeAgoArabic(val: any): string {
  const ms = parseTimestamp(val);
  if (!ms) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);

  if (diffSec < 60) return 'الآن';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return mins === 1 ? 'منذ دقيقة' : mins === 2 ? 'منذ دقيقتين' : `منذ ${mins} دقيقة`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'منذ يوم';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return `منذ ${days} يوم`;
}
