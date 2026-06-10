export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { getCustomers, customersToCSV } from '../../../lib/customers';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }
  const onlyMarketing = url.searchParams.get('marketing') === '1';
  const csv = customersToCSV(getCustomers(onlyMarketing));
  const name = onlyMarketing ? 'clienti-marketing.csv' : 'clienti.csv';
  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
};
