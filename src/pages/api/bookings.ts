export const prerender = false;
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { db, schema } from '../../db';
import { getSettings, getClosures } from '../../lib/settings';
import { notifyNewBooking } from '../../lib/email';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Richiesta non valida.' }, 400);
  }

  const date = String(body.date || '').trim();
  const time = String(body.time || '').trim();
  const covers = parseInt(body.covers, 10);
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const notes = String(body.notes || '').trim() || null;
  const consent = body.consent === true || body.consent === 'on';

  // Validazione
  if (!date || !time || !firstName || !lastName || !phone || !email) {
    return json({ error: 'Compila tutti i campi obbligatori.' }, 400);
  }
  if (!consent) return json({ error: 'È necessario accettare l’informativa privacy.' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Data non valida.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Email non valida.' }, 400);
  if (!Number.isInteger(covers) || covers < 1 || covers > 30) {
    return json({ error: 'Numero di coperti non valido.' }, 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return json({ error: 'La data scelta è già passata.' }, 400);

  // La data deve essere un giorno con slot e non una chiusura straordinaria
  const { slots } = getSettings();
  const weekday = String(new Date(date + 'T00:00:00').getDay());
  const daySlots = slots[weekday] || [];
  if (daySlots.length === 0) return json({ error: 'Siamo chiusi nel giorno selezionato.' }, 400);
  if (!daySlots.includes(time)) return json({ error: 'Orario non disponibile per questo giorno.' }, 400);

  const closed = getClosures().some((c) => c.date === date);
  if (closed) return json({ error: 'Quel giorno siamo chiusi per chiusura straordinaria.' }, 400);

  const created = db
    .insert(schema.bookings)
    .values({
      createdAt: new Date().toISOString(),
      date, time, covers, firstName, lastName, phone, email, notes,
      status: 'pending',
      token: randomUUID(),
    })
    .returning()
    .get();

  // Le email non devono bloccare la risposta al cliente
  notifyNewBooking(created).catch((e) => console.error('[bookings] email error', e));

  return json({ ok: true });
};
