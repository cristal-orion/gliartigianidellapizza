export const prerender = false;
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../db';
import { notifyConfirmed, notifyRejected } from '../../../lib/email';

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const token = params.token!;
  const form = await request.formData();
  const action = String(form.get('action') || '');

  if (!['confirm', 'reject'].includes(action)) {
    return redirect(`/r/${token}`, 303);
  }

  const booking = db.select().from(schema.bookings).where(eq(schema.bookings.token, token)).get();
  // token mancante o richiesta già gestita → torna alla pagina (mostrerà lo stato)
  if (!booking || booking.status !== 'pending') {
    return redirect(`/r/${token}`, 303);
  }

  const status = action === 'confirm' ? 'confirmed' : 'rejected';
  db.update(schema.bookings).set({ status }).where(eq(schema.bookings.id, booking.id)).run();

  const fn = action === 'confirm' ? notifyConfirmed : notifyRejected;
  fn({ ...booking, status }).catch((e) => console.error('[r/token] email error', e));

  return redirect(`/r/${token}?done=${action}`, 303);
};
