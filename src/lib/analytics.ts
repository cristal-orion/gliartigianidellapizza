import { db, schema } from '../db';

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function getAnalytics() {
  const all = db.select().from(schema.bookings).all();

  const status = {
    pending: all.filter((b) => b.status === 'pending').length,
    confirmed: all.filter((b) => b.status === 'confirmed').length,
    rejected: all.filter((b) => b.status === 'rejected').length,
  };

  const months = lastMonths(12);
  const bookingsByMonth = months.map(() => 0);
  const coversByMonth = months.map(() => 0);
  const byWeekday = [0, 0, 0, 0, 0, 0, 0]; // 0 = Domenica … 6 = Sabato
  const bySlot: Record<string, number> = {};

  for (const b of all) {
    const ym = b.date.slice(0, 7);
    const mi = months.indexOf(ym);
    if (mi >= 0) {
      bookingsByMonth[mi]++;
      if (b.status === 'confirmed') coversByMonth[mi] += b.covers;
    }
    const wd = new Date(b.date + 'T00:00:00').getDay();
    byWeekday[wd]++;
    bySlot[b.time] = (bySlot[b.time] || 0) + 1;
  }

  const decided = status.confirmed + status.rejected;
  const confirmRate = decided > 0 ? Math.round((status.confirmed / decided) * 100) : 0;
  const totalCovers = all.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.covers, 0);

  const slots = Object.entries(bySlot)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ time, count }));

  return {
    total: all.length,
    status,
    confirmRate,
    totalCovers,
    months,
    bookingsByMonth,
    coversByMonth,
    byWeekday,
    slots,
  };
}
