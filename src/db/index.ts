import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './data/artigiani.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Creazione tabelle (idempotente) — niente migration tool in produzione
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    covers INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT
  );
  CREATE TABLE IF NOT EXISTS closures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    reason TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    hours TEXT NOT NULL,
    slots TEXT NOT NULL,
    menu_path TEXT
  );
`);

// Migrazione: aggiunge la colonna `token` ai DB creati prima di questa feature
const cols = sqlite.prepare('PRAGMA table_info(bookings)').all() as { name: string }[];
if (!cols.some((c) => c.name === 'token')) {
  sqlite.exec('ALTER TABLE bookings ADD COLUMN token TEXT');
}

export const db = drizzle(sqlite, { schema });

// Default coerenti col footer attuale (indici giorno: 0 = Domenica … 6 = Sabato)
const DEFAULT_HOURS = {
  '0': [{ open: '19:00', close: '00:00' }],
  '1': [{ open: '19:00', close: '00:00' }],
  '2': [],
  '3': [{ open: '19:00', close: '00:00' }],
  '4': [{ open: '19:00', close: '00:00' }],
  '5': [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '00:00' }],
  '6': [{ open: '12:30', close: '15:30' }, { open: '19:00', close: '00:00' }],
};
const DINNER = ['19:30', '20:30', '21:30', '22:30', '23:30'];
const LUNCH = ['12:45', '13:45'];
const DEFAULT_SLOTS = {
  '0': DINNER,
  '1': DINNER,
  '2': [],
  '3': DINNER,
  '4': DINNER,
  '5': [...LUNCH, ...DINNER],
  '6': [...LUNCH, ...DINNER],
};

// Seed della riga di configurazione al primo avvio
const existing = db.select().from(schema.settings).where(eq(schema.settings.id, 1)).get();
if (!existing) {
  db.insert(schema.settings)
    .values({
      id: 1,
      hours: JSON.stringify(DEFAULT_HOURS),
      slots: JSON.stringify(DEFAULT_SLOTS),
      menuPath: null,
    })
    .run();
}

export { schema };
