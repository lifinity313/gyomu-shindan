(function () {
  'use strict';
  var QUESTIONS = window.Diagnosis.QUESTIONS;
  var diagnose = window.Diagnosis.diagnose;
  var INTAKE_COUNT = QUESTIONS.filter(function (q) { return q.kind === 'intake'; }).length;
  var CTA_LABEL = (typeof CONSULT_LABEL === 'string' && CONSULT_LABEL.trim()) ? CONSULT_LABEL.trim() : '個別相談を申し込む';
  var answers = {};
  var index = 0;
  var result = null;
  var $ = function (id) { return document.getElementById(id); };
  var screens = { intro: $('screen-intro'), question: $('screen-question'), gate: $('screen-gate'), thanks: $('screen-thanks') };

  var OICON = {
    revenue: { A: '🌱', B: '🌿', C: '🌳', D: '🏢', E: '🏙️' },
    worry: { A: '📉', B: '🤷', C: '⏰', D: '🧱', E: '🧭' },
    goal: { A: '🌙', B: '📈', C: '✍️', D: '🏖️', E: '🚀' },
    q1: { A: '📣', B: '🤝', C: '💬', D: '📄', E: '💡' },
    hours: { A: '◔', B: '◑', C: '◕', D: '●', E: '⏰' },
    q3: { A: '📣', B: '📅', C: '💬', D: '📄', E: '🤷' },
    reach: { A: '👤', B: '👥', C: '👥', D: '🧑‍🤝‍🧑', E: '🏟️' },
    q4: { A: '📣', B: '🤝', C: '🧑‍🤝‍🧑', D: '🔍', E: '❓' },
    inquiries: { A: '0️⃣', B: '1️⃣', C: '3️⃣', D: '6️⃣', E: '🔟' },
    qnext: { A: '📅', B: '📄', C: '💬', D: '🐢', E: '🤷' },
    leads: { A: '0️⃣', B: '1️⃣', C: '3️⃣', D: '6️⃣', E: '🔟' },
    qfirst: { A: '👂', B: '📣', C: '💴', D: '🏆', E: '🤷' },
    won: { A: '0️⃣', B: '1️⃣', C: '2️⃣', D: '3️⃣', E: '5️⃣' },
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

  function funnelSVG(stage, note) {
    var stages = [['lead', '集客', '知ってもらう'], ['edu', '教育', '相談したくなる'], ['talk', '商談', '話す'], ['close', '成約', '決めてもらう']];
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
    if (stage === 'none') s += '<text x="170" y="138" text-anchor="middle" font-size="12" font-weight="800" fill="#2bb3a3">' + (note || '数字を並べて細い所を探す') + '</text>';
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
    $('phase').innerHTML = index < INTAKE_COUNT ? '<b>STEP 1</b>　今の状況と目標' : '<b>STEP 2</b>　時間と、集客・教育・商談・成約の数字';
    $('question-icon').textContent = q.icon;
    var q1q = QUESTIONS.filter(function (x) { return x.id === 'q1'; })[0];
    $('question-title').textContent = q.title.replace('{q1}', answers.q1 ? q1q.options[answers.q1] : 'その仕事');
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
    $('result-art').innerHTML = funnelSVG(result.funnel.stage);
    $('r-type').textContent = result.type;
    $('r-tagline').textContent = result.tagline;
    $('form-msg').textContent = '';
    renderReport(result);
    show('gate');
  }

  /* 1枚目の主役の数字と、やめる／集中する の1行（タイプ×数字） */
  function headlineParts(r) {
    var n = r.numbers, k = r.typeKey;
    var q1label = QUESTIONS.filter(function (x) { return x.id === 'q1'; })[0].options[answers.q1];
    var h1, key, go, stop, consult;
    if (k === 'A') {
      h1 = '先月、新しい接点は' + n.reach + '人、問い合わせは' + n.inquiries + '件。新規のお客さん候補が、まず足りていません。';
      key = { num: String(n.reach), unit: '人', label: '先月、新しくつながった人の数', sub: 'フォロワーの増加・名刺・LINE登録を合わせた数。ここが増えないと、問い合わせも個別相談も増えません。' };
      go = '個別相談の申し込み先を1つ作って、固定投稿とプロフィールに置く（予約ページでも、問い合わせフォームでもかまいません）。そのうえで、新しい接点を週に何人作るかを決めて、毎週数える。';
      stop = 'やらないこと: 申し込み先が無いまま投稿や広告を増やすこと。来た人が「DMください」で止まります。';
      consult = 'あなたの今の投稿とプロフィールを見て、申し込み先をどこに置くか、新しい接点を週に何人作るかを一緒に決めます。';
    } else if (k === 'B') {
      h1 = '問い合わせ' + n.inquiries + '件のうち、個別相談まで進んだのは' + n.leads + '件。問い合わせのあとに次の約束が無いので、途中で消えています。';
      key = { num: String(n.lostInq), unit: '件', label: '先月、問い合わせたのに個別相談に進まなかった人', sub: '問い合わせ' + n.inquiries + '件 − 個別相談' + n.leads + '件。新しく集めるより、ここを拾う方が早いです。' };
      go = '問い合わせに返信するとき、文の最後に必ず約束を1つ置く。例:「来週の火曜か木曜で、30分お話しできますか」。相手が1行返すだけで日程が決まる形にする。返信した人の名前と日付を1枚の表に書き、1週間返事が無い人には、同じ約束をもう一度だけ送る。';
      stop = 'やらないこと: 返信の文面を丁寧に直すことに時間を使っても、約束が無ければ往復が増えるだけです。';
      consult = 'あなたの直近の問い合わせ5件を見て、返信の最後に置く約束の文を一緒に作ります。';
    } else if (k === 'C') {
      h1 = '個別相談' + n.leads + '件のうち、契約は' + n.won + '件。残り' + n.lostCount + '件は「検討します」と言って、そのあと連絡が来ていません。';
      key = { num: String(n.lostMoney), unit: '万円', label: '先月、個別相談に来たのに契約にならなかった人の売上の合計', sub: n.lostCount + '件 × 1契約' + n.price + '万円 ＝ ' + n.lostMoney + '万円。新しくお客さんを探すより、ここを1件減らす方が早いです。' };
      go = '個別相談の最初に「何が分かれば決められますか」と聞く。相手が挙げたもの（金額・期間・効果・不安）の順番で説明する。金額は、相手に聞かれる前にこちらから言う。相手は金額を知るまで決められないので、最後まで言わないと「検討します」になります。';
      stop = 'やらないこと: 個別相談の数を増やしても、同じ割合で「検討します」になります。先に決め方を直します。';
      consult = 'あなたの個別相談の流れ（最初の質問・説明の順番・金額の出し方・最後の一言）を一緒に書き直します。';
    } else if (k === 'D') {
      h1 = '問い合わせ' + n.inquiries + '件のうち、個別相談は' + n.leads + '件。返信が翌日以降になるので、返すころには相手の気持ちが冷めています。';
      key = { num: String(Math.round(n.freeMonth)), unit: '時間', label: '毎月、同じ内容の返信と対応に使っている時間', sub: '「' + q1label + '」に週' + n.topHours + '時間。その半分が同じ内容の繰り返しと見た計算です。個別相談' + n.dealsFromTime + '件分の時間です。' };
      go = '今日の返信を書き出し、同じ内容を2回以上書いたものに印を付ける。印の付いた1つを、そのまま使える返信の文（テンプレート）にして、次からは貼るだけにする。空いた時間で、新しい問い合わせにその日のうちに返す。';
      stop = 'やらないこと: 新しい接点を増やしても、今は受けられません。先に時間を空けます。';
      consult = 'あなたの1週間の対応を書き出して、型にできるものと自分に残すものを一緒に仕分けます。';
    } else {
      h1 = '新しい接点' + n.reach + '人 → 問い合わせ' + n.inquiries + '件 → 個別相談' + n.leads + '件 → 契約' + n.won + '件。数字は回っています。次は、一番減り幅が大きい所を1つ直す段階です。';
      if (n.dealValue != null) {
        var up = Math.round(n.leads * n.price * 0.1 * 10) / 10;
        key = { num: String(n.dealValue), unit: '万円', label: '個別相談1件の価値（1契約' + n.price + '万円 × 成約率' + n.ratePct + '%）', sub: '成約率を10ポイント上げると、月' + up + '万円増えます。相談を1件増やすのと、どちらが早いかを数字で決めます。' };
      } else {
        key = { num: String(n.inquiries), unit: '件', label: '先月の問い合わせ', sub: '個別相談が1件入れば、相談1件の価値が出せます。' };
      }
      go = '先月の4つの数（新しい接点→問い合わせ→個別相談→契約）を並べる。一番減り幅が大きい所を1つ選び、今月はそこだけを直す。';
      stop = 'やらないこと: 新しい集客から始めると、減っている所はそのままで、同じ割合で減ります。';
      consult = 'あなたの4つの数字を一緒に出して、今月直す1か所を決めます。';
    }
    return { h1: h1, key: key, stop: stop, go: go, consult: consult };
  }

  function whyBullets(r) {
    var n = r.numbers, out = [];
    var q = {}; QUESTIONS.forEach(function (x) { q[x.id] = x; });
    out.push('先月の数: 新しい接点' + n.reach + '人 → 問い合わせ' + n.inquiries + '件 → 個別相談' + n.leads + '件 → 契約' + n.won + '件（単価' + n.price + '万円）。');
    out.push('新規のお客さんは「' + q.q4.options[answers.q4] + '」から。問い合わせのあとは「' + q.qnext.options[answers.qnext] + '」。');
    out.push('個別相談の最初にするのは「' + q.qfirst.options[answers.qfirst] + '」。');
    out.push('先週いちばん時間を使ったのは「' + q.q1.options[answers.q1] + '」で、週' + n.topHours + '時間。自分でなくてもできる作業は「' + q.q3.options[answers.q3] + '」。');
    return out;
  }

  function renderReport(r) {
    var n = r.numbers, hp = headlineParts(r);
    $('rp-meta').textContent = (answers.leadName ? answers.leadName + ' 様　' : '') + new Date().toLocaleDateString('ja-JP');
    $('rp-type').textContent = r.type;
    $('rp-stop').textContent = hp.h1;
    $('rp-key-label').textContent = hp.key.label;
    $('rp-key-num').textContent = hp.key.num;
    $('rp-key-unit').textContent = hp.key.unit;
    $('rp-key-sub').textContent = hp.key.sub;
    var why = $('rp-why'); why.innerHTML = '';
    whyBullets(r).forEach(function (t) { why.appendChild(el('li', null, t)); });
    $('rp-stop-do').textContent = hp.stop;
    $('rp-go-do').textContent = hp.go;

    /* 個別相談で決めること（config の事実だけ。空なら一文だけ） */
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
    if (rows) cb.appendChild(ck);
    else cb.appendChild(el('p', 'rp-empty', hp.consult));
    $('rp-worry').textContent = r.intake.worryFree ? '「' + r.intake.worryFree + '」と書いてくださった件から始めます。' : '';
    var cs = $('rp-consult'); cs.innerHTML = '';
    if (typeof CONSULT_URL === 'string' && CONSULT_URL.trim()) {
      var link = el('a', null, CTA_LABEL); link.href = CONSULT_URL.trim(); link.id = 'rp-consult-link'; cs.appendChild(link);
      cs.appendChild(el('small', null, CONSULT_URL.trim()));
    }

    /* 2枚目: 5タイプの一覧（自分の行に印） */
    $('rp-type-inline').textContent = r.type;
    var TYPES = window.Diagnosis.TYPES, tbody = $('rp-types').querySelector('tbody'); tbody.innerHTML = '';
    ['A', 'B', 'C', 'D', 'E'].forEach(function (k) {
      var t = TYPES[k], tr = el('tr', k === r.typeKey ? 'me' : '');
      tr.appendChild(el('td', null, t.type));
      tr.appendChild(el('td', null, t.where));
      tr.appendChild(el('td', null, t.sign));
      tr.appendChild(el('td', null, t.first));
      tbody.appendChild(tr);
    });

    /* 3枚目 */
    var sc = $('rp-scene'); sc.innerHTML = '';
    r.scene.split('\n').forEach(function (line) { sc.appendChild(el('p', null, line)); });
    var hb = $('rp-habits'); hb.innerHTML = '';
    r.habits.forEach(function (h, i) { var li = el('li'); li.appendChild(el('span', 'hn', String(i + 1))); li.appendChild(el('span', null, h)); hb.appendChild(li); });
    $('rp-alone').textContent = r.alone;
    $('rp-funnel').innerHTML = funnelSVG(r.funnel.stage);
    $('rp-cause').textContent = r.cause;

    /* 3枚目 */
    var tb = $('rp-release-table').querySelector('tbody'); tb.innerHTML = '';
    r.release.forEach(function (it) {
      var tr = el('tr');
      var td1 = el('td', null, it.title); if (it.revenueProtected) td1.appendChild(el('span', 'tag', '定型部分のみ'));
      tr.appendChild(td1);
      tr.appendChild(el('td', null, it.tools.join('／')));
      tr.appendChild(el('td', null, it.tryToday));
      tb.appendChild(tr);
    });
    $('rp-release-note').textContent = r.releaseNote;
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
    var fl = $('rp-formulas'); fl.innerHTML = '';
    n.formulas.forEach(function (f) { fl.appendChild(el('li', null, f)); });
    var acts = $('rp-actions'); acts.innerHTML = '';
    r.actions.forEach(function (x) { acts.appendChild(el('li', null, x)); });
    $('rp-prompt').textContent = r.release[0].prompt;
    var ab = (typeof ABOUT_TEXT === 'string') ? ABOUT_TEXT.trim() : '';
    $('rp-about').textContent = ab;
    $('rp-about-block').style.display = ab ? '' : 'none';
  }

  /* ---------- PDF（1ページ＝1枚の画像。ボタンの位置に押せるリンクを重ねる） ---------- */
  function buildPdf() {
    var pages = Array.prototype.slice.call(document.querySelectorAll('#report .rp-page'));
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var MM = 210 / 794; // 1px → mm
    var chain = Promise.resolve();
    pages.forEach(function (page, i) {
      chain = chain.then(function () {
        return html2canvas(page, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 }).then(function (canvas) {
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297);
          /* このページにあるリンク（a[href]）を、同じ位置に押せる領域として置く */
          var pr = page.getBoundingClientRect();
          Array.prototype.forEach.call(page.querySelectorAll('a[href]'), function (anchor) {
            var r = anchor.getBoundingClientRect();
            if (!r.width || !r.height) return;
            pdf.link((r.left - pr.left) * MM, (r.top - pr.top) * MM, r.width * MM, r.height * MM, { url: anchor.href });
          });
        });
      });
    });
    return chain.then(function () { return pdf; });
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
        consultUrl: (typeof CONSULT_URL === 'string' && CONSULT_URL.trim()) ? CONSULT_URL.trim() : '',
        ctaLabel: CTA_LABEL,
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

  $('hero-art').innerHTML = funnelSVG('none', 'このどこかが、細くなっています');
  $('btn-start').addEventListener('click', function () { index = 0; renderQuestion(); show('question'); });
  $('btn-back').addEventListener('click', function () { if (index > 0) { index -= 1; renderQuestion(); } });
  $('btn-free-next').addEventListener('click', next);
  $('btn-restart').addEventListener('click', restart);
  $('btn-restart2').addEventListener('click', restart);
  $('lead-form').addEventListener('submit', submitLead);

  /* 動作確認用（本番では使わない） */
  window.__shindan = { buildPdf: buildPdf, answers: function () { return answers; }, result: function () { return result; } };
})();
