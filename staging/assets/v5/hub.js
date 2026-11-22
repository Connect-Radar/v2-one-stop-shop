/* Connect-Radar hub v5 (staging options A and B share this file). Icons: Lucide (ISC). */
(function () {
  'use strict';
  var RELAY = 'https://v2-hub-chat.w53dc149404.workers.dev';
  var ROOT = document.documentElement.getAttribute('data-root') || '../', STAGE = document.documentElement.getAttribute('data-stage') || '';
  var NS = 'http://www.w3.org/2000/svg';
  var KEY = 'v2hubchat.token', SEEN = 'v2hub.v3.seenNotice', BIG = 'v2hub.v3.big';
  var token = null; try { token = localStorage.getItem(KEY); } catch (e) {}
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function ct(iso, withDay) {
    if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return '';
    var o = { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' };
    if (withDay) { o.weekday = 'short'; o.month = 'short'; o.day = 'numeric'; }
    try { return d.toLocaleString('en-US', o) + ' CT'; } catch (e) { return d.toLocaleString(); }
  }
  function money(n) { return n == null ? '\u2014' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function offline(on) { $('offline').classList.toggle('hide', !on); }
  function ic(n, cls) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'ic' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); var u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#i-' + n); s.appendChild(u); return s; }
  function icHTML(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function btnI(cls, icon, label) { var b = el('button', cls); b.type = 'button'; add(b, ic(icon), document.createTextNode(label)); return b; }
  function ago(iso) {
    var t = new Date(iso).getTime(); if (!iso || isNaN(t)) return ''; var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    return ct(iso, true);
  }
  function stamp(node, iso, pre) {
    if (!node) return; if (!iso) { node.classList.add('hide'); return; } node.classList.remove('hide');
    node.setAttribute('data-ts', iso); node.setAttribute('data-pre', pre || 'Updated '); node.title = ct(iso, true);
    var sp = node.querySelector('span') || node; sp.textContent = (pre || 'Updated ') + ago(iso);
  }
  setInterval(function () { Array.prototype.forEach.call(document.querySelectorAll('[data-ts]'), function (n) { var sp = n.querySelector('span') || n; sp.textContent = n.getAttribute('data-pre') + ago(n.getAttribute('data-ts')); }); }, 30000);
  function skel(n) { var w = el('div', 'card'); for (var i = 0; i < (n || 3); i++) add(w, el('span', 'skel skel-l' + (i === 1 ? ' w2' : i === 2 ? ' w3' : ''))); return w; }
  function hdrH() { var h = $('hdr'); if (h) document.documentElement.style.setProperty('--hdrh', h.offsetHeight + 'px'); }
  window.addEventListener('resize', hdrH); hdrH();
  function dot(c) { return el('span', 'dot ' + (c || 'gray')); }
  function setDot(id, c) { var d = $(id); if (d) d.className = 'dot ' + (c || 'gray'); }
  function setBar(id, pct, warnAt, badAt) {
    var b = $(id); if (!b) return; pct = Math.max(0, Math.min(100, Number(pct) || 0)); b.style.width = pct + '%';
    if (warnAt != null) b.parentNode.className = 'progress ' + (pct >= badAt ? 'bad' : pct >= warnAt ? 'warn' : 'ok');
  }
  function ctDay() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  var SENT = 'v2hub.v4.sent.';
  function sentToday() { try { return JSON.parse(localStorage.getItem(SENT + ctDay()) || '[]'); } catch (e) { return []; } }
  function markSent(id) { var a = sentToday(); if (a.indexOf(id) < 0) a.push(id); try { localStorage.setItem(SENT + ctDay(), JSON.stringify(a)); } catch (e) {} updateApprProgress(); }

  /* ---------- big text ---------- */
  function setBig(on) { document.body.classList.toggle('big', on); $('bigtext').setAttribute('aria-pressed', on ? 'true' : 'false'); try { localStorage.setItem(BIG, on ? '1' : '0'); } catch (e) {} }
  try { if (localStorage.getItem(BIG) === '1') setBig(true); } catch (e) {}
  $('bigtext').addEventListener('click', function () { setBig(!document.body.classList.contains('big')); });

  /* ---------- relay api ---------- */
  function api(path, opts) {
    opts = opts || {}; opts.headers = opts.headers || {}; opts.cache = 'no-store';
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    return fetch(RELAY + path, opts).then(function (r) {
      offline(false);
      if (r.status === 401 && path !== '/api/login') { lock('Please enter the passcode again.'); throw new Error('locked'); }
      return r;
    }, function (e) { offline(true); throw e; });
  }
  function getJSON(path) { return api(path).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  function feed(name) { return getJSON('/api/feed/' + name).then(function (j) { return j.data; }); }

  /* ---------- lock / unlock ---------- */
  var loaded = {};
  function lock(msg) {
    token = null; try { localStorage.removeItem(KEY); } catch (e) {}
    loaded = {}; $('lock-btn').classList.add('hide'); $('lock-status').textContent = msg || '';
    if (pollTimer) clearTimeout(pollTimer);
    show(current, true);
  }
  $('lock-btn').addEventListener('click', function () { lock('Locked on this device.'); });
  $('unlock').addEventListener('click', function () {
    var p = $('pass').value; if (!p) return; $('lock-status').textContent = 'Checking\u2026';
    fetch(RELAY + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: p }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.token) throw new Error(d.message || 'Could not unlock'); return d; }); })
      .then(function (d) { token = d.token; try { localStorage.setItem(KEY, token); } catch (e) {} $('pass').value = ''; $('lock-status').textContent = ''; afterUnlock(); show(current, true); })
      .catch(function (e) { if (e instanceof TypeError) offline(true); $('lock-status').textContent = e instanceof TypeError ? '' : e.message; });
  });
  $('pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('unlock').click(); });
  function afterUnlock() { $('lock-btn').classList.remove('hide'); poll(); loadHomePrivate(); }

  /* ---------- tabs (lazy load) ---------- */
  var LOADERS = {}, current = 'home', loadedAt = {};
  function show(name, force) {
    if (!$('p-' + name)) name = 'home';
    current = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tab[data-tab]'), function (t) { var on = t.getAttribute('data-tab') === name; t.setAttribute('aria-selected', on ? 'true' : 'false'); if (on && t.scrollIntoView) { try { t.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} } });
    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (p) { p.hidden = p.id !== 'p-' + name; });
    var panel = $('p-' + name), gated = panel.getAttribute('data-gated') === '1', partial = panel.getAttribute('data-gated') === 'partial', lc = $('lockcard');
    if (partial && !token) { Array.prototype.forEach.call(panel.children, function (c) { c.classList.remove('gate-hide'); }); panel.insertBefore(lc, panel.children[1] || null); lc.classList.remove('hide'); }
    else if (gated && !token) { panel.insertBefore(lc, panel.children[1] || null); lc.classList.remove('hide'); Array.prototype.forEach.call(panel.children, function (c) { if (c !== lc && c.tagName !== 'H2') c.classList.add('gate-hide'); }); }
    else { lc.classList.add('hide'); Array.prototype.forEach.call(panel.children, function (c) { c.classList.remove('gate-hide'); }); }
    var tb = document.querySelector('.tab[data-tab="' + name + '"]'), tier = tb ? tb.getAttribute('data-tier') : 'bar';
    $('more-btn').classList.toggle('on', tier !== 'bar'); if (tier !== 'more') setMore(false);
    if (name === 'chat') { $('chat-dot').classList.add('hide'); markSeen(); if (document.body.classList.contains('car') && token) setTimeout(function () { try { $('text').focus(); } catch (e) {} }, 150); }
    if (!force) { try { window.scrollTo(0, 0); } catch (e) {} }
    if ((!gated || token) && LOADERS[name] && (force || !loadedAt[name] || Date.now() - loadedAt[name] > 300000)) { loadedAt[name] = Date.now(); LOADERS[name](); }
    if (location.hash !== '#' + name) { try { history.replaceState(null, '', '#' + name); } catch (e) {} }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tab[data-tab]'), function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-tab')); }); });
  function setMore(on) { $('tabs').classList.toggle('open', on); $('more-btn').setAttribute('aria-expanded', on ? 'true' : 'false'); }
  $('more-btn').addEventListener('click', function () { setMore(!$('tabs').classList.contains('open')); });
  Array.prototype.forEach.call(document.querySelectorAll('.tab[data-tab]'), function (t) { t.addEventListener('click', function () { if (window.innerWidth < 900) setMore(false); }); });
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (h && h !== current) show(h); });

  function freshness(parent, d) {
    if (!d) return;
    var at = d.generated_at ? new Date(d.generated_at) : null, old = at && (Date.now() - at.getTime() > 26 * 3600 * 1000);
    var f = el('div', 'fresh' + (old ? ' stale' : '')), sp = el('span');
    add(f, ic('clock', 'sm'), sp, el('span', null, (old ? ' \u00B7 more than a day old' : '') + (d.source ? ' \u00B7 ' + d.source : '')));
    add(parent, f);
    if (d.generated_at) stamp(f, d.generated_at); else sp.textContent = 'Updated ' + (d.generated_at_label || 'time unknown');
  }
  function emptyBox(parent, text, needs) {
    var b = el('div', 'empty'), w = el('div'); add(w, el('div', 'empty-title', text));
    if (needs) add(w, el('div', 'muted', 'To turn it on: ' + needs));
    add(b, ic('inbox'), w);
    add(parent, b); return b;
  }
  function failBox(parent, e) { if (e && e.message === 'locked') return; emptyBox(clear(parent), 'Couldn\u2019t load this right now. Try again in a minute.'); }
  function loading(id) { return add(clear($(id)), skel(3)); }
  function bars(rows, max) {
    var w = el('div', 'bars'); max = max || Math.max.apply(null, rows.map(function (r) { return r.value || 0; }).concat([1]));
    rows.forEach(function (r) {
      var row = el('div', 'barrow'), tr = el('div', 'bartrack'), f = el('div', 'barfill' + (r.stale ? ' stale' : ''));
      f.style.width = Math.max(1, Math.round((r.value || 0) / max * 100)) + '%';
      add(tr, f); add(row, el('div', null, r.label), tr, el('div', null, r.text != null ? r.text : String(r.value))); add(w, row);
    });
    return w;
  }
  function table(head, rows) {
    var t = el('table'), th = el('tr'); head.forEach(function (h) { add(th, el('th', null, h)); }); add(t, add(el('thead'), th));
    var tb = el('tbody'); rows.forEach(function (r) { var tr = el('tr'); r.forEach(function (c) { var td = el('td'); if (c && c.nodeType) td.appendChild(c); else td.textContent = c == null ? '\u2014' : c; add(tr, td); }); add(tb, tr); }); add(t, tb);
    return t;
  }
  function tone(cls, text) { return el('span', 'tone ' + cls, text); }

  /* ---------- status banner (public) ---------- */
  var statusData = null;
  function applyStatus(s) {
    if (!s || typeof s !== 'object') return; statusData = s;
    var light = ['red', 'yellow', 'green'].indexOf(s.light) >= 0 ? s.light : 'yellow';
    $('ambient').className = 'hstat amb amb-' + light; $('headline').className = 'headline ' + light; document.body.setAttribute('data-light', light);
    $('amb-headline').textContent = s.headline || '';
    var n = Number(s.decisions_waiting) || 0, b = (s.blockers || []).length, parts = [];
    if (n) parts.push(n + (n === 1 ? ' decision waiting' : ' decisions waiting'));
    if (b) parts.push(b + (b === 1 ? ' blocker' : ' blockers'));
    $('amb-sub').textContent = (parts.length ? parts.join(' \u00B7 ') : 'Nothing needs you') + (s.updated_at ? ' \u00B7 ' + ago(s.updated_at) : '');
    var nd = s.next_decision;
    $('amb-next').textContent = nd && nd.title ? 'Next: ' + nd.title : 'No decision waiting';
    stamp($('amb-updated'), s.updated_at, 'Status updated ');
    var g = s.usage && s.usage.grok;
    if (g && g.percent_week != null && !grokFeed) { $('g-week').textContent = g.percent_week + '%'; setBar('g-week-bar', g.percent_week); $('g-week-sub').textContent = g.resets_at ? 'Resets ' + ct(g.resets_at, true) : ''; }
    updateHomeTiles();
  }
  function loadStatus() { fetch(ROOT + 'status.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(applyStatus).catch(function () {}); }
  loadStatus(); setInterval(function () { if (!document.hidden) loadStatus(); }, 60000);

  /* ---------- Command Center ---------- */
  var QUICK = ['What needs me?', 'Summarize overnight', 'Costs this month', 'Any blockers?', 'What did the bots do today?', 'Draft a reply to\u2026', 'Remember this: ', 'Plan my evening in Chicago'];
  function prefill(t) { show('chat'); var x = $('text'); x.value = t; try { x.focus(); x.setSelectionRange(t.length, t.length); } catch (e) {} chatStatus(token ? 'Check the text, then tap Send.' : ''); }
  QUICK.forEach(function (q) { var b = btnI('btn', 'zap', q); b.addEventListener('click', function () { prefill(q); }); add($('quick'), b); });
  var CHIPS = ['What needs me?', 'Summarize overnight', 'Any blockers?'], CAR_CHIPS = ['What needs me?', 'Summarize today', 'Any blockers?', 'Costs this month'];
  function renderChips() { var c = clear($('chat-chips')); (isCar() ? CAR_CHIPS : CHIPS).forEach(function (q) { var b = el('button', 'btn', q); b.type = 'button'; b.addEventListener('click', function () { prefill(q); }); add(c, b); }); }
  /* ---------- car mode: Tesla browser or manual toggle ---------- */
  var CAR = 'v2hub.v5.car';
  var carUA = /Tesla|QtCarBrowser/i.test(navigator.userAgent || '');
  function isCar() { return document.body.classList.contains('car'); }
  function setCar(on, save) {
    document.body.classList.toggle('car', on); $('carmode').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (save) { try { localStorage.setItem(CAR, on ? '1' : '0'); } catch (e) {} }
    renderChips(); if (typeof applyMicMode === 'function') applyMicMode(); hdrH();
  }
  (function () { var v = null; try { v = localStorage.getItem(CAR); } catch (e) {} setCar(v === '1' || (v !== '0' && carUA), false); })();
  $('carmode').addEventListener('click', function () { setCar(!isCar(), true); if (isCar() && current === 'chat' && token) try { $('text').focus(); } catch (e) {} });

  function updateHomeTiles() {
    var s = statusData; if (!s) return;
    var nd = s.next_decision, n = Number(s.decisions_waiting) || 0, b = (s.blockers || []).length;
    var hero = $('t-next'), light = ['red', 'yellow', 'green'].indexOf(s.light) >= 0 ? s.light : 'yellow';
    hero.className = 'tile hero ' + (light === 'yellow' ? '' : light);
    setDot('t-next-dot', light);
    $('t-next-title').textContent = nd && nd.title ? nd.title : 'Nothing needs you';
    $('t-next-sub').textContent = (nd && nd.bucket ? nd.bucket + ' \u00B7 ' : '') + n + (n === 1 ? ' decision' : ' decisions') + ' waiting' + (b ? ' \u00B7 ' + b + (b === 1 ? ' blocker' : ' blockers') : '');
    var g = s.usage && s.usage.grok;
    if (g && g.percent_week != null) {
      $('t-grok-val').textContent = g.percent_week + '%'; setBar('t-grok-bar', g.percent_week, 70, 90);
      setDot('t-grok-dot', g.percent_week >= 90 ? 'red' : g.percent_week >= 70 ? 'yellow' : 'green');
      $('t-grok-sub').textContent = g.resets_at ? 'Resets ' + ct(g.resets_at, true) : '';
    } else { $('t-grok-val').textContent = 'Not reported'; setDot('t-grok-dot', 'gray'); }
    stamp($('t-next-upd'), s.updated_at); stamp($('t-grok-upd'), s.updated_at); stamp($('t-appr-upd'), s.updated_at, 'Status updated ');
    updateApprProgress();
  }
  $('t-next-go').addEventListener('click', function () { show('approvals'); });
  function updateApprProgress() {
    var total = apprItems.length || (statusData && Number(statusData.decisions_waiting)) || 0;
    var ids = apprItems.length ? apprItems.map(function (i) { return i.id; }) : null;
    var done = sentToday().filter(function (id) { return !ids || ids.indexOf(id) >= 0; }).length;
    if (total && done > total) done = total;
    var pct = total ? Math.round(done / total * 100) : 0;
    $('t-appr-val').textContent = done + ' of ' + total; setBar('t-appr-bar', pct);
    setDot('t-appr-dot', !total ? 'green' : done >= total ? 'green' : done ? 'yellow' : 'gray');
    $('appr-done-label').textContent = done + ' of ' + total + ' sent today'; setBar('appr-done-bar', pct);
  }
  function renderUptime(d) {
    var list = clear($('t-up-list'));
    if (!token) { $('t-up-val').textContent = '\u2014'; $('t-up-sub').textContent = 'Unlock to see monitors.'; setDot('t-up-dot', 'gray'); return; }
    var mons = (d && d.monitors) || [], ov = d && d.overall;
    if (!d || (!mons.length && ov !== 'down' && ov !== 'degraded')) { $('t-up-val').textContent = 'Starting up'; $('t-up-sub').textContent = (d && d.note) || 'Monitoring starting up. Monitors show here once they report.'; setDot('t-up-dot', 'gray'); return; }
    var c = d.counts || {}, up = c.up != null ? c.up : mons.filter(function (m) { return m.status === 'up'; }).length;
    var down = c.down != null ? c.down : mons.filter(function (m) { return m.status === 'down'; }).length;
    var OV = { up: ['green', 'All up'], degraded: ['yellow', 'Degraded'], down: ['red', 'Down'], unknown: ['gray', 'Unknown'] };
    var o = OV[ov] || (down ? OV.down : up === mons.length ? OV.up : OV.degraded);
    setDot('t-up-dot', o[0]);
    $('t-up-val').textContent = mons.length ? up + ' of ' + mons.length + ' up' : o[1];
    var when = d.updated_at_label || (d.updated_at ? ct(d.updated_at, true) : '');
    var stale = d.updated_at && Date.now() - new Date(d.updated_at).getTime() > 30 * 60000;
    stamp($('t-up-upd'), d.updated_at, 'Checked ');
    $('t-up-sub').textContent = o[1] + (down ? ' \u00B7 ' + down + ' down' : '') + (c.pending ? ' \u00B7 ' + c.pending + ' pending' : '') + (when ? ' \u00B7 checked ' + when : '') + (stale ? ' (stale)' : '') + (ov === 'unknown' && d.note ? ' \u00B7 ' + d.note : '');
    mons.slice(0, 8).forEach(function (m) {
      var col = m.status === 'up' ? 'green' : m.status === 'down' ? 'red' : m.status === 'pending' ? 'yellow' : 'gray';
      var v = (m.uptime_24h != null ? (Math.round(m.uptime_24h * 10) / 10) + '%' : '') + (m.latency_ms != null ? (m.uptime_24h != null ? ' \u00B7 ' : '') + Math.round(m.latency_ms) + ' ms' : '') ;
      if (!v || m.status === 'maintenance') v = (v ? v + ' \u00B7 ' : '') + (m.status === 'up' ? '' : m.status);
      var r = el('div'); r.title = m.last_check_label ? 'Last check ' + m.last_check_label : ''; add(r, dot(col), el('span', 'nm', m.name || 'Monitor'), el('span', 'v', v)); add(list, r);
    });
  }
  function loadHomePrivate() {
    if (!token) { renderUptime(null); return; }
    feed('digest').then(function (d) {
      var box = clear($('digest'));
      if (!d) { emptyBox(box, 'No brief yet. Jarvis posts one each morning.'); return; }
      var c = el('div', 'card'); add(c, add(el('div', 'row'), dot(d.light === 'red' ? 'red' : d.light === 'green' ? 'green' : 'yellow'), el('strong', null, d.title || 'Brief')));
      var ul = el('ul'); (d.lines || []).forEach(function (l) { add(ul, el('li', null, l)); }); add(c, ul);
      freshness(c, d); add(box, c);
    }).catch(function (e) { failBox($('digest'), e); });
    getJSON('/api/context').then(function (j) {
      var box = clear($('ctx')), items = j.items || [];
      if (!items.length) { emptyBox(box, 'Nothing saved yet.', 'tell Jarvis "Remember this: \u2026" in chat or from the car.'); return; }
      var card = el('div', 'card mem');
      items.forEach(function (it) {
        var cat = ['decision', 'roadmap', 'blocker', 'preference'].indexOf(it.category) >= 0 ? it.category : 'other';
        add(card, add(el('div', 'mem-item'), el('span', 'cat ' + cat, cat), el('div', 'mem-text', it.text), el('span', 'mem-time', it.at_label || '')));
      });
      add(box, card);
      if (j.updated_at) add(box, el('div', 'fresh', 'Synced ' + ct(j.updated_at, true) + ' \u00B7 from Context Handoffs'));
    }).catch(function (e) { failBox($('ctx'), e); });
    feed('uptime').then(renderUptime, function () { renderUptime(null); });
  }
  function loadBots() {
    fetch(ROOT + 'bots.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      var g = clear($('bots-grid'));
      (d.bots || []).forEach(function (b) {
        var st = (b.status || 'unknown').toLowerCase();
        var c = el('div', 'bot'); add(c, add(el('div', 'bot-name'), dot(st === 'busy' ? 'yellow' : st === 'idle' ? 'green' : st === 'error' ? 'red' : 'gray'), document.createTextNode(b.name)));
        add(c, el('div', 'muted', (st === 'unknown' ? 'Status unknown' : st[0].toUpperCase() + st.slice(1)) + ' \u00B7 ' + (b.last_turn_label ? 'last seen ' + b.last_turn_label : 'no recent activity seen')));
        add(g, c);
      });
      $('bots-asof').textContent = (d.bots || []).length + ' bots \u00B7 snapshot ' + (d.generated_at ? ago(d.generated_at) : (d.generated_at_label || '')) + ' \u00B7 gray dot = unknown (nothing can see whether a bot is mid-turn).';
    }).catch(function () { $('bots-asof').textContent = 'Bot list not available.'; });
  }
  LOADERS.home = function () { loadBots(); loadHomePrivate(); if (!token) { emptyBox(clear($('digest')), 'Unlock above to see the brief.'); emptyBox(clear($('ctx')), 'Unlock to see saved context.'); } };
  $('ping-btn').addEventListener('click', function () {
    var out = $('ping-out'), t0 = Date.now(); out.textContent = 'Checking\u2026';
    var a = fetch(RELAY + '/api/health', { cache: 'no-store' }).then(function (r) { var ms = Date.now() - t0; return r.json().then(function (h) { return { ok: r.ok, ms: ms, h: h }; }); }).catch(function () { return { ok: false }; });
    var b = fetch(ROOT + 'status.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return null; });
    Promise.all([a, b]).then(function (v) {
      var p = [v[0].ok ? 'Relay up (' + v[0].ms + ' ms)' : 'Relay down'];
      if (v[0].ok && v[0].h && v[0].h.configured) p.push(v[0].h.configured.passcode && v[0].h.configured.jarvis_webhook ? 'Jarvis link on' : 'Jarvis link off');
      p.push('status from ' + (v[1] && (v[1].updated_at_label || v[1].updated_at) || 'unknown'));
      p.push('nothing sent'); out.textContent = p.join(' \u00B7 ');
    });
  });

  /* ---------- Chat ---------- */
  var pending = false, pollTimer = null, lastSig = '', lastList = [];
  var KIND = { decision: 'Decision', blocker: 'Blocker', nothing: 'Nothing needs you', answer: '' };
  function chatStatus(t) { $('chat-status').textContent = t || ''; }
  function time(ms) { try { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }) + ' CT'; } catch (e) { return ''; } }
  function bubble(cls, text, meta, typing) {
    var me = cls === 'jv-me', row = el('div', 'msg ' + (me ? 'me' : 'them'));
    var b = el('div', 'bubble');
    if (typing) { var t = el('span', 'typing'); t.setAttribute('aria-label', 'Jarvis is replying'); add(t, el('i'), el('i'), el('i')); add(b, t); if (text) add(b, el('div', 'meta', text)); }
    else { b.textContent = text; if (meta) add(b, el('div', 'meta', meta)); }
    add(row, el('div', 'avatar', me ? 'S' : 'J'), b);
    return row;
  }
  function render(list) {
    lastList = list;
    var sig = JSON.stringify(list.map(function (m) { return [m.id, m.status, m.reply_at]; }));
    if (sig === lastSig) return; lastSig = sig;
    var log = $('log'), atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 60;
    clear(log); pending = false;
    var nb = clear($('notices'));
    var pushes = list.filter(function (m) { return m.type === 'push' && m.reply_text; });
    pushes.slice(-3).reverse().forEach(function (m) {
      var d = el('div', 'notice ' + (m.reply_kind || ''));
      add(d, el('span', 'badge ' + (m.reply_kind === 'blocker' ? 'breaking' : m.reply_kind === 'nothing' ? 'nice' : 'should-fix'), KIND[m.reply_kind] || 'Notice'), document.createTextNode(m.reply_text), el('div', 'meta', 'Jarvis notice \u00B7 ' + time(m.reply_at)));
      add(nb, d);
    });
    checkAlert(pushes);
    list.filter(function (m) { return m.type !== 'push'; }).forEach(function (m) {
      if (m.text) add(log, bubble('jv-me', m.text, time(m.created) + (m.type === 'decision' ? ' \u00B7 decision' : '')));
      if (m.reply_text) { var k = KIND[m.reply_kind] || ''; add(log, bubble('jv-bot', m.reply_text, 'Jarvis \u00B7 ' + time(m.reply_at) + (k ? ' \u00B7 ' + k : ''))); }
      else if (m.text) {
        var st = m.status || '', dec = m.type === 'decision';
        if (st === 'sending' || st === 'forwarded') { pending = true; add(log, bubble('jv-bot', dec ? 'Waiting for Jarvis to confirm\u2026' : 'Jarvis is replying\u2026 (usually under a minute)', null, true)); }
        else add(log, bubble('jv-bot', st === 'not_connected' ? 'Saved, but the Jarvis link isn\u2019t switched on yet.' : st.indexOf('forward_failed') === 0 ? 'Couldn\u2019t reach Jarvis. Try again later.' : 'Waiting\u2026'));
      }
    });
    if (!log.children.length) add(log, bubble('jv-bot', 'Ask me anything. I answer here in text.'));
    if (atBottom || pending) log.scrollTop = log.scrollHeight;
  }
  function poll() {
    if (pollTimer) clearTimeout(pollTimer);
    if (!token) return;
    if (document.hidden) { pollTimer = setTimeout(poll, 60000); return; }
    getJSON('/api/messages').then(function (d) { if (d.messages) render(d.messages); })
      .catch(function () {})
      .then(function () { if (token) pollTimer = setTimeout(poll, pending ? 4000 : 30000); });
  }
  function send(text) {
    text = (text || '').trim(); if (!text) return;
    if (!token) { show('chat'); return; }
    $('send').disabled = true; chatStatus('Sending\u2026');
    api('/api/messages', { method: 'POST', body: JSON.stringify({ text: text }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.message || 'Send failed'); return d; }); })
      .then(function () { $('text').value = ''; chatStatus(''); pending = true; poll(); })
      .catch(function (e) { if (e.message !== 'locked') chatStatus(e instanceof TypeError ? '' : e.message); })
      .then(function () { $('send').disabled = false; });
  }
  $('send').addEventListener('click', function () { stopMic(); send($('text').value); });
  $('text').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stopMic(); send($('text').value); } });
  LOADERS.chat = function () { poll(); };

  /* ---------- mic: continuous, auto-restart, 2-minute cap ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false, micBase = '', micFinal = '', micStart = 0, capTimer = null, tick = null, restarts = [];
  var CAP_MS = 120000;
  var BACKOFF = [250, 500, 1000, 2000, 4000], backoffI = 0, restartT = null, micGaveUp = false;
  function applyMicMode() {
    var car = isCar(), useMic = !!SR && !car && !micGaveUp;
    if (car && listening) stopMic();
    $('micbar').classList.toggle('hide', !useMic);
    $('mic-hint').classList.toggle('hide', useMic);
    $('mic-hint-t').textContent = car ? 'Tap the keyboard mic to dictate, then tap Send.' : micGaveUp ? 'The page mic kept dropping here. Tap the keyboard mic to dictate, then tap Send.' : 'No page mic in this browser. Tap the keyboard mic to dictate, then tap Send.';
  }
  applyMicMode();
  function mmss(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function micUI(state, note) {
    var m = $('mic'), bar = $('micbar'), on = state === 'listening' || state === 'restarting';
    m.className = 'mic-btn' + (state === 'idle' ? '' : ' ' + state);
    m.setAttribute('aria-label', on ? 'Stop talking' : 'Start talking');
    m.innerHTML = icHTML(on ? 'stop' : 'mic');
    bar.classList.toggle('on', state === 'listening');
    $('mic-stop').classList.toggle('hide', !on);
    $('mic-state').textContent = state === 'listening' ? 'Listening\u2026' : state === 'restarting' ? 'Reconnecting mic\u2026' : state === 'capped' ? 'Stopped at 2:00' : 'Tap the mic and talk';
    if (state === 'idle' || state === 'capped') { $('mic-time').textContent = note || 'Keeps listening through pauses \u00B7 stops by itself at 2:00'; setBar('mic-prog', state === 'capped' ? 100 : 0); }
  }
  function micTick() {
    if (!listening) return; var e = Date.now() - micStart;
    $('mic-time').textContent = mmss(e) + ' / 2:00 \u00B7 ' + mmss(CAP_MS - e) + ' left \u00B7 pauses are fine';
    setBar('mic-prog', e / CAP_MS * 100);
  }
  function micBegin() {
    try {
      rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = function (ev) {
        backoffI = 0;
        if (listening) micUI('listening');
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) micFinal += t.replace(/^\s+/, '') + ' '; else interim += t; }
        $('text').value = micBase + micFinal + interim;
      };
      rec.onerror = function (ev) {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed' || ev.error === 'audio-capture') { listening = false; micGaveUp = true; applyMicMode(); chatStatus('The page mic isn\u2019t allowed here. Use the keyboard mic instead.'); }
      };
      rec.onend = function () {
        rec = null;
        if (!listening) { micDone(); return; }
        if (Date.now() - micStart >= CAP_MS) { micDone('Stopped after 2 minutes. Tap Send, or tap the mic to add more.', true); return; }
        var now = Date.now(); restarts = restarts.filter(function (t) { return now - t < 30000; }); restarts.push(now);
        if (restarts.length >= 10) { micGaveUp = true; micDone('The mic kept dropping (10 times in 30 seconds), so I stopped it. Your words so far are in the box.'); applyMicMode(); return; }
        var wait = BACKOFF[Math.min(backoffI, BACKOFF.length - 1)]; backoffI++;
        micUI('restarting');
        restartT = setTimeout(function () { restartT = null; if (listening) micBegin(); }, wait);
      };
      rec.start();
      setTimeout(function () { if (listening && rec) micUI('listening'); }, 250);
    } catch (e) { micDone('Couldn\u2019t start the mic.'); }
  }
  function micDone(msg, capped) {
    listening = false; if (capTimer) clearTimeout(capTimer); if (tick) clearInterval(tick); capTimer = tick = null;
    var used = micStart ? mmss(Math.min(CAP_MS, Date.now() - micStart)) : '';
    micUI(capped ? 'capped' : 'idle', capped ? 'Tap the mic to keep talking, or Send.' : (used ? 'Last take ' + used + ' \u00B7 tap the mic to add more' : null));
    chatStatus(msg || ($('text').value.trim() ? 'Got it. Tap Send.' : ''));
  }
  function stopMic() { if (restartT) { clearTimeout(restartT); restartT = null; } if (!listening) return; listening = false; try { if (rec) rec.stop(); else micDone(); } catch (e) { micDone(); } }
  $('mic').addEventListener('click', function () {
    if (listening) { stopMic(); return; }
    micBase = $('text').value ? $('text').value.replace(/\s*$/, ' ') : ''; micFinal = ''; restarts = []; backoffI = 0;
    listening = true; micStart = Date.now(); micUI('listening'); micTick(); chatStatus('');
    capTimer = setTimeout(function () { if (listening) { listening = false; try { if (rec) rec.stop(); } catch (e) {} micDone('Stopped after 2 minutes. Tap Send, or tap the mic to add more.', true); } }, CAP_MS);
    tick = setInterval(micTick, 1000); micBegin();
  });
  $('mic-stop').addEventListener('click', stopMic);

  /* ---------- proactive alerts ---------- */
  function seenId() { try { return localStorage.getItem(SEEN) || ''; } catch (e) { return ''; } }
  function markSeen() { var p = lastList.filter(function (m) { return m.type === 'push' && m.reply_text; }); if (p.length) { try { localStorage.setItem(SEEN, p[p.length - 1].id); } catch (e) {} } $('alertbar').classList.add('hide'); document.title = document.title.replace(/^\(\d+\) /, ''); }
  function checkAlert(pushes) {
    if (!pushes.length) return;
    var last = pushes[pushes.length - 1], seen = seenId();
    if (last.id === seen) return;
    var unseen = 0; for (var i = pushes.length - 1; i >= 0 && pushes[i].id !== seen; i--) unseen++;
    if (current === 'chat' && !document.hidden) { markSeen(); return; }
    var bar = $('alertbar'); bar.className = 'alertbar ' + (last.reply_kind || '');
    $('alert-kind').textContent = KIND[last.reply_kind] || 'Notice'; $('alert-text').textContent = last.reply_text;
    $('chat-dot').classList.remove('hide');
    document.title = '(' + unseen + ') ' + document.title.replace(/^\(\d+\) /, '');
    if (document.hidden && window.Notification && Notification.permission === 'granted' && last.id !== notified) {
      notified = last.id;
      try { new Notification('Jarvis: ' + (KIND[last.reply_kind] || 'New notice'), { body: 'Open the hub to read it.', tag: 'v2hub' }); } catch (e) {}
    }
  }
  var notified = '';
  $('alert-open').addEventListener('click', function () { show('chat'); });
  $('alert-dismiss').addEventListener('click', markSeen);
  if (window.Notification && Notification.permission === 'default') $('alerts-on').classList.remove('hide');
  $('alerts-on').addEventListener('click', function () { try { Notification.requestPermission().then(function () { $('alerts-on').classList.add('hide'); }); } catch (e) { $('alerts-on').classList.add('hide'); } });

  /* ---------- Approvals ---------- */
  var BUCKETS = ['Breaking', 'Should-fix', 'Nice-to-have'];
  function badgeFor(b) { return el('span', 'badge ' + (b === 'Breaking' ? 'breaking' : b === 'Should-fix' ? 'should-fix' : 'nice'), b || 'Item'); }
  function decide(item, choice, note) {
    var d = { id: item.id, title: item.title, choice: choice }; if (note) d.note = note;
    return api('/api/messages', { method: 'POST', body: JSON.stringify({ type: 'decision', decision: d }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'Send failed'); return j; }); });
  }
  var LABEL = { approve: 'Yes', defer: 'No', modify: 'Change' };
  function setMark(row, cls, text) { var mark = row.querySelector('.sent'); if (!mark) { mark = el('div', 'sent'); row.appendChild(mark); } mark.className = 'sent ' + cls; mark.textContent = text; return mark; }
  function sendOne(item, row, choice, note) {
    if (!token) { setMark(row, 'err', 'Unlock at the top of this tab, then tap again.'); return Promise.resolve(false); }
    var btns = row.querySelectorAll('.appr-acts button, .appr > .btn'); Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
    setMark(row, 'sending', 'Sending ' + LABEL[choice] + '\u2026');
    return decide(item, choice, note).then(function () {
      row.classList.add('done');
      setMark(row, '', '\u2713 ' + LABEL[choice] + ' sent \u00B7 Jarvis will confirm in Chat before anything changes.');
      var cb = row.querySelector('input[type=checkbox]'); if (cb) { cb.checked = false; cb.disabled = true; }
      markSent(item.id); pending = true; poll(); updateBatch(); return true;
    }).catch(function (e) { setMark(row, 'err', e.message === 'locked' ? 'Unlock first, then tap again.' : e.message); Array.prototype.forEach.call(btns, function (b) { b.disabled = false; }); return false; });
  }
  var apprItems = [];
  function renderApprovals(d) {
    var box = clear($('appr-list')); apprItems = (d && d.items) || [];
    if (!apprItems.length) { emptyBox(box, 'Nothing waiting for you. \u2705'); updateApprProgress(); return; }
    var sent = sentToday();
    BUCKETS.concat(['Other']).forEach(function (bk) {
      var its = apprItems.filter(function (i) { return (BUCKETS.indexOf(i.bucket) < 0 ? 'Other' : i.bucket) === bk; });
      if (!its.length) return; add(box, el('h3', null, bk + ' \u00B7 ' + its.length));
      its.forEach(function (it) {
        var row = el('div', 'appr ' + (it.bucket === 'Breaking' ? 'b-breaking' : it.bucket === 'Should-fix' ? 'b-should' : 'b-nice'));
        var cb = el('input'); cb.type = 'checkbox'; cb.setAttribute('aria-label', 'Select ' + it.title); cb.addEventListener('change', updateBatch); cb._item = it;
        var tx = el('div', 'appr-text'); add(tx, add(el('div', 'appr-title'), badgeFor(it.bucket), document.createTextNode(it.title)), it.detail ? el('div', 'appr-ctx', it.detail) : null);
        var acts = el('div', 'appr-acts');
        var y = btnI('btn approve', 'check', 'Yes'), n = btnI('btn defer', 'x', 'No'), m = btnI('btn modify', 'pencil', 'Change');
        y.type = n.type = m.type = 'button';
        y.addEventListener('click', function () { sendOne(it, row, 'approve'); });
        n.addEventListener('click', function () { sendOne(it, row, 'defer', 'No (from the Approvals tab)'); });
        m.addEventListener('click', function () {
          if (row.querySelector('textarea')) { row.querySelector('textarea').focus(); return; }
          var ta = el('textarea', 'jv-input'); ta.rows = 2; ta.maxLength = 1000; ta.placeholder = 'What should change?'; ta.style.width = '100%';
          var go = el('button', 'btn modify jv-big', 'Send change'); go.type = 'button';
          go.addEventListener('click', function () { if (ta.value.trim()) sendOne(it, row, 'modify', ta.value.trim()).then(function (ok) { if (ok) { ta.remove(); go.remove(); } }); else ta.focus(); });
          add(row, ta, go); ta.focus();
        });
        add(acts, y, n, m); add(row, cb, tx, acts); add(box, row);
        if (sent.indexOf(it.id) >= 0) {
          row.classList.add('done'); cb.disabled = true;
          var again = el('button', 'btn ghost small', 'Change my answer'); again.type = 'button';
          again.addEventListener('click', function () { row.classList.remove('done'); cb.disabled = false; again.remove(); var mk = row.querySelector('.sent'); if (mk) mk.remove(); });
          setMark(row, '', '\u2713 Sent earlier today \u00B7 Jarvis confirms in Chat.'); add(row, again);
        }
      });
    });
    freshness(box, d); updateApprProgress();
  }
  function selected() { return Array.prototype.filter.call(document.querySelectorAll('#appr-list input[type=checkbox]'), function (c) { return c.checked; }); }
  function updateBatch() { var s = selected(); $('batch').classList.toggle('hide', !s.length); $('batch-count').textContent = s.length + ' selected'; disarm(); }
  var armed = null, armTimer = null;
  function disarm() { armed = null; if (armTimer) clearTimeout(armTimer); $('batch-yes').textContent = 'Yes to selected'; $('batch-no').textContent = 'No to selected'; $('batch-yes').classList.remove('armed'); $('batch-no').classList.remove('armed'); }
  function batch(choice, btn) {
    var s = selected(); if (!s.length) return;
    if (armed !== choice) { disarm(); armed = choice; btn.classList.add('armed'); btn.textContent = 'Tap again to send ' + LABEL[choice] + ' \u00D7 ' + s.length; armTimer = setTimeout(disarm, 5000); return; }
    disarm(); var chain = Promise.resolve();
    s.forEach(function (c) { chain = chain.then(function () { return sendOne(c._item, c.closest('.appr'), choice, choice === 'defer' ? 'No (batch, from the Approvals tab)' : null); }); });
    chain.then(updateBatch);
  }
  $('batch-yes').addEventListener('click', function () { batch('approve', this); });
  $('batch-no').addEventListener('click', function () { batch('defer', this); });
  $('batch-clear').addEventListener('click', function () { selected().forEach(function (c) { c.checked = false; }); updateBatch(); });
  LOADERS.approvals = function () {
    loading('appr-list');
    var pub = function () { return fetch(STAGE + 'approvals.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); };
    (token ? feed('approvals').then(function (d) { return d && d.items ? d : pub(); }, pub) : pub())
      .then(renderApprovals).catch(function (e) { failBox($('appr-list'), e); });
  };

  /* ---------- Today ---------- */
  LOADERS.today = function () {
    loading('today');
    feed('today').then(function (d) {
      var box = clear($('today')); if (!d) { emptyBox(box, 'No Today snapshot yet.'); return; }
      var g = el('div', 'grid');
      var a = el('div', 'box'); add(a, el('div', 'muted', d.date_label || 'Today'));
      if (d.weather) { add(a, el('div', 'big-num', d.weather.now_f + '\u00B0F'), el('div', null, d.weather.sky || '')); if (d.weather.today) add(a, el('div', 'muted', 'High ' + d.weather.today.hi + '\u00B0 / low ' + d.weather.today.lo + '\u00B0 \u00B7 rain ' + d.weather.today.rain_pct + '% \u00B7 sunset ' + d.weather.today.sunset)); }
      add(g, a);
      var t = el('div', 'box'); add(t, el('div', 'muted', 'Top 3 for you')); var ol = el('ol'); (d.top3 || []).forEach(function (x) { add(ol, el('li', null, x)); }); if (!(d.top3 || []).length) add(ol, el('li', null, 'Nothing needs you.')); add(t, ol); add(g, t);
      add(box, g);
      add(box, el('h2', null, 'Agenda'));
      if (d.agenda && d.agenda.length) { var ul = el('ul'); d.agenda.forEach(function (x) { add(ul, el('li', null, (x.time ? x.time + ' \u2014 ' : '') + x.title)); }); add(box, ul); }
      else { emptyBox(box, d.agenda_note || 'Calendar not connected.'); var ul2 = el('ul', 'muted'); (d.placeholders || []).forEach(function (x) { add(ul2, el('li', null, x)); }); add(box, ul2); }
      var c = el('div', 'chips'); ['What\u2019s on my calendar today?', 'Plan my day', 'Anything urgent in email?'].forEach(function (q) { var b = el('button', 'btn', q); b.type = 'button'; b.addEventListener('click', function () { prefill(q); }); add(c, b); }); add(box, c);
      freshness(box, d);
    }).catch(function (e) { failBox($('today'), e); });
  };

  /* ---------- Costs ---------- */
  LOADERS.costs = function () {
    loading('costs');
    feed('costs').then(function (d) {
      var box = clear($('costs')); if (!d || d.empty) { emptyBox(box, (d && d.empty) || 'No cost data yet.'); return; }
      var a = d.aws || {}, g = el('div', 'grid');
      var b1 = el('div', 'box'); add(b1, el('div', 'muted', 'AWS this month'), el('div', 'big-num', a.live && a.mtd != null ? money(a.mtd) : 'No live number'), el('div', 'muted', a.live ? 'as of ' + (a.mtd_as_of || '') : (a.last_attempt_result || 'Not checked'))); add(g, b1);
      var b2 = el('div', 'box'); add(b2, el('div', 'muted', 'AWS November forecast'), el('div', 'big-num', money(a.nov_forecast)), el('div', 'muted', a.live ? 'live' : 'stale \u00B7 from ' + (a.last_good_label || 'last good check'))); add(g, b2);
      var b3 = el('div', 'box'); add(b3, el('div', 'muted', 'AWS October (actual)'), el('div', 'big-num', money(a.oct_total)), el('div', 'muted', a.oct_total ? '\u2248 ' + money(a.oct_total / 31) + '/day' : '')); add(g, b3);
      add(box, g);
      if (a.budget) {
        var est = a.live && a.mtd != null ? a.mtd : a.nov_forecast, pc = est != null ? Math.round(est / a.budget * 100) : 0;
        var bb = el('div', 'card'); add(bb, add(el('div', 'row'), el('strong', null, 'November vs budget'), el('span', 'spacer'), el('span', null, money(est) + ' of ' + money(a.budget) + ' (' + pc + '%)')));
        var pg = el('div', 'progress ' + (a.live ? (pc >= 100 ? 'bad' : pc >= 85 ? 'warn' : 'ok') : 'stale')), sp = el('span'); sp.style.width = Math.min(100, pc) + '%'; add(pg, sp); add(bb, pg);
        add(bb, el('div', 'muted', a.live ? 'Month to date vs the AWS budget.' : 'Stale forecast vs the AWS budget (striped). Refresh AWS sign-in for live numbers.' + (a.budget_as_of ? ' Budget as of ' + a.budget_as_of + '.' : '')));
        add(box, bb);
      }
      if (a.note) add(box, el('div', 'confirm-note', a.note));
      if ((d.burn || []).length) { add(box, el('h2', null, 'Burn rate')); add(box, bars(d.burn.map(function (x) { return { label: x.label, value: x.usd, text: money(x.usd), stale: x.stale }; }))); add(box, el('div', 'muted', 'Striped bar = stale estimate. Per day: ' + d.burn.map(function (x) { return x.label.split(' (')[0] + ' ' + money(x.per_day); }).join(' \u00B7 '))); }
      if ((a.top || []).length) { add(box, el('h2', null, 'Top AWS lines' + (a.live ? '' : ' (October, last good data)'))); add(box, bars(a.top.map(function (x) { return { label: x.name, value: x.usd, text: money(x.usd) }; }))); }
      add(box, el('h2', null, 'H&B ledger'));
      var hb = d.hb || {}; if (hb.live) { add(box, table(['Item', 'Amount'], (hb.rows || []).map(function (r) { return [r.label, money(r.usd)]; }))); } else emptyBox(box, hb.note || 'No H&B ledger connected.');
      add(box, el('h2', null, 'Other running costs'));
      var rows = []; if (d.github) rows.push(['GitHub Actions (Nov)', money(d.github.nov_usd) + ' of ' + money(d.github.included_usd) + ' included', d.github.note || '']);
      if (d.grok) rows.push(['Grok Bot extra credits', money(d.grok.credits_left_usd) + ' left', 'Weekly limit only; see Grok Dashboard']);
      add(box, table(['What', 'Amount', 'Note'], rows));
      freshness(box, d);
    }).catch(function (e) { failBox($('costs'), e); });
  };

  /* ---------- Bot Usage ---------- */
  LOADERS.bots = function () {
    loading('usage');
    feed('usage').then(function (d) {
      var box = clear($('usage')); if (!d || d.empty) { emptyBox(box, (d && d.empty) || 'No usage data yet.'); return; }
      add(box, el('h2', null, 'Leaderboard, last 7 days'));
      add(box, el('div', 'muted', (d.window_7d || '') + ' \u00B7 share of all Grok Bot usage \u00B7 active days = days with any usage'));
      add(box, bars((d.leaderboard || []).map(function (x) { return { label: x.bot, value: x.share, text: (x.share < 1 ? '<1' : x.share) + '% \u00B7 ' + x.active_days + 'd' }; }), 100));
      add(box, el('h2', null, 'This week so far'));
      add(box, bars((d.this_week || []).map(function (x) { return { label: x.bot, value: x.share, text: (x.share < 1 ? '<1' : x.share) + '%' }; }), 100));
      add(box, el('h2', null, 'Idle (no usage in 7 days)'));
      if ((d.idle_7d || []).length) add(box, el('div', 'card', d.idle_7d.join(' \u00B7 '))); else add(box, el('div', 'muted', 'Every bot was active.'));
      add(box, el('h2', null, 'Tokens and live busy/idle'));
      add(box, el('div', 'empty', d.tokens_note || 'Not available.')); add(box, el('div', 'muted', d.busy_note || ''));
      freshness(box, d);
    }).catch(function (e) { failBox($('usage'), e); });
  };

  /* ---------- Grok Dashboard ---------- */
  var grokFeed = null;
  function relayHealth() {
    var t0 = Date.now();
    fetch(RELAY + '/api/health', { cache: 'no-store' }).then(function (r) { var ms = Date.now() - t0; return r.json().then(function (h) { return { ok: r.ok, ms: ms, h: h }; }); })
      .then(function (v) {
        offline(!v.ok); var c = v.h && v.h.configured || {}, full = v.ok && c.passcode && c.jarvis_webhook;
        $('g-relay').textContent = v.ok ? 'Up' : 'Down'; $('g-relay-sub').textContent = v.ms + ' ms \u00B7 passcode ' + (c.passcode ? 'on' : 'off') + ' \u00B7 Jarvis link ' + (c.jarvis_webhook ? 'on' : 'off') + ' \u00B7 text replies';
        $('t-relay-val').textContent = v.ok ? 'Up' : 'Down'; setDot('t-relay-dot', !v.ok ? 'red' : full ? 'green' : 'yellow');
        $('t-relay-sub').textContent = v.ms + ' ms \u00B7 ' + (full ? 'Jarvis link on' : 'Jarvis link off'); stamp($('t-relay-upd'), new Date().toISOString(), 'Checked ');
      })
      .catch(function () { offline(true); $('g-relay').textContent = 'Down'; $('g-relay-sub').textContent = 'Use the Grok Bot app until it\u2019s back.'; $('t-relay-val').textContent = 'Down'; setDot('t-relay-dot', 'red'); $('t-relay-sub').textContent = 'Use the Grok Bot app until it\u2019s back.'; });
  }
  LOADERS.grok = function () {
    relayHealth(); var box = clear($('grok'));
    if (!token) { add(box, el('div', 'muted', 'Unlock above for routines, per-feed freshness, and full usage.')); return; }
    add(box, el('div', 'muted', 'Loading\u2026'));
    Promise.all([feed('grok').catch(function () { return null; }), getJSON('/api/feeds').catch(function () { return { feeds: [] }; })]).then(function (v) {
      var d = v[0], fl = v[1].feeds || []; clear(box); grokFeed = d;
      if (d && !d.empty) {
        $('g-week').textContent = d.week_percent + '%'; setBar('g-week-bar', d.week_percent, 70, 90);
        $('g-week-sub').textContent = 'Grok Bot ' + d.week_percent_grok_bot + '% of it' + (d.shared_with_other_apps ? ' (limit shared with other apps)' : '') + ' \u00B7 resets ' + d.resets_label;
        var g = el('div', 'grid');
        var c1 = el('div', 'box'); add(c1, el('div', 'muted', 'Weekly limit'), bars([{ label: 'Used', value: d.week_percent, text: d.week_percent + '%' }], 100), el('div', 'muted', d.light === 'red' ? 'Near the limit' : d.light === 'yellow' ? 'Watch it' : 'Plenty left')); add(g, c1);
        var c2 = el('div', 'box'); add(c2, el('div', 'muted', 'Extra credits'), el('div', 'big-num', money(d.credits_left_usd)), el('div', 'muted', d.credits_left_usd === 0 ? 'When the weekly limit runs out, bots pause until reset.' : '')); add(g, c2);
        add(box, g);
        add(box, el('h2', null, 'Routines'));
        if (d.routines && d.routines.length) add(box, table(['Routine', 'On', 'Last run', 'Result'], d.routines.map(function (r) { return [r.name, r.enabled === true ? 'yes' : r.enabled === false ? 'no' : '?', r.last_run_label, r.last_status]; })));
        else add(box, el('div', 'empty', d.routines_note || 'No routine snapshot yet.'));
        if ((d.routine_usage || []).length) { add(box, el('div', 'muted', 'Usage by routine this week:')); add(box, table(['Routine', 'Share', 'Runs'], d.routine_usage.map(function (r) { return [r.name, (r.share < 1 ? '<1' : r.share) + '%', r.runs_per_week]; }))); }
        add(box, el('div', 'muted', d.rate_limits_note || ''));
        freshness(box, d);
      } else emptyBox(box, 'No usage snapshot yet.');
      add(box, el('h2', null, 'Feed health'));
      if (fl.length) add(box, table(['Feed', 'Updated', 'Age'], fl.map(function (f) { var h = (Date.now() - new Date(f.updated_at).getTime()) / 3600000; return [f.name, ct(f.updated_at, true), h < 1 ? 'fresh' : h < 26 ? Math.round(h) + 'h' : el('span', 'tone warning', Math.round(h / 24) + 'd old')]; })));
      else add(box, el('div', 'muted', 'No feeds yet.'));
    });
  };

  /* ---------- Cursor ---------- */
  LOADERS.cursor = function () {
    loading('cursor');
    feed('cursor').then(function (d) {
      var box = clear($('cursor')); if (!d || d.empty) { emptyBox(box, (d && d.empty) || 'No GitHub snapshot yet.'); return; }
      var g = el('div', 'grid');
      var h = d.heads || {};
      ['stage', 'main'].forEach(function (k) { var x = h[k] || {}; var b = el('div', 'box'); add(b, el('div', 'muted', k === 'stage' ? 'Staging (stage branch)' : 'Production (main)'), el('div', 'big-num', x.sha || '\u2014'), el('div', null, x.title || ''), el('div', 'muted', x.date_label || '')); add(g, b); });
      var ci = el('div', 'box'); add(ci, el('div', 'muted', 'CI'), add(el('div', 'big-num'), tone(d.ci_light === 'red' ? 'danger' : d.ci_light === 'green' ? 'success' : 'idle', d.ci_light === 'red' ? 'Failing' : d.ci_light === 'green' ? 'Passing' : 'Unknown')), el('div', 'muted', d.ci_note || '')); add(g, ci);
      add(box, g);
      add(box, el('div', 'confirm-note', 'Stage vs prod: ' + (d.stage_vs_prod || 'unknown') + '. ' + (d.prod_note || '')));
      add(box, el('h2', null, 'Open PRs (' + d.open_prs + ', ' + d.drafts + ' drafts)'));
      add(box, table(['#', 'Title', 'State', 'Updated'], (d.prs || []).map(function (p) { return ['#' + p.number, p.title, p.draft ? tone('idle', 'Draft') : tone('info', p.author === 'Dependabot' ? 'Dependabot' : 'Open'), p.updated_label]; })));
      add(box, el('h2', null, 'Recent CI runs'));
      add(box, table(['Workflow', 'Where', 'Result', 'When'], (d.ci || []).map(function (r) { return [r.name + ' (' + r.event + ')', r.where, tone(r.result === 'success' ? 'success' : r.result === 'failure' ? 'danger' : 'idle', r.result || '?'), r.at_label]; })));
      var c = el('div', 'chips'); ['Which PRs need me?', 'Why is CI failing?', 'What\u2019s on stage but not in prod?'].forEach(function (q) { var b = el('button', 'btn', q); b.type = 'button'; b.addEventListener('click', function () { prefill(q); }); add(c, b); }); add(box, c);
      freshness(box, d);
    }).catch(function (e) { failBox($('cursor'), e); });
  };

  /* ---------- personal tabs ---------- */
  function personal(name, prompts) {
    return function () {
      loading(name);
      feed(name).then(function (d) {
        var box = clear($(name));
        if (!d || d.empty || !d.live) emptyBox(box, (d && d.empty) || 'Not connected yet.', d && d.needs);
        else if (d.rows) add(box, table(['Item', 'Value'], d.rows.map(function (r) { return [r.label, r.value]; })));
        var c = el('div', 'chips'); prompts.forEach(function (q) { var b = el('button', 'btn', q); b.type = 'button'; b.addEventListener('click', function () { prefill(q); }); add(c, b); }); add(box, el('div', 'muted', 'Ask Jarvis instead:'), c);
        freshness(box, d);
      }).catch(function (e) { failBox($(name), e); });
    };
  }
  LOADERS.finance = personal('finance', ['How\u2019s my spending this month?', 'Any bills due this week?', 'Net worth check']);
  LOADERS.health = personal('health', ['How did I sleep?', 'Should I train hard today?', 'Weekly workout summary']);
  LOADERS.travel = personal('travel', ['Plan a weekend road trip', 'Charging stops to ', 'Upcoming trips']);
  LOADERS.chicago = function () {
    loading('chicago');
    feed('chicago').then(function (d) {
      var box = clear($('chicago')); if (!d) { emptyBox(box, 'No Chicago snapshot yet.'); return; }
      var w = d.weather;
      if (w) {
        var g = el('div', 'grid'); var n = el('div', 'box'); add(n, el('div', 'muted', 'Now'), el('div', 'big-num', w.now_f + '\u00B0F'), el('div', null, w.sky + ' \u00B7 feels ' + w.feels_f + '\u00B0 \u00B7 wind ' + w.wind_mph + ' mph')); add(g, n);
        (w.days || []).forEach(function (x) { var b = el('div', 'box'); add(b, el('div', 'muted', x.date_label), el('div', 'big-num', x.hi + '\u00B0 / ' + x.lo + '\u00B0'), el('div', null, x.sky + ' \u00B7 rain ' + x.rain_pct + '%'), el('div', 'muted', 'Sunset ' + x.sunset)); add(g, b); });
        add(box, g);
      } else emptyBox(box, 'Weather not available right now.');
      add(box, el('h2', null, 'CTA trains'));
      var al = (d.cta && d.cta.alerts) || [];
      if (al.length) add(box, table(['Alert', 'Lines', 'Impact'], al.map(function (a) { var t = el('div'); add(t, el('strong', null, a.headline), el('div', 'muted', a.short)); return [t, a.lines || '\u2014', a.impact]; })));
      else add(box, el('div', 'muted', d.cta && d.cta.ok ? 'No train alerts right now.' : 'CTA alerts not available.'));
      add(box, el('h2', null, 'Going out'));
      emptyBox(box, d.events_note || 'Events not connected.');
      var c = el('div', 'chips'); ['Plan a Chicago night out', 'Good spot for dinner tonight?', 'Anything fun this weekend?'].forEach(function (q) { var b = el('button', 'btn', q); b.type = 'button'; b.addEventListener('click', function () { prefill(q); }); add(c, b); }); add(box, c);
      freshness(box, d);
    }).catch(function (e) { failBox($('chicago'), e); });
  };

  /* ---------- start ---------- */
  document.addEventListener('visibilitychange', function () { if (!document.hidden && token) { poll(); } });
  if (token) afterUnlock();
  show((location.hash || '#home').slice(1) || 'home');
  setInterval(function () { if (!document.hidden) relayHealth(); }, 120000); relayHealth();
})();
