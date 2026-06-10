import 'dotenv/config';
import { Resend } from 'resend';
import type { Booking } from '../db/schema';

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM || 'Gli Artigiani <prenotazioni@gliartigiani.it>';
const MANAGER = process.env.MANAGER_EMAIL || 'info@gliartigiani.it';

const resend = apiKey ? new Resend(apiKey) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // In sviluppo, senza API key, logghiamo invece di inviare
    console.log(`[email non inviata — RESEND_API_KEY assente] → ${to} · ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] invio fallito:', err);
  }
}

function fmtDate(date: string): string {
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return date;
  }
}

const wrap = (body: string) => `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0d0d0d;line-height:1.6">
    <div style="background:#0d0d0d;padding:24px;text-align:center">
      <span style="color:#be3030;font-size:20px;font-weight:700;letter-spacing:2px">GLI ARTIGIANI</span>
    </div>
    <div style="padding:24px">${body}</div>
    <div style="padding:16px 24px;color:#888;font-size:12px;border-top:1px solid #eee">
      Gli Artigiani — Via Santa Rita da Cascia 13, Giugliano in Campania (NA) · 081 506 1549
    </div>
  </div>`;

const details = (b: Booking) => `
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:6px 0;color:#888">Data</td><td style="padding:6px 0;text-align:right;font-weight:600">${fmtDate(b.date)}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Orario</td><td style="padding:6px 0;text-align:right;font-weight:600">${b.time}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Coperti</td><td style="padding:6px 0;text-align:right;font-weight:600">${b.covers}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Nome</td><td style="padding:6px 0;text-align:right;font-weight:600">${b.firstName} ${b.lastName}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Telefono</td><td style="padding:6px 0;text-align:right;font-weight:600">${b.phone}</td></tr>
    ${b.notes ? `<tr><td style="padding:6px 0;color:#888">Note</td><td style="padding:6px 0;text-align:right">${b.notes}</td></tr>` : ''}
  </table>`;

/** Nuova richiesta: avvisa il gestore e conferma la ricezione al cliente. */
export async function notifyNewBooking(b: Booking) {
  await send(
    MANAGER,
    `Nuova richiesta di prenotazione — ${fmtDate(b.date)} ${b.time}`,
    wrap(`<h2 style="margin-top:0">Nuova richiesta da confermare</h2>${details(b)}
      <p>Email cliente: <a href="mailto:${b.email}">${b.email}</a></p>
      <p>Gestisci la richiesta dal pannello: <a href="https://gliartigiani.it/admin">gliartigiani.it/admin</a></p>`)
  );
  await send(
    b.email,
    'Abbiamo ricevuto la tua richiesta — Gli Artigiani',
    wrap(`<h2 style="margin-top:0">Grazie ${b.firstName}!</h2>
      <p>Abbiamo ricevuto la tua richiesta di prenotazione. Ti confermeremo a breve la disponibilità.</p>
      ${details(b)}
      <p style="color:#888;font-size:13px">Questa è una richiesta, non ancora una conferma. Riceverai un'altra email appena il tavolo sarà confermato.</p>`)
  );
}

/** Prenotazione confermata: avvisa il cliente. */
export async function notifyConfirmed(b: Booking) {
  await send(
    b.email,
    `Prenotazione confermata — ${fmtDate(b.date)} ${b.time}`,
    wrap(`<h2 style="margin-top:0;color:#be3030">Tavolo confermato ✓</h2>
      <p>Ciao ${b.firstName}, la tua prenotazione è confermata. Ti aspettiamo!</p>
      ${details(b)}
      <p style="color:#888;font-size:13px">Ti chiediamo di presentarti entro 15 minuti dall'orario prenotato.</p>`)
  );
}

/** Prenotazione rifiutata: avvisa il cliente. */
export async function notifyRejected(b: Booking) {
  await send(
    b.email,
    'Aggiornamento sulla tua prenotazione — Gli Artigiani',
    wrap(`<h2 style="margin-top:0">Richiesta non disponibile</h2>
      <p>Ciao ${b.firstName}, purtroppo non possiamo accogliere la prenotazione per ${fmtDate(b.date)} alle ${b.time}.</p>
      <p>Ti invitiamo a riprovare con un altro orario o a chiamarci allo <strong>081 506 1549</strong>: faremo il possibile per trovarti un posto.</p>`)
  );
}
