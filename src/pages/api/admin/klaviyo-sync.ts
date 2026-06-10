export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { getCustomers } from '../../../lib/customers';
import { syncCustomersToKlaviyo } from '../../../lib/klaviyo';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }
  const result = await syncCustomersToKlaviyo(getCustomers(true));
  if (result.ok) {
    return redirect(`/admin/stats?klaviyo=ok&n=${result.synced}`, 303);
  }
  return redirect(`/admin/stats?klaviyo=err&msg=${encodeURIComponent(result.error || 'errore')}`, 303);
};
