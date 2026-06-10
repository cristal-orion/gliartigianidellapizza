import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Richieste di prenotazione (stato: pending → confirmed | rejected)
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: text('created_at').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:MM
  covers: integer('covers').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  token: text('token'), // link sicuro per conferma/rifiuto da email
  marketingConsent: integer('marketing_consent').notNull().default(0), // opt-in newsletter/promo
});

// Chiusure straordinarie / festività (sovrascrivono gli orari settimanali)
export const closures = sqliteTable('closures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  reason: text('reason'),
});

// Riga singola di configurazione (id = 1)
//  - hours: orari di apertura per il footer  { "0".."6": [{open,close}, ...] }
//  - slots: orari prenotabili per il modulo   { "0".."6": ["19:30", ...] }
//  - menuPath: percorso del PDF menù caricato (null = usa quello di default)
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  hours: text('hours').notNull(),
  slots: text('slots').notNull(),
  menuPath: text('menu_path'),
});

export type Booking = typeof bookings.$inferSelect;
export type Closure = typeof closures.$inferSelect;
