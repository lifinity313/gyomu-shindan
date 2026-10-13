/* 診断ロジック v3（ブラウザと node の両方で動く純粋関数）
   answers = { industry, revenue, worry, worryFree(自由記述), goal, q1, hours, q2..q6, leads, won, price } → 結果 */
(function (root) {
  'use strict';

  /* ---------- 質問（場面で聞く） ---------- */
  var QUESTIONS = [
    /* ---- 状況（3問） ---- */
    { id: 'revenue', kind: 'intake', icon: '📊', title: '今の月の売上は？', hint: '直近3か月の平均で',
      options: { A: '10万円まで', B: '10〜30万円', C: '30〜100万円', D: '100〜300万円', E: '300万円以上' } },
    { id: 'worry', kind: 'intake', multi: true, icon: '💭', title: '今の悩みは？（いくつでも）', hint: 'ひとこと添えると、お送りする内容が具体的になります', free: 'ひとことで言うと（任意）',
      options: { A: '集客が安定しない', B: '問い合わせが契約にならない', C: '忙しくて時間がない', D: '売上が頭打ち・単価が安い', E: '何から手をつけるか分からない' } },
    { id: 'goal', kind: 'intake', icon: '🎯', title: '3か月後に一番ほしい変化は？', hint: '1つだけ',
      options: { A: '夜9時に仕事を終える', B: '問い合わせが毎月安定', C: '契約が月2件増える', D: '1週間休んでも回る', E: '売上が1.5倍になる' } },
    /* ---- 時間（3問） ---- */
    { id: 'q1', kind: 'cat', icon: '🕒', title: '先週、一番時間を使った仕事は？', hint: '一番近いものを1つ',
      options: { A: 'SNSの投稿づくり', B: '商談・交流会・提案', C: 'お客さんの対応・納品', D: '事務・日程・資料づくり', E: '商品づくり・企画・学び' } },
    { id: 'hours', kind: 'num', icon: '⏳', title: '「{q1}」に使う時間は、週に？', hint: 'ざっくりでOK',
      options: { A: '5時間以下', B: '5〜10時間', C: '10〜20時間', D: '20〜30時間', E: '30時間以上' } },
    { id: 'q3', kind: 'cat', multi: true, icon: '🤖', title: '自分でなくてもできる作業は？', hint: '人やAIに渡せそうなもの。いくつでも',
      options: { A: '投稿づくり', B: '日程調整・商談の準備', C: 'お客さんへの定型の返信', D: '請求書・資料づくり', E: '思いつかない' } },
    /* ---- 集客（2問） ---- */
    { id: 'reach', kind: 'num', icon: '📣', title: '先月、新しい接点は合わせて何人？', hint: 'フォロワーの増加・名刺・LINE登録を合わせて',
      options: { A: '5人まで', B: '5〜20人', C: '20〜50人', D: '50〜100人', E: '100人以上' } },
    { id: 'q4', kind: 'cat', multi: true, icon: '🧭', title: '新規のお客さんは、どこから？', hint: '直近の契約を思い出して。いくつでも',
      options: { A: '投稿・広告を見た人', B: '自分から声をかけた人', C: '紹介・交流会で会った人', D: 'ホームページ・検索', E: '分からない' } },
    /* ---- 教育（2問） ---- */
    { id: 'inquiries', kind: 'num', icon: '📥', title: '先月、問い合わせは何件？', hint: 'DM・フォーム・LINE・紹介の連絡を合わせて',
      options: { A: '0件', B: '1〜2件', C: '3〜5件', D: '6〜10件', E: '11件以上' } },
    { id: 'qnext', kind: 'cat', icon: '↩️', title: '問い合わせのあと、次にすることは？', hint: '一番多いもの',
      options: { A: '日程の候補を送る', B: '資料を送る', C: '質問に答えて終わり', D: '返信が翌日以降になる', E: '問い合わせが無い' } },
    /* ---- 商談（2問） ---- */
    { id: 'leads', kind: 'num', icon: '🤝', title: '先月、個別相談は何件？', hint: '実際に話した件数',
      options: { A: '0件', B: '1〜2件', C: '3〜5件', D: '6〜10件', E: '11件以上' } },
    { id: 'qfirst', kind: 'cat', icon: '🗣️', title: '個別相談で、最初にすることは？', hint: '一番多いもの',
      options: { A: '相手の状況を聞く', B: 'サービスの説明', C: '料金の説明', D: '実績の話', E: '決まっていない' } },
    /* ---- 成約（2問） ---- */
    { id: 'won', kind: 'num', icon: '✍️', title: 'そのうち、契約は何件？', hint: '',
      options: { A: '0件', B: '1件', C: '2件', D: '3〜4件', E: '5件以上' } },
    { id: 'price', kind: 'num', icon: '💴', title: '1契約の売上は、だいたい？', hint: '一番多い商品で',
      options: { A: '3万円まで', B: '3〜10万円', C: '10〜30万円', D: '30〜100万円', E: '100万円以上' } }
  ];

  var HOURS = { A: 3, B: 7.5, C: 15, D: 25, E: 35 }; /* その仕事に使う週の時間 */
  var LEADS = { A: 0, B: 1.5, C: 4, D: 8, E: 13 };
  var REACH = { A: 3, B: 12, C: 35, D: 75, E: 150 };
  var INQ   = { A: 0, B: 1.5, C: 4, D: 8, E: 13 };
  var WON   = { A: 0, B: 1, C: 2, D: 3.5, E: 6 };
  var PRICE = { A: 2, B: 6, C: 18, D: 60, E: 150 }; /* 万円 */

  /* ---------- 業務カテゴリ ---------- */
  var CAT_BY_LETTER = { A: 'sns', B: 'sales', C: 'service', D: 'admin', E: 'dev' };
  var CATS = {
    sns:     { label: 'SNS発信・集客', icon: '📣', color: '#ff7a59',
               scene: '朝いちばんに Instagram を開き、昨日の投稿の数字を見てから1日が始まる。投稿は「今日こそ作り置き」と言いながら、結局その日の分だけ。',
               routine: '投稿の下書き・画像づくり・予約投稿',
               keep: '発信の方針と、反応してくれた人への返信',
               tools: ['ChatGPT', 'Canva', '予約投稿ツール'],
               prompt: 'あなたはSNS運用のプロです。私は【あなたの職業・対象のお客様】です。次のテーマで、Instagram／Threads向けの投稿文を3案、各150字以内で書いてください。1行目は読者が思わず止まる一言にしてください。\nテーマ：【ここにテーマ】\n読者の悩み：【ここに悩み】',
               tryToday: '次の投稿1本の下書きを ChatGPT に出させ、直すのにかかった時間を測る' },
    sales:   { label: '営業・商談・提案', icon: '🤝', color: '#2bb3a3',
               scene: 'Zoom の前に資料を直し、商談が終わるとまた次の資料。1日に話した人数は多いのに、契約の話まで行った会話は少ない。',
               routine: '商談前の資料準備・日程調整・見込み客リストの管理',
               keep: '商談・提案そのもの',
               tools: ['ChatGPT', '日程予約ツール（TimeRex・Google カレンダー予約）', 'スプレッドシート'],
               prompt: '次の商談相手に送る日程調整メールを、丁寧で短い文面で書いてください。候補日を3つ入れ、相手が1行返すだけで決まる形にしてください。\n相手：【会社名・お名前】\n候補日：【日時を3つ】\n商談の目的：【ここに目的】',
               tryToday: '次の商談の日程調整を、予約ページかテンプレート返信で済ませる' },
    service: { label: '顧客対応・サービス提供', icon: '💬', color: '#8b7cf6',
               scene: 'お客さんからの LINE に「少々お待ちください」と返して、今の作業を止める。納品物を直している間に、次の相談が来る。',
               routine: '定型の問い合わせ対応・よくある質問への回答・納品物の整形',
               keep: '顧客ごとに判断が要る対応と、価値を届ける部分',
               tools: ['ChatGPT', 'LINE 公式アカウントの自動応答', 'よくある質問ページ'],
               prompt: 'お客様からよく来る次の質問に対する返信テンプレートを作ってください。丁寧で簡潔に、3〜5行、最後に次の案内を1行添えてください。\n質問：【ここに質問】\n私のサービス：【ここにサービス内容】\n伝えたい結論：【ここに結論】',
               tryToday: '一番多い質問を1つ選び、回答テンプレートを作って次回はそれを貼る' },
    admin:   { label: '事務・日程調整・資料作成', icon: '📄', color: '#ffc857',
               scene: '日程調整の往復が3通目になり、請求書の数字を2回確認し、資料のフォルダ名を考えている間に午前が終わる。',
               routine: '日程調整・請求書や資料のひな形づくり・経費処理',
               keep: '最終的な確認と承認',
               tools: ['ChatGPT', '請求書ツール（freee・マネーフォワード）', 'オンライン秘書'],
               prompt: '次の内容で、お客様へ送る資料の構成案（見出しと各見出しの要点）を作ってください。A4で3枚以内、専門用語は使わず、お客様が決めやすい順番にしてください。\n資料の目的：【ここに目的】\n読む人：【ここに相手】\n入れたい内容：【箇条書きで】',
               tryToday: '次に作る請求書か資料を、ひな形から作るか ChatGPT に下書きさせる' },
    dev:     { label: '商品開発・企画・経営戦略', icon: '💡', color: '#5ec27f',
               scene: 'ノートに新しい商品の構成を書き足す。先月も書いた。まだ誰にも見せていない。',
               routine: '市場調査の下調べ・企画書や資料の整形',
               keep: '何を作るか、どこへ向かうかを決めること',
               tools: ['ChatGPT（Deep Research）', 'Perplexity', 'Canva'],
               prompt: '【業界】で【対象のお客様】向けに【サービス内容】を提供しています。競合3社の特徴・価格帯・強みを表で整理し、出典のURLも付けてください。最後に、私が差別化できそうな切り口を3つ挙げてください。',
               tryToday: '次の企画の下調べを ChatGPT に出させ、自分は読んで判断するだけにする' }
  };

  /* Q3 → 業務カテゴリ（文言が他の設問と違うので内部で変換） */
  var Q3_MAP = { A: [{ cat: 'sns', pts: 3 }], B: [{ cat: 'sales', pts: 3 }, { cat: 'admin', pts: 1 }], C: [{ cat: 'service', pts: 3 }], D: [{ cat: 'admin', pts: 3 }], E: [] };

  var Q4_MAP = {
    A: { cat: 'sns',      label: '投稿や広告を見た人を、個別相談まで運ぶこと' },
    B: { cat: 'sales',    label: '自分から声をかけて、個別相談を作ること' },
    C: { cat: 'referral', label: '紹介や交流会で会った人を、次の約束（個別相談）まで運ぶこと' },
    D: { cat: 'web',      label: 'ホームページ・検索から来た人を、個別相談の申し込みまで運ぶこと' },
    E: { cat: 'unknown',  label: '直近3件の契約が、どこから来たかを書き出すこと' }
  };
  /* Q6 → タイプ */
  var TYPES = {
    A: { where: '集客（新しい人が来る入口）', sign: '投稿や声かけを止めた週は、問い合わせが0件になる', first: '相談の申し込み先を1つ作り、固定投稿とプロフィールに置く',
         alone: '入口を仕組みにするには、「誰に・何を見せて・どこへ進ませるか」を先に決める必要があります。ひとりで始めると、決める前に投稿を増やしてしまい、稼働が増えただけで入口は自分の手のままです。',
         type: 'ひとり走り回りタイプ', tagline: '投稿した週と声をかけた週にだけ、問い合わせが来る', mood: 'run', stage: 'lead',
         scene: '問い合わせは、あなたが投稿した週と、声をかけた週にだけ来る。止めた週は静かになる。だから止められない。',
         habits: ['投稿が止まると落ち着かず、質より本数で埋める', '問い合わせが来た人に、その場の都合で価格や内容を変える', '契約直後に「紹介してください」を言っていない'],
         headline: '集客の導線', title: '集客導線を、自分の手から外す',
         text: '新しい集客施策を増やす前に、見込み客があなたを知ってから相談に来るまでの流れを、あなたが動かなくても進む形に整えます。',
         actions: ['今週の新規の問い合わせや反応が、どこから来たかを3件書き出す（SNS・紹介・検索など）', 'プロフィールか固定投稿に「相談の入口」（予約リンクか問い合わせ先）を1か所置く'],
         q7: { A: '夜9時に閉じられない理由は、入口があなたの稼働で動いているからです。', B: '「毎月決まった数」は、入口を自分の手から外したときに初めて数えられます。', C: '契約を2件増やすなら、商談を増やす前に、入口の自動化で商談の数を安定させる順番です。', D: '1週間休むと入口が止まる状態です。先に入口を仕組みにします。', E: '1.5倍は、稼働を1.5倍にするのではなく、入口を仕組みにして稼働を減らしながら作ります。' } },
    B: { where: '教育（問い合わせから相談への間）', sign: '返事はしているのに「また考えます」で終わり、名前を翌月には思い出せない', first: '返信の最後に、必ず次の約束（日程・資料・質問）を1つ置く',
         alone: '返信の型を作っても、返信のあとに「次の一歩」（予約枠・資料・質問）を置く設計が無いと、往復は減りません。ひとりで直すと、文面を丁寧にする方向へ行き、止まっている人は止まったままです。',
         type: '入口渋滞タイプ', tagline: '人は来る。相談まで進まない', mood: 'queue', stage: 'edu',
         scene: 'DM や問い合わせは来る。返事もする。「また考えます」「タイミングが来たら」で終わり、その人の名前は翌月には思い出せない。',
         habits: ['問い合わせに丁寧に答えて終わり。次の一歩（日程・資料・質問）を置いていない', '相談の入口が「DM ください」だけで、予約枠が無い', '見込み客の名前を一覧にしていない。誰が止まっているか分からない'],
         headline: '見込み客から相談への流れ', title: '問い合わせを相談に進める導線をつくる',
         text: '新しい集客施策を増やす前に、既に来ている見込み客が個別相談へ進む導線を整えます。',
         actions: ['直近の問い合わせやフォロワーのうち、相談に進まなかった人を5人書き出し、止まった理由を1行ずつ書く', '相談を申し込むまでの手順を数え、1つ減らす（例: フォームの項目を減らす・空き日程を先に見せる）'],
         q7: { A: '返信に追われて9時を過ぎるのは、返信のあとに「次の一歩」が無いから往復が増えるためです。', B: '問い合わせの数より先に、問い合わせが相談になる率を上げるほうが早いです。', C: '契約を2件増やすのに、新しい集客は要りません。止まっている人の中にいます。', D: '相談の入口を予約枠にすると、あなたが居なくても次の一歩が進みます。', E: '1.5倍は、来ている人の取りこぼしを拾う所から始まります。' } },
    C: { where: '成約（相談から契約への間）', sign: '相談では「ぜひ」と言われ、1週間後に「今回は」が来る', first: '相談の最初に「何が分かれば決められますか」と聞く',
         alone: '決まらない理由は、自分の商談の中では見えません。ひとりで直そうとすると説明を増やす方向へ行き、相手の「決める基準」を聞く順番は変わらないので、成約率は動きません。',
         type: 'あと一押しタイプ', tagline: '相談は盛り上がる。1週間後に「今回は」', mood: 'think', stage: 'close',
         scene: '相談の場は盛り上がる。「ぜひ」と言われる。1週間後に「検討した結果、今回は」のメッセージ。何が足りなかったかは、聞けていない。',
         habits: ['商談で説明が8割、質問が2割。相手の「決める基準」を聞いていない', '価格を最後に言う。相手は価格を聞くまで決められない', '「検討します」に「いつまでに、何があれば決められますか」と返していない'],
         headline: '商談から成約までの流れ', title: '提案の中身と、決めてもらう順番を直す',
         text: '商談の数を増やす前に、商談の中身（聞く→提案する→決めてもらう）の順番と内容を見直します。',
         actions: ['直近の商談3件について、決まらなかった理由を相手の言葉のまま書き出す', '提案の最後に「次にやること」を1つだけ示す形に変え、次の商談で試す'],
         q7: { A: '商談の準備に時間が溶けるのは、毎回ゼロから組み立てているからです。型を1つ作ると準備が半分になります。', B: '問い合わせを増やしても、決まらない商談が増えるだけです。先に成約の流れを直します。', C: '契約2件は、消えている商談を拾えば足ります。下の数字を見てください。', D: '決め方を型にすると、あなたの熱量に頼らず決まる商談が増えます。', E: '1.5倍は、成約率を上げるのが一番早い道です。集客は増やさなくていい場合があります。' } },
    D: { where: '教育（返信が遅れて、相談に進まない）', sign: '新しい問い合わせを翌日以降に返している。返すころには冷めている', first: '同じ返信を型にして、空いた時間でその日のうちに返す',
         alone: '対応を型にするには、まず「何を自分が持っていて、何を手放すか」の線を引く必要があります。ひとりだと、目の前の対応を優先して線を引く時間が取れず、型は作りかけで止まります。',
         type: '対応パンクタイプ', tagline: '今のお客さんで手一杯。新規は後回し', mood: 'buried', stage: 'edu',
         scene: '問い合わせの通知を見て「あとで返す」と思い、既存のお客さんの対応が終わると夜。翌日に返信すると、相手の熱は下がっている。',
         habits: ['同じ質問に、毎回ゼロから返信している', '納品物の形式が毎回違う。型を作っていない', '新規の問い合わせを、既存の対応より後ろに置いている'],
         headline: '顧客対応の仕組み', title: '対応を型にして、自分の手を離す',
         text: '既存のお客さんの対応を型にして自分の手を離れる部分を作り、新規に使える時間を取り戻します。',
         actions: ['今日の顧客対応を書き出し、同じ内容を2回以上答えたものに印を付ける', '印の付いた1つを、返信テンプレートか手順書にする'],
         q7: { A: '夜9時に閉じるには、返信の半分を型にするのが一番早いです。', B: '問い合わせは来ています。来た日のうちに返せる体制が先です。', C: '契約2件分の時間は、対応の型化で浮きます。', D: '1週間休める状態は、今あなたの頭の中にしかない手順を何個書き出せるかで決まります。', E: '1.5倍の前に、今の対応で埋まっている時間を空けないと、増えた分を受けられません。' } },
    E: { where: '流れの中の、まだ数えていない1か所', sign: '止めても問い合わせは来る。でも、どこを押せば増えるかが分からない', first: '集客→教育→商談→成約の数を並べ、一番減る所を1つ直す',
         alone: '数字は並べられても、「どこが細いか」の判断には比較の基準が要ります。ひとりだと、自分の数字しか無いので細い所が見えず、新しい集客から手を付けて、細い所はそのままです。',
         type: '伸びしろ探しタイプ', tagline: '仕組みはある。どこを押せば増えるかが見えていない', mood: 'search', stage: 'none',
         scene: '止めても問い合わせは来る。ただ、どこを押せば増えるかが分かっていない。先月と今月の数字を並べたことがない。',
         habits: ['集客→教育→商談→成約のどこで何件落ちているか、月ごとに見ていない', '伸ばす施策を「新しい集客」から始めがち', '今のお客さんの追加提案・紹介を、仕組みとして回していない'],
         headline: '売上の細い所', title: '数字を並べて、細い1か所を太くする',
         text: '集客→教育→商談→成約の数字を並べ、一番細い所を特定してから拡大施策を打ちます。',
         actions: ['先月の「知った人→問い合わせ→相談→契約」の数を1行に並べる', '一番減り幅が大きい所を1つ選び、来週試す打ち手を1つ決める'],
         q7: { A: '時間を減らすなら、効いていない施策を数字で見つけて止めるのが先です。', B: '問い合わせの数は安定しています。次は相談に進む率です。', C: '契約2件は、成約率を上げるか相談を増やすかのどちらかで届きます。下の数字で比べてください。', D: '仕組みはあります。あとは手順書に落ちているかどうかです。', E: '1.5倍は、集客を1.5倍にするより、細い所を1か所太くするほうが早いことが多いです。' } }
  };

  var ALIGNED = { A: ['B', 'D'], B: ['B', 'C'], C: ['C'], D: ['A', 'D'], E: ['E'] };
  var Q7_LABEL = { A: '夜9時にパソコンを閉じている', B: '毎月決まった数の問い合わせが来ている', C: '月の契約が今より2件増えている', D: '1週間休んでも仕事が回っている', E: '月の売上が今の1.5倍になっている' };

  function round1(x) { return Math.round(x * 10) / 10; }
  function man(x) { /* 万円表示 */
    if (x >= 10000) return round1(x / 10000) + '億円';
    return (x >= 100 ? Math.round(x) : round1(x)) + '万円';
  }
  function joinJa(arr) { return arr.map(function (s) { return '「' + s + '」'; }).join(''); }
  /* 複数選択の答えは配列。1文字でも配列でも受ける */
  function asList(v) { return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []); }

  function byIdOpt(id, letter) { var q = QUESTIONS.filter(function (x) { return x.id === id; })[0]; return q.options[letter] || ''; }

  function diagnose(a) {
    /* ---------- 数字（4段） ---------- */
    var reach = REACH[a.reach], inquiries = INQ[a.inquiries], leads = LEADS[a.leads], price = PRICE[a.price];
    var won = Math.min(WON[a.won], leads || 0);
    if (a.leads === 'A') won = 0;
    if (a.inquiries === 'A') { leads = Math.min(leads, 0); won = 0; }
    var topHours = HOURS[a.hours];
    var freeWeek = topHours * 0.5, freeMonth = freeWeek * 4.3, dealsFromTime = Math.floor(freeMonth / 1.5);
    var r1 = reach > 0 ? inquiries / reach : null;      /* 集客→教育: 接点のうち問い合わせた割合 */
    var r2 = inquiries > 0 ? leads / inquiries : null;  /* 教育→商談: 問い合わせのうち相談に進んだ割合 */
    var r3 = leads > 0 ? won / leads : null;            /* 商談→成約 */
    var dealValue = r3 != null ? price * r3 : null;
    var lostInq = Math.max(inquiries - leads, 0);
    var lostCount = Math.max(leads - won, 0);
    var lostMoney = lostCount * price;
    var pct = function (x) { return x == null ? null : Math.round(x * 100); };
    var numbers = {
      reach: reach, inquiries: inquiries, leads: leads, won: won, price: price,
      r1Pct: pct(r1), r2Pct: pct(r2), r3Pct: pct(r3), ratePct: pct(r3), rate: r3,
      dealValue: dealValue != null ? round1(dealValue) : null,
      lostInq: lostInq, lostCount: lostCount, lostMoney: lostMoney,
      topHours: round1(topHours), freeWeek: round1(freeWeek), freeMonth: round1(freeMonth), dealsFromTime: dealsFromTime,
      formulas: [
        '新しい接点 ' + reach + '人 → 問い合わせ ' + inquiries + '件 → 個別相談 ' + leads + '件 → 契約 ' + won + '件（先月・選んだ幅の代表値）',
        r2 != null ? '問い合わせ→相談 ＝ ' + leads + ' ÷ ' + inquiries + ' ＝ ' + pct(r2) + '%' : '問い合わせ→相談 ＝ 問い合わせ0件のため出せません',
        r3 != null ? '相談→契約（成約率） ＝ ' + won + ' ÷ ' + leads + ' ＝ ' + pct(r3) + '%' : '相談→契約 ＝ 相談0件のため出せません',
        dealValue != null ? '個別相談1件の価値 ＝ ' + man(price) + ' × ' + pct(r3) + '% ＝ ' + man(dealValue) : '個別相談1件の価値 ＝ 相談が1件あれば出せます',
        '検討のまま消えた金額（月） ＝ （相談' + leads + '件 − 契約' + won + '件）× ' + man(price) + ' ＝ ' + man(lostMoney),
        '手放すと浮く時間 ＝ 週' + topHours + '時間 × 半分（定型の作業とみなす） ＝ 月' + round1(freeMonth) + '時間 ＝ 商談' + dealsFromTime + '件分'
      ]
    };

    /* ---------- 止まっている場所（数字と行動から判定） ---------- */
    /* 優先順: 返信が翌日以降(D) → 問い合わせが相談に進まない(B) → 相談が契約にならない(C) → 接点が少ない(A) → 回っている(E) */
    var typeKey, knownNotAsking = false;
    if (a.qnext === 'D' && inquiries > 0) typeKey = 'D';
    else if (inquiries > 0 && (r2 != null && r2 < 0.5 || a.qnext === 'C')) typeKey = 'B';
    else if (reach >= 35 && inquiries <= 1.5) { typeKey = 'B'; knownNotAsking = true; } /* 接点は多いのに問い合わせが無い＝教育で止まる */
    else if (leads > 0 && (r3 != null && r3 < 0.34 || a.qfirst === 'B' || a.qfirst === 'C' || a.qfirst === 'D')) typeKey = 'C';
    else if (reach <= 12 || inquiries === 0) typeKey = 'A';
    else typeKey = 'E';
    var t = TYPES[typeKey];

    /* ---------- 手放す候補（一番時間を使った仕事 × 自分でなくてもできる作業） ---------- */
    var score = {}, hits = {};
    function add(cat, pts, tag) { score[cat] = (score[cat] || 0) + pts; hits[cat] = hits[cat] || []; if (tag && hits[cat].indexOf(tag) < 0) hits[cat].push(tag); }
    add(CAT_BY_LETTER[a.q1], 2, 'time');
    var q3list = asList(a.q3).filter(function (l) { return l !== 'E'; });
    q3list.forEach(function (l) { Q3_MAP[l].forEach(function (m) { add(m.cat, m.pts, m.pts >= 3 ? 'delegable' : null); }); });
    var q4list = asList(a.q4).filter(function (l) { return l !== 'E'; });
    var revenueCats = q4list.map(function (l) { return Q4_MAP[l].cat; });
    var revenueCat = revenueCats[0] || Q4_MAP[asList(a.q4)[0] || 'E'].cat;
    var order = ['sns', 'sales', 'service', 'admin', 'dev'];
    var eligible = Object.keys(score).filter(function (cat) {
      if (cat === 'dev') return false;
      if (cat === 'service') return q3list.indexOf('C') >= 0;
      return true;
    });
    var ranked = eligible.sort(function (x, y) { return (score[y] - score[x]) || (order.indexOf(x) - order.indexOf(y)); }).slice(0, 3);
    var fallback = false;
    if (!ranked.length) { ranked = ['admin']; fallback = true; }
    var release = ranked.map(function (cat) {
      var c = CATS[cat], tags = hits[cat] || [], names = [];
      if (tags.indexOf('time') >= 0) names.push('一番時間を使っている');
      if (tags.indexOf('delegable') >= 0) names.push('自分でなくてもできると答えた');
      var why = names.length ? joinJa(names) + '仕事の中の、手作業の部分です。' : (fallback ? '回答からは絞れないので、手作業が一番多い日程調整と請求から始めます。' : '「日程調整・商談の準備」に含まれる事務です。');
      var isRevenue = revenueCats.indexOf(cat) >= 0;
      if (isRevenue) why += 'ただし新規のお客さんはここから来ています。仕事ごと手放すのではなく、定型の作業だけを切り出します。「' + c.keep + '」は自分に残します。';
      else why += '「' + c.keep + '」だけ残して、あとは任せる形です。';
      return { cat: cat, category: c.label, icon: c.icon, color: c.color, title: c.routine, why: why, revenueProtected: isRevenue, tryToday: c.tryToday, tools: c.tools, prompt: c.prompt };
    });
    var topCat = ranked[0];
    var releaseNote = '';
    if (CAT_BY_LETTER[a.q1] === 'service' && q3list.indexOf('C') < 0) releaseNote = 'お客さんへの対応と納品は手放しません。ここはあなたが集中する側です。手放すのは、その前後にある手作業（日程調整・定型の返信・請求）だけです。';
    if (CAT_BY_LETTER[a.q1] === 'dev') releaseNote = '商品づくり・企画・学びは手放しません。その前の下調べと資料の整形だけを任せます。';
    if (topCat === CAT_BY_LETTER[a.q1]) {
      releaseNote += (releaseNote ? ' ' : '') + '「' + CATS[topCat].label + '」に週' + round1(topHours) + '時間。半分を型にすると月' + round1(freeMonth) + '時間、個別相談' + dealsFromTime + '件分の時間が戻ります。';
    }

    /* ---------- 集中する仕事（新規のお客さんの出どころ × 止まっている場所） ---------- */
    var focus = [], focusNote = '';
    if (!q4list.length) {
      focus.push({ title: Q4_MAP.E.label, why: '新規のお客さんがどこから来たか分からない状態では、集中先を決められません。契約3件の出どころを書き出すと、たいてい1つに偏っています。そこが集中先です。' });
    } else if (q4list.length === 1) {
      focus.push({ title: Q4_MAP[q4list[0]].label, why: '新規のお客さんはここから来ています。今の売上を作っている入口なので、先に守ります。' });
    } else {
      var srcNames = q4list.map(function (l) { return byIdOpt('q4', l); });
      focus.push({ title: Q4_MAP[q4list[0]].label, why: '新規のお客さんは' + joinJa(srcNames) + 'から来ています。入口が複数あるので、直近3件の契約がどれから来たかを数えて、一番多い1つを先に守ります。' });
    }
    focus.push({ title: t.first, why: '止まっている場所（' + t.where + '）を直す仕事です。上の入口を守ったうえで、ここに時間を入れます。' });

    /* ---------- 次の一手 ---------- */
    var priority = { title: t.title, text: t.text, bridge: t.q7[a.goal] };

    /* ---------- 因果（止まっている場所 × 数字） ---------- */
    var cause;
    if (typeKey === 'A') cause = '先月、新しい接点は' + reach + '人、問い合わせは' + inquiries + '件。新規のお客さん候補が、まず足りていません。入口が' + (q4list.length ? joinJa(q4list.map(function (l) { return byIdOpt('q4', l); })) : '不明') + 'で、あなたが動いた分しか増えません。';
    else if (typeKey === 'B' && knownNotAsking) cause = '先月、新しい接点は' + reach + '人なのに、問い合わせは' + inquiries + '件。知られてはいるのに、問い合わせたくなる所までいっていません。投稿やプロフィールに「相談するとこうなる」と「申し込み先」が無いためです。';
    else if (typeKey === 'B') cause = '問い合わせ' + inquiries + '件のうち、個別相談まで進んだのは' + leads + '件（' + pct(r2) + '%）。' + lostInq + '件が、問い合わせのあとで止まっています。' + (a.qnext === 'C' ? '「質問に答えて終わり」なので、次の約束がありません。' : '返信のあとに次の約束（日程・資料・質問）を置いていないためです。');
    else if (typeKey === 'C') cause = '個別相談' + leads + '件のうち契約' + won + '件（成約率' + pct(r3) + '%）。' + lostCount + '件が「検討します」のまま。単価' + man(price) + 'なら、月' + man(lostMoney) + 'が検討の中に残っています。' + (a.qfirst === 'A' ? '' : '相談の最初が「' + QUESTIONS.filter(function (q) { return q.id === 'qfirst'; })[0].options[a.qfirst] + '」で、相手の決める基準を聞く前に説明が始まっています。');
    else if (typeKey === 'D') cause = '問い合わせ' + inquiries + '件のうち、個別相談は' + leads + '件。返信が翌日以降になるので、返すころには相手の気持ちが冷めています。「' + CATS[CAT_BY_LETTER[a.q1]].label + '」に週' + round1(topHours) + '時間。半分を型にすると月' + round1(freeMonth) + '時間が戻り、その日のうちに返せます。';
    else cause = '新しい接点' + reach + '人 → 問い合わせ' + inquiries + '件 → 個別相談' + leads + '件 → 契約' + won + '件。数字は回っています。' + (dealValue != null ? '個別相談1件の価値は' + man(dealValue) + '。成約率を10ポイント上げると月' + man(leads * price * 0.1) + '増えます。' : '') + '次は、一番減り幅が大きい所を1つ直します。';

    var scene = [CATS[CAT_BY_LETTER[a.q1]].scene, t.scene].join('\n');
    var actions = t.actions.slice();
    actions.push('「' + release[0].title + '」のうち1つを今日だけ任せてみる。例: ' + release[0].tryToday);

    var map = order.map(function (cat) {
      var tags = hits[cat] || [];
      return { cat: cat, label: CATS[cat].label, icon: CATS[cat].icon, color: CATS[cat].color,
               time: tags.indexOf('time') >= 0 ? 2 : 0, burden: 0,
               delegable: q3list.reduce(function (acc, l) { var m = Q3_MAP[l].filter(function (x) { return x.cat === cat; })[0]; return Math.max(acc, m ? m.pts : 0); }, 0),
               isRevenue: (revenueCat === cat), isWant: false, eligible: eligible.indexOf(cat) >= 0 };
    });

    var byId = {}; QUESTIONS.forEach(function (q) { byId[q.id] = q; });
    var intake = { industry: '', revenue: byId.revenue.options[a.revenue], worry: asList(a.worry).map(function (l) { return byId.worry.options[l]; }).join('・'), worryFree: (a.worryFree || '').trim(), goal: byId.goal.options[a.goal] };

    return {
      intake: intake,
      typeKey: typeKey, knownNotAsking: knownNotAsking, type: t.type, tagline: t.tagline, mood: t.mood, funnel: { stage: t.stage },
      headline: 'あなたが今、見直すべきなのは' + t.headline + 'です',
      scene: scene, habits: t.habits, cause: cause, alone: t.alone, numbers: numbers, map: map,
      release: release, releaseNote: releaseNote, focus: focus, focusNote: focusNote,
      priority: priority, actions: actions
    };
  }

  var api = { QUESTIONS: QUESTIONS, CATS: CATS, TYPES: TYPES, diagnose: diagnose };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Diagnosis = api;
})(typeof window !== 'undefined' ? window : this);
