// GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD – raw material for the private page site/statistiky/ (tools/stats_page.py).
// Needs the key (header x-key = secret STATS_KEY of the Pages project). Returns one line per sitting and one per expedition;
// the page does the counting, so a new question does not need a new query here.
import { ready, dayOf, json } from './_db.js';

const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };
const isDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

export async function onRequestGet({ request, env }) {
  if (!env.STATS_KEY || !same(request.headers.get('x-key') || '', env.STATS_KEY)) return json({ error: 'key' }, 401);
  try {
    const u = new URL(request.url), today = dayOf(Date.now());
    const from = isDay(u.searchParams.get('from')) ? u.searchParams.get('from') : dayOf(Date.now() - 29 * 864e5);
    const to = isDay(u.searchParams.get('to')) ? u.searchParams.get('to') : today;
    await ready(env);
    const [ses, exps, ups, tot] = await env.DB.batch([
      env.DB.prepare(`SELECT sid, MIN(t) t0, MIN(day) day, MAX(v) v, MAX(dev) dev, MAX(app) app, MAX(own) own, MAX(bot) bot, MAX(cc) cc,
          MAX(k='load') ld, MAX(k='ready') rd, MAX(k='start') st, SUM(k='exp') ex, SUM(k='up') up, SUM(k='camp') camp,
          MAX(CASE WHEN k IN ('ping','bye') THEN a END) play, MAX(CASE WHEN k='ready' THEN a END) ldt,
          MIN(CASE WHEN k IN ('ready','start') THEN n END) n0, MAX(n) n1, MAX(CASE WHEN k='load' THEN s END) ref
        FROM ev WHERE day>=?1 AND day<=?2 GROUP BY sid ORDER BY t0 DESC LIMIT 6000`).bind(from, to),
      env.DB.prepare(`SELECT sid, day, n, a, b, c, d, e, f, s FROM ev WHERE k='exp' AND day>=?1 AND day<=?2 ORDER BY id DESC LIMIT 20000`).bind(from, to),
      env.DB.prepare(`SELECT sid, k, s, a FROM ev WHERE k IN ('up','camp','drill','green') AND day>=?1 AND day<=?2 ORDER BY id DESC LIMIT 20000`).bind(from, to),
      env.DB.prepare(`SELECT COUNT(*) rows, MIN(day) first FROM ev`),
    ]);
    return json({ from, to, today, sessions: ses.results, exps: exps.results, ups: ups.results, total: tot.results[0] });
  } catch (e) { return json({ error: String(e && e.message || e).slice(0, 200) }, 500); }
}
