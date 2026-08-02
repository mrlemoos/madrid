/** Local calendar date as `YYYY-MM-DD` (not UTC `toISOString().slice(0, 10)`). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = String(m).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(y)}-${mm}-${dd}`;
}
