/* 診断ロジック v3（ブラウザと node の両方で動く純粋関数）
   answers = { industry, revenue, worry, worryFree(自由記述), goal, q1, hours, q2..q6, leads, won, price } → 結果 */
(function (root) {
  'use strict';

  /* ---------- 質問（場面で聞く） ---------- */
  var QUESTIONS = [
    /* ---- 入口: 状況と目標（4問） ---- */
    { id: 'industry', kind: 'intake', icon: '🧑‍💼', title: 'お仕事に一番近いのは？', hint: '',
      options: { A: '講師・コンサル・コーチ', B: '士業・専門職', C: 'サロン・施術・教室', D: '制作・デザイン・ライター', E: 'その他' } },
    { id: 'revenue', kind: 'intake', icon: '📊', title: '今の月の売上は？', hint: '直近3か月の平均で',
      options: { A: '10万円まで', B: '10〜30万円', C: '30〜100万円', D: '100〜300万円', E: '300万円以上' } },
    { id: 'worry', kind: 'intake', icon: '💭', title: '今、一番の悩みは？', hint: 'ひとこと添えると、お送りする内容が具体的になります', free: 'ひとことで言うと（任意）',
      options: { A: '集客が安定しない', B: '問い合わせが契約にならない', C: '忙しくて時間がない', D: '売上が頭打ち・単価が安い', E: '何から手をつけるか分からない' } },
    { id: 'goal', kind: 'intake', icon: '🎯', title: '3か月後に一番ほしい変化は？', hint: '1つだけ',
      options: { A: '夜9時に仕事を終える', B: '問い合わせが毎月安定', C: '契約が月2件増える', D: '1週間休んでも回る', E: '売上が1.5倍になる' } },
    /* ---- 仕事（5問） ---- */
    { id: 'q1', kind: 'cat', icon: '🕒', title: '先週、一番時間を使った仕事は？', hint: '一番近いものを1つ',
      options: { A: 'SNSの投稿づくり', B: '商談・交流会・提案', C: 'お客さんの対応・納品', D: '事務・日程・資料づくり', E: '商品づくり・企画・学び' } },
    { id: 'hours', kind: 'num', icon: '⏳', title: '「{q1}」に使う時間は、週に？', hint: 'ざっくりでOK',
      options: { A: '5時間以下', B: '5〜10時間', C: '10〜20時間', D: '20〜30時間', E: '30時間以上' } },
    { id: 'q2', kind: 'cat', icon: '😮‍💨', title: '来週の予定で、一番気が重いのは？', hint: '「これ来るのか」と思うもの',
      options: { A: '投稿のネタ出し', B: '初対面の商談・交流会', C: '「ちょっと相談いいですか」', D: '月末の請求・資料', E: '商品を考える時間' } },
    { id: 'q3', kind: 'cat', icon: '🤖', title: '自分でなくてもできる作業は？', hint: '人やAIに渡せそうなもの',
      options: { A: '投稿づくり', B: '日程調整・商談の準備', C: 'お客さんへの定型の返信', D: '請求書・資料づくり', E: '思いつかない' } },
    { id: 'q4', kind: 'cat', icon: '💰', title: '直近の契約は、どこから来た？', hint: '一番最近の1人を思い出して',
      options: { A: '投稿・広告を見た人', B: '自分から声をかけた人', C: '今のお客さんの継続・追加', D: '紹介・交流会で会った人', E: '思い出せない' } },
    { id: 'q5', kind: 'cat', icon: '🌤️', title: '丸一日空いたら、何をする？', hint: '義務ではなく、やりたいこと',
      options: { A: '新しい人に会う・DM', B: '止まっている商談に連絡', C: '今のお客さんに深い提案', D: '商品づくり・学び', E: '手順書と仕組みづくり' } },
    /* ---- 流れ（1問） ---- */
    { id: 'q6', kind: 'cat', icon: '🔁', title: '発信と声かけを1か月止めたら？', hint: '新しい問い合わせはどうなる？',
      options: { A: 'ゼロになる', B: '来るが相談にならない', C: '相談は来るが決まらない', D: '返信が遅れて冷める', E: '1〜2件は来る' } },
    /* ---- 数字（3問） ---- */
    { id: 'leads', kind: 'num', icon: '📥', title: '先月、新規の相談は何件？', hint: '問い合わせではなく、話をした件数',
      options: { A: '0件', B: '1〜2件', C: '3〜5件', D: '6〜10件', E: '11件以上' } },
    { id: 'won', kind: 'num', icon: '✍️', title: 'そのうち、契約は何件？', hint: '',
      options: { A: '0件', B: '1件', C: '2件', D: '3〜4件', E: '5件以上' } },
    { id: 'price', kind: 'num', icon: '💴', title: '1契約の売上は、だいたい？', hint: '一番多い商品で',
      options: { A: '3万円まで', B: '3〜10万円', C: '10〜30万円', D: '30〜100万円', E: '100万円以上' } }
  ];

  var HOURS = { A: 3, B: 7.5, C: 15, D: 25, E: 35 }; /* その仕事に使う週の時間 */
  var LEADS = { A: 0, B: 1.5, C: 4, D: 8, E: 13 };
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

  var BURDEN_SCENE = {
    A: '日曜の夜、「投稿のネタがない」と検索を始める。',
    B: '初対面の商談の前日は、話す順番を頭の中で何度も組み直す。',
    C: '「ちょっと相談いいですか」の通知が鳴ると、今やっている仕事の手が止まる。',
    D: '月末の請求書と資料は、毎月「今月こそ早めに」と言って、毎月最終日になる。',
    E: '「新しい商品を考える」と予定に入れた時間は、別の急ぎに取られて消える。'
  };

  /* Q3 → 業務カテゴリ（文言が他の設問と違うので内部で変換） */
  var Q3_MAP = { A: [{ cat: 'sns', pts: 3 }], B: [{ cat: 'sales', pts: 3 }, { cat: 'admin', pts: 1 }], C: [{ cat: 'service', pts: 3 }], D: [{ cat: 'admin', pts: 3 }], E: [] };

  var Q4_MAP = {
    A: { cat: 'sns',      label: '投稿や広告からの DM を、相談まで運ぶこと' },
    B: { cat: 'sales',    label: '自分から声をかけて商談を作ること' },
    C: { cat: 'service',  label: '今のお客さんへの価値提供と、継続・追加の提案' },
    D: { cat: 'referral', label: '紹介や交流会で会った人を、次の約束（30分の相談）まで運ぶこと' },
    E: { cat: 'unknown',  label: '直近3件の契約が、どこから来たかを書き出すこと' }
  };
  var Q5_MAP = {
    A: { cat: 'sns',      label: '新しい人との接点づくり' },
    B: { cat: 'sales',    label: '止まっている商談を動かすこと' },
    C: { cat: 'service',  label: '今のお客さんへの、もう一段深い提案' },
    D: { cat: 'dev',      label: '商品づくり（学んだことを1つ試す）' },
    E: { cat: 'strategy', label: '手順書と仕組みづくり' }
  };

  /* Q6 → タイプ */
  var TYPES = {
    A: { where: '新しい人が来る入口', sign: '投稿や声かけを止めた週は、問い合わせが0件になる', first: '相談の申し込み先を1つ作り、固定投稿とプロフィールに置く',
         alone: '入口を仕組みにするには、「誰に・何を見せて・どこへ進ませるか」を先に決める必要があります。ひとりで始めると、決める前に投稿を増やしてしまい、稼働が増えただけで入口は自分の手のままです。',
         type: 'ひとり走り回りタイプ', tagline: '投稿した週と声をかけた週にだけ、問い合わせが来る', mood: 'run', stage: 'lead',
         scene: '問い合わせは、あなたが投稿した週と、声をかけた週にだけ来る。止めた週は静かになる。だから止められない。',
         habits: ['投稿が止まると落ち着かず、質より本数で埋める', '問い合わせが来た人に、その場の都合で価格や内容を変える', '契約直後に「紹介してください」を言っていない'],
         headline: '集客の導線', title: '集客導線を、自分の手から外す',
         text: '新しい集客施策を増やす前に、見込み客があなたを知ってから相談に来るまでの流れを、あなたが動かなくても進む形に整えます。',
         actions: ['今週の新規の問い合わせや反応が、どこから来たかを3件書き出す（SNS・紹介・検索など）', 'プロフィールか固定投稿に「相談の入口」（予約リンクか問い合わせ先）を1か所置く'],
         q7: { A: '夜9時に閉じられない理由は、入口があなたの稼働で動いているからです。', B: '「毎月決まった数」は、入口を自分の手から外したときに初めて数えられます。', C: '契約を2件増やすなら、商談を増やす前に、入口の自動化で商談の数を安定させる順番です。', D: '1週間休むと入口が止まる状態です。先に入口を仕組みにします。', E: '1.5倍は、稼働を1.5倍にするのではなく、入口を仕組みにして稼働を減らしながら作ります。' } },
    B: { where: '問い合わせから相談への間', sign: '返事はしているのに「また考えます」で終わり、名前を翌月には思い出せない', first: '返信の最後に、必ず次の約束（日程・資料・質問）を1つ置く',
         alone: '返信の型を作っても、返信のあとに「次の一歩」（予約枠・資料・質問）を置く設計が無いと、往復は減りません。ひとりで直すと、文面を丁寧にする方向へ行き、止まっている人は止まったままです。',
         type: '入口渋滞タイプ', tagline: '人は来る。相談まで進まない', mood: 'queue', stage: 'talk',
         scene: 'DM や問い合わせは来る。返事もする。「また考えます」「タイミングが来たら」で終わり、その人の名前は翌月には思い出せない。',
         habits: ['問い合わせに丁寧に答えて終わり。次の一歩（日程・資料・質問）を置いていない', '相談の入口が「DM ください」だけで、予約枠が無い', '見込み客の名前を一覧にしていない。誰が止まっているか分からない'],
         headline: '見込み客から相談への流れ', title: '問い合わせを相談に進める導線をつくる',
         text: '新しい集客施策を増やす前に、既に来ている見込み客が個別相談へ進む導線を整えます。',
         actions: ['直近の問い合わせやフォロワーのうち、相談に進まなかった人を5人書き出し、止まった理由を1行ずつ書く', '相談を申し込むまでの手順を数え、1つ減らす（例: フォームの項目を減らす・空き日程を先に見せる）'],
         q7: { A: '返信に追われて9時を過ぎるのは、返信のあとに「次の一歩」が無いから往復が増えるためです。', B: '問い合わせの数より先に、問い合わせが相談になる率を上げるほうが早いです。', C: '契約を2件増やすのに、新しい集客は要りません。止まっている人の中にいます。', D: '相談の入口を予約枠にすると、あなたが居なくても次の一歩が進みます。', E: '1.5倍は、来ている人の取りこぼしを拾う所から始まります。' } },
    C: { where: '相談から契約への間', sign: '相談では「ぜひ」と言われ、1週間後に「今回は」が来る', first: '相談の最初に「何が分かれば決められますか」と聞く',
         alone: '決まらない理由は、自分の商談の中では見えません。ひとりで直そうとすると説明を増やす方向へ行き、相手の「決める基準」を聞く順番は変わらないので、成約率は動きません。',
         type: 'あと一押しタイプ', tagline: '相談は盛り上がる。1週間後に「今回は」', mood: 'think', stage: 'close',
         scene: '相談の場は盛り上がる。「ぜひ」と言われる。1週間後に「検討した結果、今回は」のメッセージ。何が足りなかったかは、聞けていない。',
         habits: ['商談で説明が8割、質問が2割。相手の「決める基準」を聞いていない', '価格を最後に言う。相手は価格を聞くまで決められない', '「検討します」に「いつまでに、何があれば決められますか」と返していない'],
         headline: '商談から成約までの流れ', title: '提案の中身と、決めてもらう順番を直す',
         text: '商談の数を増やす前に、商談の中身（聞く→提案する→決めてもらう）の順番と内容を見直します。',
         actions: ['直近の商談3件について、決まらなかった理由を相手の言葉のまま書き出す', '提案の最後に「次にやること」を1つだけ示す形に変え、次の商談で試す'],
         q7: { A: '商談の準備に時間が溶けるのは、毎回ゼロから組み立てているからです。型を1つ作ると準備が半分になります。', B: '問い合わせを増やしても、決まらない商談が増えるだけです。先に成約の流れを直します。', C: '契約2件は、消えている商談を拾えば足ります。下の数字を見てください。', D: '決め方を型にすると、あなたの熱量に頼らず決まる商談が増えます。', E: '1.5倍は、成約率を上げるのが一番早い道です。集客は増やさなくていい場合があります。' } },
    D: { where: '今のお客さんの対応', sign: '新しい問い合わせを翌日以降に返している。返すころには冷めている', first: '同じ返信を型にして、空いた時間でその日のうちに返す',
         alone: '対応を型にするには、まず「何を自分が持っていて、何を手放すか」の線を引く必要があります。ひとりだと、目の前の対応を優先して線を引く時間が取れず、型は作りかけで止まります。',
         type: '対応パンクタイプ', tagline: '今のお客さんで手一杯。新規は後回し', mood: 'buried', stage: 'keep',
         scene: '問い合わせの通知を見て「あとで返す」と思い、既存のお客さんの対応が終わると夜。翌日に返信すると、相手の熱は下がっている。',
         habits: ['同じ質問に、毎回ゼロから返信している', '納品物の形式が毎回違う。型を作っていない', '新規の問い合わせを、既存の対応より後ろに置いている'],
         headline: '顧客対応の仕組み', title: '対応を型にして、自分の手を離す',
         text: '既存のお客さんの対応を型にして自分の手を離れる部分を作り、新規に使える時間を取り戻します。',
         actions: ['今日の顧客対応を書き出し、同じ内容を2回以上答えたものに印を付ける', '印の付いた1つを、返信テンプレートか手順書にする'],
         q7: { A: '夜9時に閉じるには、返信の半分を型にするのが一番早いです。', B: '問い合わせは来ています。来た日のうちに返せる体制が先です。', C: '契約2件分の時間は、対応の型化で浮きます。', D: '1週間休める状態は、今あなたの頭の中にしかない手順を何個書き出せるかで決まります。', E: '1.5倍の前に、今の対応で埋まっている時間を空けないと、増えた分を受けられません。' } },
    E: { where: '流れの中の、まだ数えていない1か所', sign: '止めても問い合わせは来る。でも、どこを押せば増えるかが分からない', first: '問い合わせ→相談→契約→継続の数を並べ、一番減る所を1つ直す',
         alone: '数字は並べられても、「どこが細いか」の判断には比較の基準が要ります。ひとりだと、自分の数字しか無いので細い所が見えず、新しい集客から手を付けて、細い所はそのままです。',
         type: '伸びしろ探しタイプ', tagline: '仕組みはある。どこを押せば増えるかが見えていない', mood: 'search', stage: 'none',
         scene: '止めても問い合わせは来る。ただ、どこを押せば増えるかが分かっていない。先月と今月の数字を並べたことがない。',
         habits: ['集客→商談→成約→継続のどこで何件落ちているか、月ごとに見ていない', '伸ばす施策を「新しい集客」から始めがち', '今のお客さんの追加提案・紹介を、仕組みとして回していない'],
         headline: '売上の細い所', title: '数字を並べて、細い1か所を太くする',
         text: '集客→商談→成約→継続の数字を並べ、一番細い所を特定してから拡大施策を打ちます。',
         actions: ['先月の「問い合わせ数→商談数→成約数→継続数」を1行に並べる', '一番減り幅が大きい所を1つ選び、来週試す打ち手を1つ決める'],
         q7: { A: '時間を減らすなら、効いていない施策を数字で見つけて止めるのが先です。', B: '問い合わせの数は安定しています。次は相談に進む率です。', C: '契約2件は、成約率か継続率のどちらかを上げると届きます。下の数字で比べてください。', D: '仕組みはあります。あとは手順書に落ちているかどうかです。', E: '1.5倍は、集客を1.5倍にするより、細い所を1か所太くするほうが早いことが多いです。' } }
  };

  var ALIGNED = { A: ['B', 'D'], B: ['B', 'C'], C: ['C'], D: ['A', 'D'], E: ['E'] };
  var Q7_LABEL = { A: '夜9時にパソコンを閉じている', B: '毎月決まった数の問い合わせが来ている', C: '月の契約が今より2件増えている', D: '1週間休んでも仕事が回っている', E: '月の売上が今の1.5倍になっている' };

  function round1(x) { return Math.round(x * 10) / 10; }
  function man(x) { /* 万円表示 */
    if (x >= 10000) return round1(x / 10000) + '億円';
    return (x >= 100 ? Math.round(x) : round1(x)) + '万円';
  }
  function joinJa(arr) { return arr.map(function (s) { return '「' + s + '」'; }).join(''); }

  function diagnose(a) {
    /* ---------- 数字 ---------- */
    var leads = LEADS[a.leads], won = Math.min(WON[a.won], LEADS[a.leads] || 0), price = PRICE[a.price];
    if (a.leads === 'A') won = 0;
    var topHours = HOURS[a.hours];                /* 一番時間を使う仕事の週の時間 */
    var freeWeek = topHours * 0.5;                /* 定型と見る半分 */
    var freeMonth = freeWeek * 4.3;
    var dealsFromTime = Math.floor(freeMonth / 1.5);
    var rate = leads > 0 ? won / leads : null;    /* 成約率 */
    var dealValue = rate != null ? price * rate : null; /* 商談1件の期待値 */
    var lostCount = Math.max(leads - won, 0);
    var lostMoney = lostCount * price;
    var numbers = {
      topHours: round1(topHours), freeWeek: round1(freeWeek), freeMonth: round1(freeMonth), dealsFromTime: dealsFromTime,
      leads: leads, won: won, rate: rate, ratePct: rate != null ? Math.round(rate * 100) : null,
      price: price, dealValue: dealValue != null ? round1(dealValue) : null, lostCount: lostCount, lostMoney: lostMoney,
      formulas: [
        '手放すと浮く時間 ＝ 週' + topHours + '時間 × 半分（定型の作業とみなす） ＝ 週' + round1(freeWeek) + '時間 ＝ 月' + round1(freeMonth) + '時間',
        '商談に換算 ＝ 月' + round1(freeMonth) + '時間 ÷ 1.5時間（商談1件の準備込み） ＝ ' + dealsFromTime + '件分',
        rate != null ? '成約率 ＝ 契約' + won + '件 ÷ 相談' + leads + '件 ＝ ' + Math.round(rate * 100) + '%' : '成約率 ＝ 相談0件のため計算できません',
        dealValue != null ? '商談1件の価値 ＝ ' + man(price) + ' × ' + Math.round(rate * 100) + '% ＝ ' + man(dealValue) : '商談1件の価値 ＝ 相談が1件あれば計算できます',
        '検討のまま消えた金額（月） ＝ （相談' + leads + '件 − 契約' + won + '件）× ' + man(price) + ' ＝ ' + man(lostMoney)
      ]
    };

    /* ---------- 手放す候補（Q1・Q2・Q3） ---------- */
    var score = {}, hits = {};
    function add(cat, pts, tag) { score[cat] = (score[cat] || 0) + pts; hits[cat] = hits[cat] || []; if (tag && hits[cat].indexOf(tag) < 0) hits[cat].push(tag); }
    add(CAT_BY_LETTER[a.q1], 2, 'time');
    add(CAT_BY_LETTER[a.q2], 2, 'burden');
    Q3_MAP[a.q3].forEach(function (m) { add(m.cat, m.pts, m.pts >= 3 ? 'delegable' : null); });
    var revenueCat = Q4_MAP[a.q4].cat;
    var order = ['sns', 'sales', 'service', 'admin', 'dev'];
    /* 手放す対象は導線の中の手作業だけ。顧客対応は Q3 で本人が「定型の返信」を選んだときだけ、商品づくり・経営は対象外 */
    var eligible = Object.keys(score).filter(function (cat) {
      if (cat === 'dev') return false;
      if (cat === 'service') return a.q3 === 'C';
      return true;
    });
    var ranked = eligible.sort(function (x, y) { return (score[y] - score[x]) || (order.indexOf(x) - order.indexOf(y)); }).slice(0, 3);
    var fallback = false;
    if (!ranked.length) { ranked = ['admin']; fallback = true; }
    var release = ranked.map(function (cat) {
      var c = CATS[cat], tags = hits[cat] || [], names = [];
      if (tags.indexOf('time') >= 0) names.push('画面に一番長く映っていた');
      if (tags.indexOf('burden') >= 0) names.push('予定表でため息が出る');
      if (tags.indexOf('delegable') >= 0) names.push('人に「自分でやらなくていい」と言われた');
      var why = names.length ? joinJa(names) + '仕事の中の、手作業の部分です。' : (fallback ? '回答からは絞れないので、導線の中で一番手作業が多い日程調整と請求から始めます。' : '「日程調整と商談前の準備」に含まれる事務です。');
      var isRevenue = (cat === revenueCat);
      if (isRevenue) why += 'ただし直近の契約はここから来ています。業務ごと手放すのではなく、定型の作業だけを切り出します。「' + c.keep + '」は自分に残します。';
      else if (cat === 'dev') why += '「' + c.keep + '」は手放さず、その前の準備作業だけを任せます。';
      else why += '「' + c.keep + '」だけ残して、あとは任せる形です。';
      return { cat: cat, category: c.label, icon: c.icon, color: c.color, title: c.routine, why: why, revenueProtected: isRevenue, tryToday: c.tryToday, tools: c.tools, prompt: c.prompt };
    });
    var topCat = ranked[0];
    var releaseNote = '';
    if (CAT_BY_LETTER[a.q1] === 'service' && a.q3 !== 'C') releaseNote = 'お客さんへの対応とサービス提供は手放しません。ここはあなたが集中する側です。手放すのは、その前後にある手作業（日程調整・定型の返信・請求）だけです。';
    if (CAT_BY_LETTER[a.q1] === 'dev') releaseNote = '商品づくり・企画・経営は手放しません。その前の下調べと資料の整形だけを任せます。';
    if (topCat === CAT_BY_LETTER[a.q1]) {
      releaseNote += (releaseNote ? ' ' : '') + '「' + CATS[topCat].label + '」に週' + round1(topHours) + '時間。半分を型にすると月' + round1(freeMonth) + '時間、商談' + dealsFromTime + '件分の時間が戻ります。';
    }

    /* ---------- 集中する仕事（Q4・Q5） ---------- */
    var rev = Q4_MAP[a.q4], want = Q5_MAP[a.q5], focus = [], focusNote = '';
    if (rev.cat === 'unknown') {
      focus.push({ title: rev.label, why: '直近の契約がどこから来たか思い出せない状態では、集中先を決められません。契約3件の出どころを書き出すと、たいてい1つに偏っています。そこが集中先です。' });
      focus.push({ title: want.label, why: '空いた1日にやりたいこととして選ばれました。出どころが分かるまでは、週の2割までで試します。' });
    } else if (rev.cat === want.cat) {
      focus.push({ title: rev.label, why: '直近の契約はここから来ていて、空いた1日にやりたいこともここです。手放して浮いた時間は、迷わずここに入れます。' });
    } else {
      focus.push({ title: rev.label, why: '直近の契約はここから来ています。やりたいことと違っても、今の売上を作っている活動なので先に守ります。' });
      focus.push({ title: want.label, why: (want.cat === 'dev' || want.cat === 'strategy') ? '空いた1日にやりたいこと。売上を作る活動の時間を確保したうえで、週に決まった時間を切り分けて進めます。' : '空いた1日にやりたいこと。まだ契約の実績が無いので、上を守ったうえで小さく試して効果を見ます。' });
      focusNote = '「売上を作っている活動」と「やりたい活動」が違います。やりたい方から始めると、今の売上が先に落ちます。';
    }

    /* ---------- 次の一手（Q6・Q7） ---------- */
    var t = TYPES[a.q6];
    var bridge = t.q7[a.goal];
    var priority = { title: t.title, text: t.text, bridge: bridge };

    /* ---------- 因果（タイプ × 数字） ---------- */
    var cause;
    if (a.q6 === 'A') {
      cause = '新規の数は「あなたが動いた分 × 発信の本数」で決まっています。先月の相談' + leads + '件は、あなたの手で作った分です。稼働はこれ以上増やせないので、同じ稼働で相談が増える形（入口の自動化）に変えるしかありません。';
    } else if (a.q6 === 'B') {
      cause = leads > 0
        ? '先月、相談まで進んだのは' + leads + '件、契約は' + won + '件。問い合わせの数はもっと多いはずです。問い合わせ→相談の率を数えていないので、どこで消えているかが見えていません。'
        : '先月、相談まで進んだ人は0件。問い合わせは来ているのに、相談の場が1つも作れていません。入口の「次の一歩」が無いからです。';
    } else if (a.q6 === 'C') {
      cause = leads > 0
        ? '先月、相談' + leads + '件のうち契約' + won + '件。' + lostCount + '件が「検討します」のまま。単価' + man(price) + 'なら、月' + man(lostMoney) + 'が検討の中に残っています。新しい集客より、ここを拾う方が早いです。'
        : '先月の相談は0件なので成約率は出ません。相談が1件でも入ったら、この数字が動き始めます。';
    } else if (a.q6 === 'D') {
      cause = '「' + CATS[CAT_BY_LETTER[a.q1]].label + '」に週' + round1(topHours) + '時間。半分を型にすると月' + round1(freeMonth) + '時間、商談' + dealsFromTime + '件分の時間が戻ります。先月の相談は' + leads + '件なので、この時間だけで相談を倍にできる計算です。';
    } else {
      cause = (dealValue != null)
        ? '相談' + leads + '件→契約' + won + '件（成約率' + Math.round(rate * 100) + '%）、単価' + man(price) + '。相談を1件増やすと期待値' + man(dealValue) + '、成約率を10ポイント上げると月' + man(leads * price * 0.1) + '。どちらが早いかを数字で決めます。'
        : '先月の相談は0件です。仕組みがあるのに相談が無いなら、入口は動いていません。まず問い合わせ→相談の数を数える所からです。';
    }

    /* ---------- 場面描写 ---------- */
    var scene = [CATS[CAT_BY_LETTER[a.q1]].scene, BURDEN_SCENE[a.q2], t.scene].join('\n');

    /* ---------- 今日からできること ---------- */
    var actions = t.actions.slice();
    actions.push('「' + release[0].title + '」のうち1つを今日だけ任せてみる。例: ' + release[0].tryToday);

    /* ---------- 業務マップ ---------- */
    var map = order.map(function (cat) {
      var tags = hits[cat] || [];
      return { cat: cat, label: CATS[cat].label, icon: CATS[cat].icon, color: CATS[cat].color,
               time: tags.indexOf('time') >= 0 ? 2 : 0, burden: tags.indexOf('burden') >= 0 ? 2 : 0,
               delegable: (Q3_MAP[a.q3].filter(function (m) { return m.cat === cat; })[0] || { pts: 0 }).pts,
               isRevenue: (revenueCat === cat), isWant: (want.cat === cat), eligible: eligible.indexOf(cat) >= 0 };
    });

    var byId = {}; QUESTIONS.forEach(function (q) { byId[q.id] = q; });
    var intake = {
      industry: byId.industry.options[a.industry], revenue: byId.revenue.options[a.revenue],
      worry: byId.worry.options[a.worry], worryFree: (a.worryFree || '').trim(), goal: byId.goal.options[a.goal]
    };

    return {
      intake: intake,
      typeKey: a.q6, type: t.type, tagline: t.tagline, mood: t.mood, funnel: { stage: t.stage },
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
