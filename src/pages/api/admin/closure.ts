export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { addClosure, deleteClosure } from '../../../lib/settings';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }

  const form = await request.formData();
  const action = String(form.get('action') || '');

  if (action === 'add') {
    const date = String(form.get('date') || '').trim();
    const reason = String(form.get('reason') || '').trim() || null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) addClosure(date, reason);
  } else if (action === 'delete') {
    const id = parseInt(String(form.get('id') || ''), 10);
    if (Number.isInteger(id)) deleteClosure(id);
  }

  return redirect('/admin?saved=closure', 303);
};
