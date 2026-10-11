/* 診断ロジック（ブラウザと node の両方で動く純粋関数）
   answers = { q1:'A'..'E', ..., q7:'A'..'E' } → 結果オブジェクト */
(function (root) {
  'use strict';

  var QUESTIONS = [
    { id: 'q1', title: '現在、最も時間を使っている業務は？',
      options: { A: 'SNS発信・集客活動', B: '営業・商談・提案', C: '顧客対応・サービス提供', D: '事務・日程調整・資料作成', E: '商品開発・企画・経営戦略' } },
    { id: 'q2', title: '最も負担を感じている業務は？',
      options: { A: 'SNS発信・集客活動', B: '営業・商談・提案', C: '顧客対応・サービス提供', D: '事務・日程調整・資料作成', E: '商品開発・企画・経営戦略' } },
    { id: 'q3', title: '自分以外の人やAIでも対応できそうな業務は？',
      options: { A: 'SNS発信・集客活動', B: '営業準備・日程調整・顧客管理', C: '顧客対応の一部', D: '事務・資料作成', E: '特に思いつかない' } },
    { id: 'q4', title: '現在、最も売上につながっている活動は？',
      options: { A: 'SNS・広告などの集客', B: '商談・営業・提案', C: '既存顧客へのサービス提供・継続契約', D: '紹介・人脈づくり', E: '何が売上につながっているかわからない' } },
    { id: 'q5', title: '本当はもっと時間を使いたいことは？',
      options: { A: '新しい見込み客との接点づくり', B: '商談・提案・成約活動', C: '顧客への価値提供', D: '商品開発・新規事業', E: '経営戦略・仕組みづくり' } },
    { id: 'q6', title: '現在の集客・売上の仕組みは？',
      options: { A: '自分が動かないと新規顧客が増えない', B: '集客はできるが商談につながらない', C: '商談はあるが成約につながらない', D: '既存顧客の対応で新規集客に時間を使えない', E: 'ある程度仕組み化できている' } },
    { id: 'q7', title: '今、最も改善したいことは？',
      options: { A: '業務時間を減らしたい', B: '集客を安定させたい', C: '商談・成約を増やしたい', D: '自分がいなくても業務が回る状態にしたい', E: '売上をさらに拡大したい' } }
  ];

  /* 業務カテゴリ（Q1・Q2の選択肢と同じ5分類） */
  var CAT_BY_LETTER = { A: 'sns', B: 'sales', C: 'service', D: 'admin', E: 'dev' };
  var CATS = {
    sns:     { label: 'SNS発信・集客活動', icon: '📣', color: '#ff7a59',
               tools: ['ChatGPT', 'Canva', '予約投稿ツール'],
               prompt: 'あなたはSNS運用のプロです。私は【あなたの職業・対象のお客様】です。次のテーマで、Instagram／Threads向けの投稿文を3案、各150字以内で書いてください。1行目は読者が思わず止まる一言にしてください。\nテーマ：【ここにテーマ】\n読者の悩み：【ここに悩み】',
               routine: '投稿の下書き作成・画像づくり・予約投稿',
               keep: '発信の方針と、反応してくれた人への返信',
               tryToday: '次の投稿1本の下書きをAIに出させ、直すのにかかった時間を測る' },
    sales:   { label: '営業・商談・提案', icon: '🤝', color: '#2bb3a3',
               tools: ['ChatGPT', '日程予約ツール（TimeRex・Googleカレンダー予約）', 'スプレッドシート'],
               prompt: '次の商談相手に送る日程調整メールを、丁寧で短い文面で書いてください。候補日を3つ入れ、相手が1行返すだけで決まる形にしてください。\n相手：【会社名・お名前】\n候補日：【日時を3つ】\n商談の目的：【ここに目的】',
               routine: '商談前の資料準備・日程調整・見込み客リストの管理',
               keep: '商談・提案そのもの',
               tryToday: '次の商談の日程調整を、予約ページかテンプレート返信で済ませる' },
    service: { label: '顧客対応・サービス提供', icon: '💬', color: '#8b7cf6',
               tools: ['ChatGPT', 'LINE公式アカウントの自動応答', 'よくある質問ページ'],
               prompt: 'お客様からよく来る次の質問に対する返信テンプレートを作ってください。丁寧で簡潔に、3〜5行、最後に次の案内を1行添えてください。\n質問：【ここに質問】\n私のサービス：【ここにサービス内容】\n伝えたい結論：【ここに結論】',
               routine: '定型の問い合わせ対応・よくある質問への回答・納品物の整形',
               keep: '顧客ごとに判断が要る対応と、価値を届ける部分',
               tryToday: '一番多い質問を1つ選び、回答テンプレートを作って次回はそれを貼る' },
    admin:   { label: '事務・日程調整・資料作成', icon: '📄', color: '#ffc857',
               tools: ['ChatGPT', '請求書ツール（freee・マネーフォワード）', 'オンライン秘書'],
               prompt: '次の内容で、お客様へ送る資料の構成案（見出しと各見出しの要点）を作ってください。A4で3枚以内、専門用語は使わず、お客様が決めやすい順番にしてください。\n資料の目的：【ここに目的】\n読む人：【ここに相手】\n入れたい内容：【箇条書きで】',
               routine: '日程調整・請求書や資料のひな形づくり・経費処理',
               keep: '最終的な確認と承認',
               tryToday: '次に作る請求書か資料を、ひな形から作るかAIに下書きさせる' },
    dev:     { label: '商品開発・企画・経営戦略', icon: '💡', color: '#5ec27f',
               tools: ['ChatGPT（Deep Research）', 'Perplexity', 'Canva'],
               prompt: '【業界】で【対象のお客様】向けに【サービス内容】を提供しています。競合3社の特徴・価格帯・強みを表で整理し、出典のURLも付けてください。最後に、私が差別化できそうな切り口を3つ挙げてください。',
               routine: '市場調査の下調べ・企画書や資料の整形',
               keep: '何を作るか、どこへ向かうかを決めること',
               tryToday: '次の企画の下調べをAIに出させ、自分は読んで判断するだけにする' }
  };

  /* Q3 の選択肢を業務カテゴリに対応づける（文言が他の設問と違うため内部で変換） */
  var Q3_MAP = {
    A: [{ cat: 'sns', pts: 3 }],
    B: [{ cat: 'sales', pts: 3 }, { cat: 'admin', pts: 1 }],  /* 営業準備・日程調整・顧客管理＝営業の定型部分＋事務 */
    C: [{ cat: 'service', pts: 3 }],
    D: [{ cat: 'admin', pts: 3 }],
    E: []
  };

  /* Q4（売上につながっている活動）と Q5（時間を使いたいこと） */
  var Q4_MAP = {
    A: { cat: 'sns',      label: '見込み客との接点づくり（SNS・広告）' },
    B: { cat: 'sales',    label: '見込み客との商談・提案' },
    C: { cat: 'service',  label: '既存顧客への価値提供と継続契約' },
    D: { cat: 'referral', label: '紹介が生まれる関係づくり' },
    E: { cat: 'unknown',  label: '何が売上につながっているかの把握' }
  };
  var Q5_MAP = {
    A: { cat: 'sns',      label: '新しい見込み客との接点づくり' },
    B: { cat: 'sales',    label: '商談・提案・成約活動' },
    C: { cat: 'service',  label: '顧客への価値提供' },
    D: { cat: 'dev',      label: '商品開発・新規事業' },
    E: { cat: 'strategy', label: '経営戦略・仕組みづくり' }
  };

  /* Q6（現状）→ 次の一手 */
  var Q6_MAP = {
    A: { type: 'ひとり走り回りタイプ', tagline: '自分が動いた分だけ売上が立つ', mood: 'run', stage: 'lead', stageNote: '入口が自分の手作業に頼っている',
         headline: '集客の導線',
         title: '集客導線の仕組み化',
         text: '新しい集客施策を増やす前に、見込み客があなたを知ってから相談に来るまでの流れを、自分が動かなくても進む形に整えましょう。',
         actions: [
           '今週の新規の問い合わせや反応が、どこから来たかを3件書き出す（SNS・紹介・検索など）',
           'プロフィールや固定投稿に「相談の入口」（予約リンクか問い合わせ先）を1か所置く'
         ] },
    B: { type: '入口渋滞タイプ', tagline: '人は集まるのに、相談まで進まない', mood: 'queue', stage: 'talk', stageNote: '集客から商談への間で止まっている',
         headline: '見込み客から相談への流れ',
         title: '見込み客の教育・相談予約導線の改善',
         text: '新しい集客施策を増やす前に、既存の見込み客が個別相談へ進む導線を整えましょう。',
         actions: [
           '直近の問い合わせやフォロワーのうち、相談に進まなかった人を5人書き出し、止まった理由を1行ずつ書く',
           '相談を申し込むまでの手順を数え、1つ減らす（例: フォームの項目を減らす・空き日程を先に見せる）'
         ] },
    C: { type: 'あと一押しタイプ', tagline: '商談はあるのに、決まらない', mood: 'think', stage: 'close', stageNote: '商談から成約への間で止まっている',
         headline: '商談から成約までの流れ',
         title: '提案内容・セールスプロセスの改善',
         text: '商談の数を増やす前に、商談の中身（聞く→提案する→決めてもらう）の順番と内容を見直しましょう。',
         actions: [
           '直近の商談3件について、決まらなかった理由を相手の言葉のまま書き出す',
           '提案の最後に「次にやること」を1つだけ示す形に変え、次の商談で試す'
         ] },
    D: { type: '対応パンクタイプ', tagline: '今のお客さんで手一杯', mood: 'buried', stage: 'keep', stageNote: '継続対応が重くて入口に手が回らない',
         headline: '顧客対応の仕組み',
         title: '業務標準化・自動化・外注化',
         text: '既存顧客の対応を型にして自分の手を離れる部分を作り、新規集客に使える時間を確保しましょう。',
         actions: [
           '今日の顧客対応を書き出し、同じ内容を2回以上答えたものに印を付ける',
           '印の付いた1つを、返信テンプレートか手順書にする'
         ] },
    E: { type: '伸びしろ探しタイプ', tagline: '仕組みはある。細い所を見つける段階', mood: 'search', stage: 'none', stageNote: '数字を並べて、細い所を探す',
         headline: '売上のボトルネック',
         title: 'ボトルネック分析と売上拡大施策',
         text: '集客→商談→成約→継続の数字を並べ、一番細くなっている所を特定してから拡大施策を打ちましょう。',
         actions: [
           '先月の「問い合わせ数→商談数→成約数→継続数」を1行に並べる',
           '一番減り幅が大きい所を1つ選び、来週試す打ち手を1つ決める'
         ] }
  };

  /* Q7（改善したいこと）と Q6（現状）の対応。一致していれば「絞ってよい」と言える */
  var Q7_LABEL = { A: '業務時間を減らしたい', B: '集客を安定させたい', C: '商談・成約を増やしたい', D: '自分がいなくても業務が回る状態にしたい', E: '売上をさらに拡大したい' };
  var ALIGNED = { A: ['B', 'D'], B: ['B', 'C'], C: ['C'], D: ['A', 'D'], E: ['E'] }; /* Q6 → 一致する Q7 */

  function joinJa(arr) { return arr.map(function (s) { return '「' + s + '」'; }).join(''); }

  function diagnose(a) {
    /* ---------- ① 手放す候補（Q1・Q2・Q3） ---------- */
    var score = {}, hits = {};
    function add(cat, pts, tag) {
      score[cat] = (score[cat] || 0) + pts;
      hits[cat] = hits[cat] || [];
      if (tag && hits[cat].indexOf(tag) < 0) hits[cat].push(tag);
    }
    add(CAT_BY_LETTER[a.q1], 2, 'time');
    add(CAT_BY_LETTER[a.q2], 2, 'burden');
    Q3_MAP[a.q3].forEach(function (m) { add(m.cat, m.pts, m.pts >= 3 ? 'delegable' : null); });

    var revenueCat = Q4_MAP[a.q4].cat;
    var order = ['sns', 'sales', 'service', 'admin', 'dev'];
    var ranked = Object.keys(score)
      .sort(function (x, y) { return (score[y] - score[x]) || (order.indexOf(x) - order.indexOf(y)); })
      .slice(0, 3);

    var release = ranked.map(function (cat) {
      var c = CATS[cat];
      var tags = hits[cat] || [];
      var names = [];
      if (tags.indexOf('time') >= 0) names.push('最も時間を使っている');
      if (tags.indexOf('burden') >= 0) names.push('最も負担を感じている');
      if (tags.indexOf('delegable') >= 0) names.push('他の人やAIでも対応できそう');
      var why = names.length
        ? '回答では' + joinJa(names) + '業務でした。'
        : '回答の「営業準備・日程調整・顧客管理」に、日程調整などの事務が含まれるため候補に入れています。';
      var isRevenue = (cat === revenueCat);
      if (isRevenue) {
        why += 'ただし売上に最もつながっている活動でもあるため、業務全体ではなく定型の作業だけを切り出す候補です。「' + c.keep + '」は自分に残します。';
      } else if (cat === 'dev') {
        why += '「' + c.keep + '」は手放さず、その前の準備作業だけが候補です。';
      } else {
        why += '「' + c.keep + '」は自分に残し、それ以外を任せる形が考えられます。';
      }
      return { cat: cat, category: c.label, icon: c.icon, color: c.color, title: c.routine, why: why, revenueProtected: isRevenue, tryToday: c.tryToday, tools: c.tools, prompt: c.prompt };
    });
    var releaseNote = (a.q3 === 'E')
      ? '「他の人やAIでも対応できそうな業務」は思いつかないとの回答でしたので、時間と負担の重なりから候補を出しています。実際に任せられるかは、業務を書き出してから判断してください。'
      : '';

    /* ---------- ② 集中する仕事（Q4・Q5） ---------- */
    var rev = Q4_MAP[a.q4], want = Q5_MAP[a.q5];
    var focus = [], focusNote = '';
    if (rev.cat === 'unknown') {
      focus.push({ title: '何が売上につながっているかを把握すること',
        why: '「何が売上につながっているかわからない」との回答のため、集中先を決める材料がまだありません。直近の売上を、どの活動から生まれたか1件ずつ振り返るのが先です。' });
      focus.push({ title: want.label,
        why: '時間を使いたい活動として選ばれた仮の候補です。売上の出どころが分かるまでは、全体の時間の一部で試す位置づけにしてください。' });
      focusNote = '売上の出どころが分かった時点で、集中先を決め直してください。';
    } else if (rev.cat === want.cat) {
      focus.push({ title: rev.label,
        why: '売上に最もつながっている活動であり、あなたが時間を使いたい活動でもあります。手放す候補で浮いた時間を、まずここに回すのが最も矛盾の少ない選択です。' });
    } else {
      focus.push({ title: rev.label,
        why: '売上に最もつながっている活動です。時間を使いたいこととは違いますが、今の売上を支えているため、先に守る対象です。' });
      var wantWhy = (want.cat === 'dev' || want.cat === 'strategy')
        ? '時間を使いたい活動として選ばれました。売上を支える活動の時間を確保したうえで、週に決まった時間を切り分けて進める候補です。'
        : '時間を使いたい活動として選ばれました。まだ売上の裏づけが無いため、上の活動を守ったうえで、小さく時間を取り効果を確かめる候補です。';
      focus.push({ title: want.label, why: wantWhy });
      focusNote = '売上につながっている活動と、時間を使いたい活動が異なります。希望だけで集中先を決めず、売上を支える活動を先に守ってください。';
    }

    /* ---------- ③ 次の一手（Q6・Q7） ---------- */
    var q6 = Q6_MAP[a.q6];
    var aligned = ALIGNED[a.q6].indexOf(a.q7) >= 0;
    var bridge;
    if (a.q7 === 'A') {
      bridge = '「業務時間を減らしたい」という希望は、上の「手放すことを検討したい仕事」から1つ着手することで同時に進められます。';
    } else if (aligned) {
      bridge = '改善したいこと（' + Q7_LABEL[a.q7] + '）と現状が一致しているため、ここに絞って進める候補です。';
    } else {
      bridge = '「' + Q7_LABEL[a.q7] + '」という希望に対して、現状の回答から見ると、先に上の点を整えるほうが近道になる可能性があります。';
    }
    var priority = { title: q6.title, text: q6.text, bridge: bridge };

    /* ---------- ⑤ 今日からできるアクション ---------- */
    var actions = q6.actions.slice();
    actions.push('「' + release[0].title + '」のうち1つを今日だけ任せてみる。例: ' + release[0].tryToday);

    /* 業務マップ（時間・負担・任せられる の内訳と、売上源・やりたい の印） */
    var map = order.map(function (cat) {
      var tags = hits[cat] || [];
      return { cat: cat, label: CATS[cat].label, icon: CATS[cat].icon, color: CATS[cat].color,
               time: tags.indexOf('time') >= 0 ? 2 : 0,
               burden: tags.indexOf('burden') >= 0 ? 2 : 0,
               delegable: (Q3_MAP[a.q3].filter(function (m) { return m.cat === cat; })[0] || { pts: 0 }).pts,
               isRevenue: (revenueCat === cat), isWant: (want.cat === cat) };
    });

    return {
      type: q6.type, tagline: q6.tagline, mood: q6.mood,
      funnel: { stage: q6.stage, note: q6.stageNote },
      map: map,
      headline: 'あなたが今、見直すべきなのは' + q6.headline + 'です',
      release: release,
      releaseNote: releaseNote,
      focus: focus,
      focusNote: focusNote,
      priority: priority,
      actions: actions
    };
  }

  var api = { QUESTIONS: QUESTIONS, CATS: CATS, diagnose: diagnose };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Diagnosis = api;
})(typeof window !== 'undefined' ? window : this);
