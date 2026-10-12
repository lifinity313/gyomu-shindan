(function () {
  'use strict';
  var QUESTIONS = window.Diagnosis.QUESTIONS;
  var diagnose = window.Diagnosis.diagnose;
  var INTAKE_COUNT = QUESTIONS.filter(function (q) { return q.kind === 'intake'; }).length;
  var answers = {};
  var index = 0;
  var result = null;
  var $ = function (id) { return document.getElementById(id); };
  var screens = { intro: $('screen-intro'), question: $('screen-question'), gate: $('screen-gate'), thanks: $('screen-thanks') };

  var OICON = {
    industry: { A: '🎓', B: '⚖️', C: '💆', D: '🎨', E: '🧑‍💼' },
    revenue: { A: '🌱', B: '🌿', C: '🌳', D: '🏢', E: '🏙️' },
    worry: { A: '📉', B: '🤷', C: '⏰', D: '🧱', E: '🧭' },
    goal: { A: '🌙', B: '📈', C: '✍️', D: '🏖️', E: '🚀' },
    q1: { A: '📣', B: '🤝', C: '💬', D: '📄', E: '💡' },
    hours: { A: '◔', B: '◑', C: '◕', D: '●' },
    q2: { A: '📣', B: '🤝', C: '💬', D: '📄', E: '💡' },
    q3: { A: '📣', B: '📅', C: '💬', D: '📄', E: '🤷' },
    q4: { A: '📣', B: '🤝', C: '🔁', D: '🧑‍🤝‍🧑', E: '❓' },
    q5: { A: '🌱', B: '📞', C: '🎁', D: '🧪', E: '🧭' },
    q6: { A: '🏃', B: '🚧', C: '🤔', D: '📨', E: '⚙️' },
    leads: { A: '0️⃣', B: '1️⃣', C: '3️⃣', D: '6️⃣', E: '🔟' },
    won: { A: '0️⃣', B: '1️⃣', C: '2️⃣', D: '4️⃣' },
    price: { A: '💴', B: '💴', C: '💰', D: '💰', E: '💎' }
  };

  /* ---------- イラスト ---------- */
  function charSVG(mood) {
    var mouth = { run: 'M96 112 q14 10 28 0', queue: 'M98 114 h24', think: 'M100 116 q10 -8 20 0', buried: 'M98 118 q12 -10 24 0', search: 'M96 110 q14 14 28 0', hero: 'M96 110 q14 14 28 0' }[mood] || 'M96 110 q14 14 28 0';
    var props = {
      hero: [['📣', 20, 50], ['🤝', 180, 40], ['💬', 10, 130], ['📄', 190, 120], ['💡', 110, 18]],
      run: [['💨', 20, 120], ['💨', 30, 150], ['📣', 170, 50], ['📄', 185, 110], ['💦', 150, 70]],
      queue: [['👥', 20, 70], ['👥', 20, 130], ['🚧', 60, 170], ['🚪', 190, 100]],
      think: [['🤝', 175, 60], ['❓', 160, 20], ['💭', 40, 40]],
      buried: [['📨', 15, 150], ['📨', 40, 170], ['📨', 175, 160], ['📨', 190, 130], ['💦', 150, 70]],
      search: [['🔍', 175, 70], ['📊', 25, 90], ['✨', 160, 20]]
    }[mood] || [];
    var sweat = (mood === 'run' || mood === 'buried') ? '<path d="M138 80 q6 8 0 14 q-6 -6 0 -14z" fill="#7cc6ff"/>' : '';
    var brow = (mood === 'think') ? '<path d="M94 86 l12 -4 M126 82 l12 4" stroke="#2f2a26" stroke-width="3" stroke-linecap="round"/>' : '';
    var s = '<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="キャラクター">';
    s += '<circle cx="110" cy="105" r="78" fill="#fff" opacity="0.6"/><ellipse cx="110" cy="186" rx="60" ry="8" fill="#e3d3c0" opacity="0.6"/>';
    s += '<rect x="80" y="122" width="60" height="58" rx="22" fill="#ff7a59"/><rect x="96" y="128" width="28" height="30" rx="10" fill="#ffe9e2"/>';
    s += '<circle cx="110" cy="92" r="40" fill="#ffe1c9"/><path d="M70 86 q40 -46 80 0 q-8 -22 -40 -24 q-32 2 -40 24z" fill="#5b4636"/>';
    s += '<circle cx="97" cy="96" r="4" fill="#2f2a26"/><circle cx="123" cy="96" r="4" fill="#2f2a26"/>';
    s += '<circle cx="88" cy="106" r="6" fill="#ffb3a0" opacity="0.7"/><circle cx="132" cy="106" r="6" fill="#ffb3a0" opacity="0.7"/>';
    s += '<path d="' + mouth + '" stroke="#2f2a26" stroke-width="3" fill="none" stroke-linecap="round"/>' + brow + sweat;
    props.forEach(function (p) { s += '<text x="' + p[1] + '" y="' + p[2] + '" font-size="26">' + p[0] + '</text>'; });
    return s + '</svg>';
  }

  function funnelSVG(stage) {
    var stages = [['lead', '集客', '知ってもらう'], ['talk', '商談', '相談に来る'], ['close', '成約', '決めてもらう'], ['keep', '継続', '続けてもらう']];
    var s = '<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="売上の流れ">', x = 6;
    stages.forEach(function (st, i) {
      var h = 92 - i * 14, y = 20 + (92 - h) / 2, hit = (st[0] === stage);
      var fill = hit ? '#ff7a59' : (stage === 'none' ? '#cfe9e5' : '#2bb3a3');
      s += '<rect x="' + x + '" y="' + y + '" width="72" height="' + h + '" rx="14" fill="' + fill + '"/>';
      s += '<text x="' + (x + 36) + '" y="' + (y + h / 2 - 4) + '" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">' + st[1] + '</text>';
      s += '<text x="' + (x + 36) + '" y="' + (y + h / 2 + 14) + '" text-anchor="middle" font-size="10" fill="#fff">' + st[2] + '</text>';
      if (hit) s += '<text x="' + (x + 36) + '" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#e85f3e">▲ ここが細い</text>';
      if (stage === 'none') s += '<text x="' + (x + 36) + '" y="14" text-anchor="middle" font-size="13" fill="#6f665d">?</text>';
      if (i < 3) s += '<text x="' + (x + 80) + '" y="72" font-size="14" fill="#6f665d">▶</text>';
      x += 86;
    });
    if (stage === 'none') s += '<text x="170" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#2bb3a3">数字を並べて細い所を探す</text>';
    return s + '</svg>';
  }

  /* ---------- 画面 ---------- */
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('active', k === name); });
    window.scrollTo(0, 0);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._id); toast._id = setTimeout(function () { t.classList.remove('show'); }, 1800); }

  function renderQuestion() {
    var q = QUESTIONS[index], total = QUESTIONS.length;
    var pct = Math.round((index / total) * 100);
    $('progress-label').textContent = (index + 1) + ' / ' + total;
    $('progress-pct').textContent = pct + '%';
    $('progress-fill').style.width = pct + '%';
    $('phase').innerHTML = index < INTAKE_COUNT ? '<b>STEP 1</b>　今の状況と目標' : '<b>STEP 2</b>　仕事と数字';
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
      b.querySelector('.oicon').textContent = (OICON[q.id] || {})[letter] || '';
      b.querySelector('.label').textContent = q.options[letter];
      b.querySelector('.mark').textContent = letter;
      b.addEventListener('click', function () { choose(letter); });
      box.appendChild(b);
    });
    var free = $('free');
    if (q.free) {
      free.hidden = !answers[q.id];
      $('free-label').textContent = q.free;
      $('free-input').value = answers[q.id + 'Free'] || '';
    } else { free.hidden = true; }
    $('btn-back').hidden = (index === 0);
  }

  function choose(letter) {
    var q = QUESTIONS[index];
    answers[q.id] = letter;
    if (q.free) {
      /* 自由記述つきの質問は、選んだあとに記入欄を出して「次へ」で進む */
      renderQuestion();
      $('free-input').focus();
      return;
    }
    next();
  }
  function next() {
    var q = QUESTIONS[index];
    if (q.free) answers[q.id + 'Free'] = $('free-input').value;
    if (index < QUESTIONS.length - 1) { index += 1; renderQuestion(); }
    else { finish(); }
  }

  /* ---------- 結果 ---------- */
  function finish() {
    result = diagnose(answers);
    $('progress-fill').style.width = '100%';
    $('result-art').innerHTML = charSVG(result.mood);
    $('r-type').textContent = result.type;
    $('r-tagline').textContent = result.tagline;
    $('form-msg').textContent = '';
    renderReport(result);
    show('gate');
  }

  function renderReport(r) {
    var n = r.numbers;
    $('rp-meta').textContent = '作成日 ' + new Date().toLocaleDateString('ja-JP') + (answers.leadName ? '　' + answers.leadName + ' 様' : '');
    $('rp-art').innerHTML = charSVG(r.mood);
    $('rp-type').textContent = r.type;
    $('rp-tagline').textContent = r.tagline;
    $('rp-headline').textContent = r.headline;
    $('rp-goal').innerHTML = '';
    $('rp-goal').appendChild(document.createTextNode('あなたの3か月後の目標: '));
    $('rp-goal').appendChild(el('b', null, r.intake.goal));

    var ik = $('rp-intake'); ik.innerHTML = '';
    [['お仕事', r.intake.industry], ['月の売上', r.intake.revenue], ['一番の悩み', r.intake.worry + (r.intake.worryFree ? '（' + r.intake.worryFree + '）' : '')], ['3か月後の目標', r.intake.goal]].forEach(function (row) {
      ik.appendChild(el('dt', null, row[0])); ik.appendChild(el('dd', null, row[1]));
    });

    var sc = $('rp-scene'); sc.innerHTML = '';
    r.scene.split('\n').forEach(function (line) { sc.appendChild(el('p', null, line)); });
    var hb = $('rp-habits'); hb.innerHTML = '';
    r.habits.forEach(function (h, i) { var li = el('li'); li.appendChild(el('span', 'hn', String(i + 1))); li.appendChild(el('span', null, h)); hb.appendChild(li); });

    var tiles = $('rp-tiles'); tiles.innerHTML = '';
    function tile(label, value, unit, sub) {
      var d = el('div', 'tile'); d.appendChild(el('div', 'tl', label));
      var v = el('div', 'tv', value); if (unit) v.appendChild(el('small', null, unit)); d.appendChild(v);
      if (sub) d.appendChild(el('div', 'ts', sub)); tiles.appendChild(d);
    }
    tile('手放すと浮く時間（月）', String(Math.round(n.freeMonth)), '時間', '商談' + n.dealsFromTime + '件分');
    tile('成約率', n.ratePct == null ? '—' : String(n.ratePct), n.ratePct == null ? '' : '%', '契約' + n.won + '件 ÷ 相談' + n.leads + '件');
    tile('商談1件の価値', n.dealValue == null ? '—' : String(n.dealValue), n.dealValue == null ? '' : '万円', n.dealValue == null ? '相談が1件あれば出ます' : '単価 × 成約率');
    tile('検討のまま消えた金額（月）', String(n.lostMoney), '万円', '（相談 − 契約）× 単価');
    $('rp-cause').textContent = r.cause;
    $('rp-alone').textContent = r.alone;
    var fl = $('rp-formulas'); fl.innerHTML = '';
    n.formulas.forEach(function (f) { fl.appendChild(el('li', null, f)); });

    var map = $('rp-map'); map.innerHTML = '';
    var topCat = r.release[0].cat;
    r.map.forEach(function (m) {
      var row = el('div', 'mrow' + (m.cat === topCat && m.eligible ? ' top' : ''));
      var ic = el('div', 'micon', m.icon); ic.style.background = m.color + '33'; row.appendChild(ic);
      var mid = el('div'); mid.appendChild(el('div', 'mlabel', m.label));
      var bar = el('div', 'mbar');
      [['time', m.time], ['burden', m.burden], ['deleg', m.delegable]].forEach(function (sg) { if (sg[1] > 0) { var seg = el('div', 'seg seg-' + sg[0]); seg.style.width = (sg[1] / 7 * 100) + '%'; bar.appendChild(seg); } });
      mid.appendChild(bar); row.appendChild(mid);
      row.appendChild(el('div', 'mmarks', (m.isRevenue ? '💰' : '') + (m.isWant ? '⭐' : '')));
      map.appendChild(row);
    });

    var rel = $('rp-release'); rel.innerHTML = '';
    r.release.forEach(function (it, i) {
      var d = el('div', 'item'); d.style.borderLeftColor = it.color;
      var head = el('div', 'item-head'); head.appendChild(el('span', 'iicon', it.icon)); head.appendChild(el('span', 'item-cat', '候補' + (i + 1) + '　' + it.category)); d.appendChild(head);
      var t = el('div', 'item-title', it.title); if (it.revenueProtected) t.appendChild(el('span', 'tag', '定型部分のみ')); d.appendChild(t);
      d.appendChild(el('div', 'item-why', it.why));
      d.appendChild(el('div', 'tools-label', '誰に任せる？'));
      var tools = el('div', 'tools'); it.tools.forEach(function (name) { tools.appendChild(el('span', 'tl' + (/ChatGPT|Perplexity/.test(name) ? ' ai' : ''), name)); }); d.appendChild(tools);
      var det = el('details', 'prompt'); det.open = true;
      det.appendChild(el('summary', null, '🤖 ChatGPT にこう頼む（コピーして貼るだけ）'));
      var body = el('div', 'prompt-body'); body.appendChild(el('div', 'prompt-text', it.prompt)); body.appendChild(el('p', 'card-note', '【 】の中をあなたの内容に置き換えてから送ってください。'));
      det.appendChild(body); d.appendChild(det); rel.appendChild(d);
    });
    $('rp-release-note').textContent = r.releaseNote;

    var foc = $('rp-focus'); foc.innerHTML = '';
    r.focus.forEach(function (it, i) {
      var d = el('div', 'item focus-item');
      var head = el('div', 'item-head'); head.appendChild(el('span', 'iicon', i === 0 ? '🥇' : '🥈')); head.appendChild(el('span', 'item-cat', i === 0 ? '最優先' : '2番目')); d.appendChild(head);
      d.appendChild(el('div', 'item-title', it.title)); d.appendChild(el('div', 'item-why', it.why)); foc.appendChild(d);
    });
    $('rp-focus-note').textContent = r.focusNote;

    $('rp-funnel').innerHTML = funnelSVG(r.funnel.stage);
    $('rp-priority-title').textContent = r.priority.title;
    $('rp-priority-text').textContent = r.priority.text;
    $('rp-priority-bridge').textContent = r.priority.bridge;

    var acts = $('rp-actions'); acts.innerHTML = '';
    r.actions.forEach(function (a) { acts.appendChild(el('li', null, a)); });

    /* 個別相談で決めること（config の事実だけ。空なら隠す） */
    var C = (typeof CONSULT === 'object' && CONSULT) ? CONSULT : {};
    var cb = $('rp-consult-body'); cb.innerHTML = '';
    var ck = el('dl', 'ck'), rows = 0;
    function ckRow(label, val) {
      if (!val || (Array.isArray(val) && !val.length)) return;
      ck.appendChild(el('dt', null, label));
      var dd = el('dd');
      if (Array.isArray(val)) { var ul = el('ul'); val.forEach(function (v) { ul.appendChild(el('li', null, v)); }); dd.appendChild(ul); }
      else dd.textContent = val;
      ck.appendChild(dd); rows++;
    }
    ckRow('時間', C.minutes ? C.minutes + '分' : '');
    ckRow('料金', C.fee);
    ckRow('決めること', C.decides);
    ckRow('持ち帰るもの', C.takeaway);
    ckRow('向いている人', C.fit);
    ckRow('向かない人', C.notFit);
    if (C.noHardSell) ckRow('売り込み', 'その場で申し込みを求めることはしません');
    cb.appendChild(ck);
    $('rp-consult-block').style.display = rows ? '' : 'none';

    var ab = (typeof ABOUT_TEXT === 'string') ? ABOUT_TEXT.trim() : '';
    $('rp-about').textContent = ab;
    $('rp-about-block').style.display = ab ? '' : 'none';

    $('rp-worry').textContent = r.intake.worryFree ? '「' + r.intake.worryFree + '」と書いてくださった件は、相談の最初にお聞きします。' : '';

    var cs = $('rp-consult'); cs.innerHTML = '';
    if (typeof CONSULT_URL === 'string' && CONSULT_URL.trim()) {
      var a = el('a', null, '売上アップのための個別相談はこちら'); a.href = CONSULT_URL.trim(); cs.appendChild(a);
      cs.appendChild(el('small', null, CONSULT_URL.trim()));
    }
  }

  /* ---------- PDF ---------- */
  function buildPdf() {
    var node = $('report');
    return html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 640 }).then(function (canvas) {
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      var pageW = 210, pageH = 297, margin = 0;
      var imgW = pageW - margin * 2;
      var pxPerMm = canvas.width / imgW;
      var pageHpx = Math.floor((pageH - margin * 2) * pxPerMm);
      var y = 0, first = true;
      while (y < canvas.height) {
        var h = Math.min(pageHpx, canvas.height - y);
        var slice = document.createElement('canvas');
        slice.width = canvas.width; slice.height = h;
        slice.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        var img = slice.toDataURL('image/jpeg', 0.85);
        if (!first) pdf.addPage();
        pdf.addImage(img, 'JPEG', margin, margin, imgW, h / pxPerMm);
        first = false; y += h;
      }
      return pdf;
    });
  }

  /* ---------- 送信 ---------- */
  function submitLead(e) {
    e.preventDefault();
    var name = $('lead-name').value.trim(), email = $('lead-email').value.trim();
    var msg = $('form-msg');
    if (!name) { msg.textContent = 'お名前を入力してください'; $('lead-name').focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'メールアドレスの形式を確認してください'; $('lead-email').focus(); return; }
    if (!(typeof LEAD_ENDPOINT === 'string' && LEAD_ENDPOINT.trim())) { msg.textContent = '送信の仕組みを準備中です。もう少しお待ちください。'; return; }
    var btn = $('btn-send'); btn.disabled = true; msg.textContent = 'PDF を作成しています…';
    answers.leadName = name;
    renderReport(result);
    buildPdf().then(function (pdf) {
      msg.textContent = '送信しています…';
      var pdfBase64 = pdf.output('datauristring').split(',')[1];
      var payload = {
        name: name, email: email, intake: result.intake, answers: answers,
        result: { type: result.type, headline: result.headline, numbers: result.numbers, release: result.release.map(function (x) { return x.title; }), focus: result.focus.map(function (x) { return x.title; }), priority: result.priority.title },
        pdf: { filename: 'shindan_' + new Date().toISOString().slice(0, 10) + '.pdf', base64: pdfBase64 },
        source: location.href
      };
      return fetch(LEAD_ENDPOINT.trim(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }).then(function (res) {
      if (!res || !res.ok) throw new Error('send failed ' + (res && res.status));
      $('thanks-text').textContent = email + ' 宛に、診断結果の PDF をお送りしました。';
      show('thanks');
    }).catch(function (err) {
      msg.textContent = '送信できませんでした。時間をおいてもう一度お試しください。';
      btn.disabled = false;
      if (window.console) console.error(err);
    });
  }

  function restart() { answers = {}; result = null; index = 0; $('btn-send').disabled = false; renderQuestion(); show('question'); }

  /* 設定の反映 */
  if (typeof COMPANY_NAME === 'string' && COMPANY_NAME) {
    ['privacy-company', 'footer-company', 'rp-company'].forEach(function (id) { $(id).textContent = COMPANY_NAME; });
  }

  $('hero-art').innerHTML = charSVG('hero');
  $('btn-start').addEventListener('click', function () { index = 0; renderQuestion(); show('question'); });
  $('btn-back').addEventListener('click', function () { if (index > 0) { index -= 1; renderQuestion(); } });
  $('btn-free-next').addEventListener('click', next);
  $('btn-restart').addEventListener('click', restart);
  $('btn-restart2').addEventListener('click', restart);
  $('lead-form').addEventListener('submit', submitLead);

  /* 動作確認用（本番では使わない） */
  window.__shindan = { buildPdf: buildPdf, answers: function () { return answers; }, result: function () { return result; } };
})();
