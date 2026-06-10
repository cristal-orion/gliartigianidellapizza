export const prerender = false;
import type { APIRoute } from 'astro';
import { checkPassword, makeSession, SESSION_COOKIE, SESSION_MAX_AGE } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') || '');

  if (!checkPassword(password)) {
    return redirect('/admin/login?error=1', 303);
  }

  cookies.set(SESSION_COOKIE, makeSession(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_MAX_AGE,
  });
  return redirect('/admin', 303);
};
