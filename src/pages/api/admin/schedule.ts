export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { updateHours, updateSlots, type WeekHours, type WeekSlots } from '../../../lib/settings';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// "12:30-15:00, 19:00-00:00" → [{open,close}, ...]
function parseRanges(raw: string) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const [open, close] = part.split('-').map((x) => x.trim());
      return open && close ? { open, close } : null;
    })
    .filter((r): r is { open: string; close: string } => !!r && TIME.test(r.open) && TIME.test(r.close));
}

// "19:30, 20:30, 21:30" → ["19:30","20:30","21:30"]
function parseTimes(raw: string) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((t) => TIME.test(t));
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }

  const form = await request.formData();
  const hours: WeekHours = {};
  const slots: WeekSlots = {};
  for (let d = 0; d <= 6; d++) {
    hours[d] = parseRanges(String(form.get(`hours_${d}`) || ''));
    slots[d] = parseTimes(String(form.get(`slots_${d}`) || ''));
  }
  updateHours(hours);
  updateSlots(slots);

  return redirect('/admin?saved=schedule', 303);
};
