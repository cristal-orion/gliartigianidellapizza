export const prerender = false;
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../db';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { notifyConfirmed, notifyRejected } from '../../../lib/email';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }

  const form = await request.formData();
  const id = parseInt(String(form.get('id') || ''), 10);
  const action = String(form.get('action') || '');
  if (!Number.isInteger(id) || !['confirm', 'reject', 'delete'].includes(action)) {
    return redirect('/admin?error=1', 303);
  }

  const booking = db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).get();
  if (!booking) return redirect('/admin?error=1', 303);

  if (action === 'delete') {
    db.delete(schema.bookings).where(eq(schema.bookings.id, id)).run();
    return redirect('/admin', 303);
  }

  const status = action === 'confirm' ? 'confirmed' : 'rejected';
  db.update(schema.bookings).set({ status }).where(eq(schema.bookings.id, id)).run();

  const fn = action === 'confirm' ? notifyConfirmed : notifyRejected;
  fn({ ...booking, status }).catch((e) => console.error('[admin/booking] email error', e));

  return redirect('/admin', 303);
};
