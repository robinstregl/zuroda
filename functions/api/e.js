// POST /api/e – the game reports what happened (src/head.html: __zev). Always answers 204 and never an error:
// statistics must not be able to bother the game.
import { KINDS, ready, dayOf } from './_db.js';

const HOSTS = /(^|\.)zuroda\.com$|(^|\.)zuroda-git\.pages\.dev$|^localhost$|^127\.0\.0\.1$/;
const ROBOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|monitor|scan|curl|wget|python|playwright|puppeteer/i;
const num = (x, lo, hi) => { x = Number(x); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : null; };
const word = (x, n) => typeof x === 'string' ? x.replace(/[^\w .:,|\/-]/g, '').slice(0, n) : null;
const done = () => new Response(null, { status: 204 });

export async function onRequestPost({ request, env }) {
  try {
    let host = ''; try { host = new URL(request.headers.get('origin') || request.headers.get('referer') || '').hostname; } catch (_) {}
    if (!HOSTS.test(host)) return done();                        // only the game's own pages
    const txt = await request.text(); if (!txt || txt.length > 6000) return done();
    const body = JSON.parse(txt), list = (Array.isArray(body) ? body : [body]).slice(0, 12);
    const now = Date.now(), t = Math.floor(now / 1000), day = dayOf(now);
    const bot = ROBOT.test(request.headers.get('user-agent') || '') ? 1 : 0;
    const cc = word((request.cf && request.cf.country) || '', 2) || '';
    const rows = [];
    for (const d of list) {
      if (!d || typeof d !== 'object' || !KINDS.has(d.k) || !/^[a-z0-9]{8,24}$/.test(d.sid || '')) continue;
      rows.push([t, day, d.sid, d.k, /^[0-9][0-9.]{0,7}$/.test(d.v || '') ? d.v : '', d.dev === 'm' ? 'm' : 'd', d.app ? 1 : 0, d.own ? 1 : 0, bot, cc,
        num(d.n, 0, 1e6), num(d.a, -1e7, 1e7), num(d.b, -1e7, 1e7), num(d.c, -1e7, 1e7), num(d.d, -1e7, 1e7), num(d.e, -1e7, 1e7), num(d.f, -1e7, 1e7), word(d.s, 48)]);
    }
    if (!rows.length) return done();
    await ready(env);
    const ins = env.DB.prepare('INSERT INTO ev(t,day,sid,k,v,dev,app,own,bot,cc,n,a,b,c,d,e,f,s) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    await env.DB.batch(rows.map(r => ins.bind(...r)));
  } catch (_) {}
  return done();
}
