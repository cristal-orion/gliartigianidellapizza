export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { updateManagerEmail } from '../../../lib/settings';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }

  const form = await request.formData();
  const raw = String(form.get('managerEmail') || '').trim();

  // Vuoto = torna al fallback (MANAGER_EMAIL). Altrimenti deve essere valida.
  if (raw && !EMAIL.test(raw)) {
    return redirect('/admin?error=email', 303);
  }

  updateManagerEmail(raw || null);
  return redirect('/admin?saved=notifications', 303);
};
