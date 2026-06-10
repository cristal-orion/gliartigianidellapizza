import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

export interface HourRange { open: string; close: string }
export type WeekHours = Record<string, HourRange[]>;
export type WeekSlots = Record<string, string[]>;

export function getSettings() {
  const row = db.select().from(schema.settings).where(eq(schema.settings.id, 1)).get()!;
  return {
    hours: JSON.parse(row.hours) as WeekHours,
    slots: JSON.parse(row.slots) as WeekSlots,
    menuPath: row.menuPath as string | null,
  };
}

export function updateHours(hours: WeekHours) {
  db.update(schema.settings).set({ hours: JSON.stringify(hours) }).where(eq(schema.settings.id, 1)).run();
}

export function updateSlots(slots: WeekSlots) {
  db.update(schema.settings).set({ slots: JSON.stringify(slots) }).where(eq(schema.settings.id, 1)).run();
}

export function setMenuPath(path: string) {
  db.update(schema.settings).set({ menuPath: path }).where(eq(schema.settings.id, 1)).run();
}

export function getClosures() {
  return db.select().from(schema.closures).orderBy(schema.closures.date).all();
}

export function addClosure(date: string, reason: string | null) {
  db.insert(schema.closures).values({ date, reason }).run();
}

export function deleteClosure(id: number) {
  db.delete(schema.closures).where(eq(schema.closures.id, id)).run();
}

export const DAYS_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
