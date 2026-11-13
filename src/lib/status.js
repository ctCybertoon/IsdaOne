export const STALE_MS = 5 * 60 * 1000;
export const STATUS = {
  normal:      { icon: '✓', color: '#22C55E' },
  warning:     { icon: '▲', color: '#F59E0B' },
  critical:    { icon: '✕', color: '#EF4444' },
  unavailable: { icon: '?', color: '#64748B' },
};
// A missing, stale, or implausible reading is never "normal".
export function readingState(r, now = Date.now()) {
  if (!r || r.do_mgl == null || r.valid === false || r.do_mgl < 0 || r.do_mgl > 25) return 'invalid';
  return now - new Date(r.recorded_at).getTime() > STALE_MS ? 'stale' : 'live';
}
export function pondStatus(p, r) {
  const s = readingState(r);
  if (s !== 'live') return { key: 'unavailable', label: s === 'stale' ? 'Data stale' : 'No valid reading' };
  if (r.do_mgl < p.do_critical) return { key: 'critical', label: 'Critical' };
  if (r.do_mgl < p.do_warning) return { key: 'warning', label: 'Warning' };
  return { key: 'normal', label: 'Normal' };
}
const RANK = { critical: 3, warning: 2, unavailable: 1, normal: 0 };
export const worst = (list) => list.reduce((a, b) => (RANK[b.key] > RANK[a.key] ? b : a), { key: 'normal' });
export function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}
