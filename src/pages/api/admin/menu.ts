export const prerender = false;
import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { isValidSession, SESSION_COOKIE } from '../../../lib/auth';
import { setMenuPath } from '../../../lib/settings';

const dbPath = process.env.DATABASE_PATH || './data/artigiani.db';
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(dirname(dbPath), 'uploads');

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isValidSession(cookies.get(SESSION_COOKIE)?.value)) {
    return redirect('/admin/login', 303);
  }

  const form = await request.formData();
  const file = form.get('menu');
  if (!(file instanceof File) || file.size === 0) {
    return redirect('/admin?error=menu', 303);
  }
  if (file.type !== 'application/pdf') {
    return redirect('/admin?error=menutype', 303);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const dest = join(UPLOAD_DIR, 'menu-artigiani.pdf');
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  setMenuPath(dest);

  return redirect('/admin?saved=menu', 303);
};
