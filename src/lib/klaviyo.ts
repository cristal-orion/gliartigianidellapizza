import 'dotenv/config';
import type { Customer } from './customers';

const KEY = process.env.KLAVIYO_API_KEY;
const LIST_ID = process.env.KLAVIYO_LIST_ID;
const REVISION = '2024-10-15';

export function klaviyoConfigured(): boolean {
  return !!KEY && !!LIST_ID;
}

/**
 * Iscrive i clienti (con consenso marketing) a una lista Klaviyo.
 * Usa il job "profile-subscription-bulk-create": crea/aggiorna i profili
 * e li iscrive con consenso email marketing. Max 1000 per chiamata.
 */
export async function syncCustomersToKlaviyo(
  customers: Customer[]
): Promise<{ ok: boolean; synced: number; error?: string }> {
  if (!klaviyoConfigured()) {
    return { ok: false, synced: 0, error: 'Klaviyo non configurato (manca KLAVIYO_API_KEY o KLAVIYO_LIST_ID).' };
  }

  const consented = customers.filter((c) => c.marketing && c.email);
  if (consented.length === 0) {
    return { ok: true, synced: 0 };
  }

  const profiles = consented.slice(0, 1000).map((c) => ({
    type: 'profile',
    attributes: {
      email: c.email,
      first_name: c.firstName,
      last_name: c.lastName,
      subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
    },
  }));

  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: 'Prenotazioni sito',
        profiles: { data: profiles },
      },
      relationships: { list: { data: { type: 'list', id: LIST_ID } } },
    },
  };

  try {
    const res = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${KEY}`,
        revision: REVISION,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, synced: 0, error: `Klaviyo ${res.status}: ${txt.slice(0, 200)}` };
    }
    return { ok: true, synced: profiles.length };
  } catch (err: any) {
    return { ok: false, synced: 0, error: err?.message || 'Errore di rete verso Klaviyo.' };
  }
}
