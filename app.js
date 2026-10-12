(function () {
  'use strict';
  var QUESTIONS = window.Diagnosis.QUESTIONS;
  var diagnose = window.Diagnosis.diagnose;
  var answers = {};
  var index = 0;
  var $ = function (id) { return document.getElementById(id); };
  var screens = { intro: $('screen-intro'), question: $('screen-question'), result: $('screen-result') };

  /* 質問ごとのアイコンとヒント、選択肢のアイコン */
  var OICON = {
    q1: { A: '📣', B: '🤝', C: '💬', D: '📄', E: '💡' },
    hours: { A: '◔', B: '◑', C: '◕', D: '●' },
    q2: { A: '📣', B: '🤝', C: '💬', D: '📄', E: '💡' },
    q3: { A: '📣', B: '📅', C: '💬', D: '📄', E: '🤷' },
    q4: { A: '📣', B: '🤝', C: '🔁', D: '🧑‍🤝‍🧑', E: '❓' },
    q5: { A: '🌱', B: '📞', C: '🎁', D: '🧪', E: '🧭' },
    q6: { A: '🏃', B: '🚧', C: '🤔', D: '📨', E: '⚙️' },
    q7: { A: '🌙', B: '📈', C: '✍️', D: '🏖️', E: '🚀' },
    leads: { A: '0️⃣', B: '1️⃣', C: '3️⃣', D: '6️⃣', E: '🔟' },
    won: { A: '0️⃣', B: '1️⃣', C: '2️⃣', D: '4️⃣' },
    price: { A: '💴', B: '💴', C: '💰', D: '💰', E: '💎' }
  };

  /* ---------- イラスト（インラインSVG） ---------- */
  function charSVG(mood) {
    var mouth = {
      run: 'M96 112 q14 10 28 0', queue: 'M98 114 h24', think: 'M100 116 q10 -8 20 0', buried: 'M98 118 q12 -10 24 0', search: 'M96 110 q14 14 28 0', hero: 'M96 110 q14 14 28 0'
    }[mood] || 'M96 110 q14 14 28 0';
    var props = {
      hero:   [['📣', 20, 50], ['🤝', 180, 40], ['💬', 10, 130], ['📄', 190, 120], ['💡', 110, 18]],
      run:    [['💨', 20, 120], ['💨', 30, 150], ['📣', 170, 50], ['📄', 185, 110], ['💦', 150, 70]],
      queue:  [['👥', 20, 70], ['👥', 20, 130], ['🚧', 60, 170], ['🚪', 190, 100]],
      think:  [['🤝', 175, 60], ['❓', 160, 20], ['💭', 40, 40]],
      buried: [['📨', 15, 150], ['📨', 40, 170], ['📨', 175, 160], ['📨', 190, 130], ['💦', 150, 70]],
      search: [['🔍', 175, 70], ['📊', 25, 90], ['✨', 160, 20]]
    }[mood] || [];
    var sweat = (mood === 'run' || mood === 'buried') ? '<path d="M138 80 q6 8 0 14 q-6 -6 0 -14z" fill="#7cc6ff"/>' : '';
    var brow = (mood === 'think') ? '<path d="M94 86 l12 -4 M126 82 l12 4" stroke="#2f2a26" stroke-width="3" stroke-linecap="round"/>' : '';
    var s = '<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="キャラクター">';
    s += '<circle cx="110" cy="105" r="78" fill="#fff" opacity="0.6"/>';
    s += '<ellipse cx="110" cy="186" rx="60" ry="8" fill="#e3d3c0" opacity="0.6"/>';
    s += '<rect x="80" y="122" width="60" height="58" rx="22" fill="#ff7a59"/>';
    s += '<rect x="96" y="128" width="28" height="30" rx="10" fill="#ffe9e2"/>';
    s += '<circle cx="110" cy="92" r="40" fill="#ffe1c9"/>';
    s += '<path d="M70 86 q40 -46 80 0 q-8 -22 -40 -24 q-32 2 -40 24z" fill="#5b4636"/>';
    s += '<circle cx="97" cy="96" r="4" fill="#2f2a26"/><circle cx="123" cy="96" r="4" fill="#2f2a26"/>';
    s += '<circle cx="88" cy="106" r="6" fill="#ffb3a0" opacity="0.7"/><circle cx="132" cy="106" r="6" fill="#ffb3a0" opacity="0.7"/>';
    s += '<path d="' + mouth + '" stroke="#2f2a26" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += brow + sweat;
    props.forEach(function (p) { s += '<text x="' + p[1] + '" y="' + p[2] + '" font-size="26">' + p[0] + '</text>'; });
    s += '</svg>';
    return s;
  }

  function funnelSVG(stage) {
    var stages = [['lead', '集客', '知ってもらう'], ['talk', '商談', '相談に来る'], ['close', '成約', '決めてもらう'], ['keep', '継続', '続けてもらう']];
    var s = '<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="売上の流れ">';
    var x = 6;
    stages.forEach(function (st, i) {
      var h = 92 - i * 14, y = 20 + (92 - h) / 2;
      var hit = (st[0] === stage);
      var fill = hit ? '#ff7a59' : (stage === 'none' ? '#cfe9e5' : '#2bb3a3');
      s += '<rect x="' + x + '" y="' + y + '" width="72" height="' + h + '" rx="14" fill="' + fill + '"/>';
      s += '<text x="' + (x + 36) + '" y="' + (y + h / 2 - 4) + '" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">' + st[1] + '</text>';
      s += '<text x="' + (x + 36) + '" y="' + (y + h / 2 + 14) + '" text-anchor="middle" font-size="10" fill="#fff">' + st[2] + '</text>';
      if (hit) {
        s += '<text x="' + (x + 36) + '" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#e85f3e">▲ ここが細い</text>';
      }
      if (stage === 'none') s += '<text x="' + (x + 36) + '" y="14" text-anchor="middle" font-size="13" fill="#6f665d">?</text>';
      if (i < 3) s += '<text x="' + (x + 80) + '" y="72" font-size="14" fill="#6f665d">▶</text>';
      x += 86;
    });
    if (stage === 'none') s += '<text x="170" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#2bb3a3">数字を並べて細い所を探す</text>';
    s += '</svg>';
    return s;
  }

  /* ---------- 画面 ---------- */
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('active', k === name); });
    window.scrollTo(0, 0);
  }

  function renderDots() {
    var d = $('dots'); d.innerHTML = '';
    for (var i = 0; i < QUESTIONS.length; i++) {
      var e = document.createElement('span');
      e.className = 'dot' + (i < index ? ' done' : (i === index ? ' now' : ''));
      e.textContent = (i < index) ? '✓' : (i + 1);
      d.appendChild(e);
    }
  }

  function renderQuestion() {
    var q = QUESTIONS[index];
    var pct = Math.round((index / QUESTIONS.length) * 100);
    $('progress-label').textContent = 'Q' + (index + 1) + ' / ' + QUESTIONS.length;
    $('progress-pct').textContent = pct + '%';
    $('progress-fill').style.width = pct + '%';
    renderDots();
    $('question-icon').textContent = q.icon;
    $('question-title').textContent = q.title;
    $('question-hint').textContent = q.hint || '';
    var box = $('options'); box.innerHTML = '';
    Object.keys(q.options).forEach(function (letter) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'option' + (answers[q.id] === letter ? ' selected' : '');
      b.setAttribute('data-letter', letter);
      b.innerHTML = '<span class="oicon"></span><span class="label"></span><span class="mark"></span>';
      b.querySelector('.oicon').textContent = OICON[q.id][letter];
      b.querySelector('.label').textContent = q.options[letter];
      b.querySelector('.mark').textContent = letter;
      b.addEventListener('click', function () { choose(letter); });
      box.appendChild(b);
    });
    $('btn-back').hidden = (index === 0);
  }

  function choose(letter) {
    answers[QUESTIONS[index].id] = letter;
    if (index < QUESTIONS.length - 1) { index += 1; renderQuestion(); }
    else { renderResult(); }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._id); toast._id = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('コピーしました'); }, function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? 'コピーしました' : '長押しでコピーしてください');
  }

  function renderResult() {
    var r = diagnose(answers);
    $('progress-fill').style.width = '100%';
    $('result-art').innerHTML = charSVG(r.mood);
    $('r-type').textContent = r.type;
    $('r-tagline').textContent = r.tagline;
    $('r-headline').textContent = r.headline;

    /* 1週間の場面 */
    var sc = $('r-scene'); sc.innerHTML = '';
    r.scene.split('\n').forEach(function (line) { sc.appendChild(el('p', null, line)); });

    /* やりがちな3つ */
    var hb = $('r-habits'); hb.innerHTML = '';
    r.habits.forEach(function (h, i) { var li = el('li'); li.appendChild(el('span', 'hn', String(i + 1))); li.appendChild(el('span', null, h)); hb.appendChild(li); });

    /* あなたの数字 */
    var n = r.numbers, tiles = $('r-tiles'); tiles.innerHTML = '';
    function tile(label, value, unit, sub) {
      var d = el('div', 'tile'); d.appendChild(el('div', 'tl', label));
      var v = el('div', 'tv', value); if (unit) v.appendChild(el('small', null, unit)); d.appendChild(v);
      if (sub) d.appendChild(el('div', 'ts', sub)); tiles.appendChild(d);
    }
    tile('手放すと浮く時間（月）', String(Math.round(n.freeMonth)), '時間', '商談' + n.dealsFromTime + '件分');
    tile('成約率', n.ratePct == null ? '—' : String(n.ratePct), n.ratePct == null ? '' : '%', '契約' + n.won + '件 ÷ 相談' + n.leads + '件');
    tile('商談1件の価値', n.dealValue == null ? '—' : String(n.dealValue), n.dealValue == null ? '' : '万円', n.dealValue == null ? '相談が1件あれば出ます' : '単価 × 成約率');
    tile('検討のまま消えた金額（月）', String(n.lostMoney), '万円', '（相談 − 契約）× 単価');
    $('r-cause').textContent = r.cause;
    var fl = $('r-formulas'); fl.innerHTML = '';
    n.formulas.forEach(function (f) { fl.appendChild(el('li', null, f)); });

    /* 業務マップ */
    var map = $('r-map'); map.innerHTML = '';
    var topCat = r.release[0].cat;
    r.map.forEach(function (m) {
      var row = el('div', 'mrow' + (m.cat === topCat && m.eligible ? ' top' : ''));
      var ic = el('div', 'micon', m.icon); ic.style.background = m.color + '33';
      row.appendChild(ic);
      var mid = el('div');
      mid.appendChild(el('div', 'mlabel', m.label));
      var bar = el('div', 'mbar');
      [['time', m.time], ['burden', m.burden], ['deleg', m.delegable]].forEach(function (sg) {
        if (sg[1] > 0) { var seg = el('div', 'seg seg-' + sg[0]); seg.style.width = (sg[1] / 7 * 100) + '%'; bar.appendChild(seg); }
      });
      mid.appendChild(bar);
      row.appendChild(mid);
      row.appendChild(el('div', 'mmarks', (m.isRevenue ? '💰' : '') + (m.isWant ? '⭐' : '')));
      map.appendChild(row);
    });

    /* 手放す候補 */
    var rel = $('r-release'); rel.innerHTML = '';
    r.release.forEach(function (it, i) {
      var d = el('div', 'item'); d.style.borderLeftColor = it.color;
      var head = el('div', 'item-head');
      head.appendChild(el('span', 'iicon', it.icon));
      head.appendChild(el('span', 'item-cat', '候補' + (i + 1) + '　' + it.category));
      d.appendChild(head);
      var t = el('div', 'item-title', it.title);
      if (it.revenueProtected) t.appendChild(el('span', 'tag', '定型部分のみ'));
      d.appendChild(t);
      d.appendChild(el('div', 'item-why', it.why));
      d.appendChild(el('div', 'tools-label', '誰に任せる？'));
      var tools = el('div', 'tools');
      it.tools.forEach(function (name) { tools.appendChild(el('span', 'tl' + (/ChatGPT|Perplexity/.test(name) ? ' ai' : ''), name)); });
      d.appendChild(tools);
      var det = el('details', 'prompt');
      var sum = el('summary', null, '🤖 ChatGPTにこう頼む（コピーして貼るだけ）');
      det.appendChild(sum);
      var body = el('div', 'prompt-body');
      body.appendChild(el('div', 'prompt-text', it.prompt));
      var cp = el('button', 'btn btn-mini', '📋 この指示文をコピー'); cp.type = 'button';
      cp.addEventListener('click', function () { copyText(it.prompt); });
      body.appendChild(cp);
      body.appendChild(el('p', 'card-note', '【 】の中をあなたの内容に置き換えてから送ってください。'));
      det.appendChild(body);
      d.appendChild(det);
      rel.appendChild(d);
    });
    $('r-release-note').textContent = r.releaseNote;

    /* 集中する仕事 */
    var foc = $('r-focus'); foc.innerHTML = '';
    r.focus.forEach(function (it, i) {
      var d = el('div', 'item focus-item');
      var head = el('div', 'item-head');
      head.appendChild(el('span', 'iicon', i === 0 ? '🥇' : '🥈'));
      head.appendChild(el('span', 'item-cat', i === 0 ? '最優先' : '2番目'));
      d.appendChild(head);
      d.appendChild(el('div', 'item-title', it.title));
      d.appendChild(el('div', 'item-why', it.why));
      foc.appendChild(d);
    });
    $('r-focus-note').textContent = r.focusNote;

    /* 次の一手 */
    $('r-funnel').innerHTML = funnelSVG(r.funnel.stage);
    $('r-priority-title').textContent = r.priority.title;
    $('r-priority-text').textContent = r.priority.text;
    $('r-priority-bridge').textContent = r.priority.bridge;

    /* アクション（チェック式） */
    var acts = $('r-actions'); acts.innerHTML = '';
    r.actions.forEach(function (a, i) {
      var li = el('li');
      li.appendChild(el('span', 'chk', '✓'));
      var txt = el('span', 'txt');
      txt.appendChild(el('span', 'no', 'アクション ' + (i + 1)));
      txt.appendChild(document.createTextNode(a));
      li.appendChild(txt);
      li.addEventListener('click', function () { li.classList.toggle('done'); });
      acts.appendChild(li);
    });

    show('result');
  }

  function restart() { answers = {}; index = 0; renderQuestion(); show('question'); }

  /* 設定の反映 */
  var consult = $('btn-consult');
  if (typeof CONSULT_URL === 'string' && CONSULT_URL.trim()) {
    consult.href = CONSULT_URL.trim();
  } else {
    consult.href = '#'; consult.removeAttribute('target');
    consult.addEventListener('click', function (e) { e.preventDefault(); });
  }
  if (typeof COMPANY_NAME === 'string' && COMPANY_NAME) {
    $('cta-company').textContent = COMPANY_NAME;
    $('footer-company').textContent = COMPANY_NAME;
  }

  $('hero-art').innerHTML = charSVG('hero');
  $('btn-start').addEventListener('click', function () { index = 0; renderQuestion(); show('question'); });
  $('btn-back').addEventListener('click', function () { if (index > 0) { index -= 1; renderQuestion(); } });
  $('btn-restart').addEventListener('click', restart);
})();
