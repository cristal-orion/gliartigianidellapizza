import { db, schema } from '../db';

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookings: number;
  confirmed: number;
  covers: number;
  lastDate: string;
  marketing: boolean;
}

/** Aggrega le prenotazioni per cliente (chiave: email minuscola). */
export function getCustomers(onlyMarketing = false): Customer[] {
  const all = db.select().from(schema.bookings).all();
  const map = new Map<string, Customer>();

  for (const b of all) {
    const key = b.email.toLowerCase();
    const e =
      map.get(key) ||
      { firstName: b.firstName, lastName: b.lastName, email: b.email, phone: b.phone, bookings: 0, confirmed: 0, covers: 0, lastDate: '', marketing: false };
    e.bookings++;
    e.covers += b.covers;
    if (b.status === 'confirmed') e.confirmed++;
    if (b.marketingConsent) e.marketing = true;
    if (b.date > e.lastDate) {
      e.lastDate = b.date;
      e.firstName = b.firstName;
      e.lastName = b.lastName;
      e.phone = b.phone;
    }
    map.set(key, e);
  }

  let list = [...map.values()].sort((a, b) => b.bookings - a.bookings);
  if (onlyMarketing) list = list.filter((c) => c.marketing);
  return list;
}

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function customersToCSV(customers: Customer[]): string {
  const header = ['Nome', 'Cognome', 'Email', 'Telefono', 'Prenotazioni', 'Confermate', 'Coperti totali', 'Ultima visita', 'Consenso marketing'];
  const rows = customers.map((c) =>
    [c.firstName, c.lastName, c.email, c.phone, c.bookings, c.confirmed, c.covers, c.lastDate, c.marketing ? 'Sì' : 'No']
      .map(csvCell)
      .join(',')
  );
  return [header.join(','), ...rows].join('\r\n');
}
