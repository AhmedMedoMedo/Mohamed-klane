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
