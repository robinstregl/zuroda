// Play statistics (2.13) – shared bits of /api/e (the game writes) and /api/stats (Robin's private page reads).
// The data live in the D1 database bound to the Pages project as DB. One table, one row per event.
// Nothing here can tell one person from another: no cookie, no stored player number, no IP address, no browser string.
// `sid` is a random word the page makes up on every load and never stores, so it only ties together the events of one sitting.
// Columns of `ev`: t = when it arrived (unix seconds) · day = the same as a Prague calendar day · sid = one sitting (one page load) ·
// k = load | ready | start | exp | up | camp | drill | green | ping | bye · v = game version · dev = m (touch) / d (desktop) ·
// app = 1 runs from the home screen · own = 1 a device Robin marked as his (#mine) · bot = 1 looks like a robot ·
// cc = country as Cloudflare reports it · n = expeditions finished so far in that save ·
// a–f = numbers and s = a short word whose meaning depends on k (the list is in CLAUDE.md, "Statistiky hraní").
export const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS ev(id INTEGER PRIMARY KEY, t INTEGER NOT NULL, day TEXT NOT NULL, sid TEXT NOT NULL, k TEXT NOT NULL, v TEXT, dev TEXT, app INTEGER, own INTEGER, bot INTEGER, cc TEXT, n INTEGER, a REAL, b REAL, c REAL, d REAL, e REAL, f REAL, s TEXT)',
  'CREATE INDEX IF NOT EXISTS ev_day ON ev(day)',
  'CREATE INDEX IF NOT EXISTS ev_sid ON ev(sid)',
];
export const KINDS = new Set(['load', 'ready', 'start', 'exp', 'up', 'camp', 'drill', 'green', 'ping', 'bye']);

let made = false; // once per running copy of the function; the statements are harmless to repeat
export async function ready(env) {
  if (made) return;
  await env.DB.batch(SCHEMA.map(q => env.DB.prepare(q)));
  made = true;
}
const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' });
export const dayOf = ms => DAY.format(new Date(ms));
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
