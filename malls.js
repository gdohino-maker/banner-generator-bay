// 4大ECモールのプロファイル定義
// 各モールの推奨サイズ・1枚目（メイン）規約・訴求トーン・バナーサイズ・
// 商品ページの推奨構成（スロット列）をまとめる。
// 商品ページの生成枚数は pageSlots.length（モール推奨）で自動決定する。

// 楽天の商品ページ構成テンプレート
// A: 課題解決型（共感→解決→信頼）計15枚
const RAKUTEN_PROBLEM_SOLVING = [
  { role: "メイン画像（白/写真背景・文字20%以下）", aspect: "1:1", main: true, axis: "access", instruction: "ページ1枚目＝クリック後の安心・シズルを最優先に別設計する（検索結果サムネとは別物として扱う）。白または写真背景、テキスト20%以下、枠線なし。商品が主役。" },
  { role: "キャッチコピー/イベント特典（ファーストビュー）", aspect: "4:5", axis: "access", instruction: "ポイント・クーポン・受賞実績などのファーストビュー。お得感を強く。" },
  { role: "問題提起（共感）", aspect: "4:5", axis: "cvr", instruction: "「こんなお悩みありませんか？」とターゲットの日常を切り取る。" },
  { role: "商品提示（解決）", aspect: "4:5", axis: "cvr", instruction: "「それ、この商品で解決できます！」と提示。" },
  { role: "選ばれる3つの理由（特徴サマリー）", aspect: "4:5", axis: "cvr", instruction: "この商品が選ばれる理由・強みを3点に要約して見せる。" },
  { role: "ベネフィット（理想の未来）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "使うことで得られる良い変化・未来を魅力的に。" },
  { role: "理由・根拠①（成分・技術）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "効果の根拠となる成分・技術・スペックを図解。" },
  { role: "理由・根拠②（こだわり・製法）", aspect: "4:5", axis: "cvr", instruction: "産地・素材・製法などの作り手のこだわりを伝える。" },
  { role: "使い方・利用シーン", aspect: "4:5", axis: "cvr", instruction: "使い方の手順や、暮らしの中での利用シーンを分かりやすく。" },
  { role: "ビフォーアフター/実感", aspect: "4:5", axis: "cvr", yakki: true, instruction: "使用前後の変化や実感を視覚的に対比して見せる。" },
  { role: "競合比較（なぜ他社でなくこれか）", aspect: "4:5", axis: "cvr", instruction: "自社 vs 一般的な競合の比較表。価格・品質・保証・特典などの軸で『なぜ当店か』が一目で分かる○×表。誇大・優良誤認を避け事実ベースで作成。" },
  { role: "お客様の声・レビュー（先回り型）", aspect: "4:5", axis: "cvr", instruction: "レビューは★4.2以上を中心に具体的な悩み解決の声を引用。さらに★3以下で出やすい不安に対する改善報告・注意書きを先回りで併記する。" },
  { role: "ランキング・受賞実績", aspect: "4:5", axis: "cvr", instruction: "楽天ランキング1位・累計販売数・受賞などの実績バッジで信頼を演出。" },
  { role: "よくある質問（Q&A）", aspect: "4:5", axis: "cvr", instruction: "購入前の不安を解消するQ&Aを分かりやすくまとめる。" },
  { role: "安心保証・送料・配送", aspect: "4:5", axis: "cvr", instruction: "返品保証・送料無料・発送スピードなどの安心要素を提示。" },
  { role: "回遊・クロスセル（セット/関連/売れ筋TOP3）", aspect: "4:5", axis: "aov", instruction: "ページ下部の回遊バナー。『セットでお得』『関連商品』『売れ筋ランキングTOP3』への誘導を1枚に集約。矢印や『あと少しで送料無料』等の導線でページを終着駅にせず店内回遊へ流す。" },
  { role: "クロージング（今買う理由・限定特典）", aspect: "4:5", axis: "cvr", instruction: "期間限定・おまけ・クーポンなど今買う理由で背中を押す。" },
];
// B: 信頼構築最優先型（実績・社会的証明を前半に集中）計14枚
const RAKUTEN_TRUST_FIRST = [
  { role: "メイン画像（白/写真背景・文字20%以下）", aspect: "1:1", main: true, axis: "access", instruction: "ページ1枚目＝クリック後の安心・シズルを最優先に別設計する（検索結果サムネとは別物）。白または写真背景、テキスト20%以下、枠線なし。" },
  { role: "ファーストビュー（キャッチ＋実物＋主要バッジ3点）", aspect: "4:5", axis: "access", instruction: "短いキャッチコピーと商品の実物写真。出力/方式などの主要スペックや受賞を示す主要バッジを3点ほど配置。" },
  { role: "特長アイコンサマリー（約8項目）", aspect: "4:5", axis: "cvr", instruction: "主要機能を約8個のアイコンで簡潔に一覧化。濃色背景でクリーンに。" },
  { role: "社会的証明ハイライト①（ランキング＋受賞＋累計を1枚に集約）", aspect: "4:5", axis: "cvr", instruction: "『◯冠達成』『アワード受賞』『累計◯◯突破』を1枚に集約して権威感を一気に提示。" },
  { role: "機能訴求①主要スペック×コア性能", aspect: "4:5", axis: "cvr", instruction: "最も強い主要スペックを特大文字＋クローズアップ写真で。仕組みも簡潔に図解。" },
  { role: "機能訴求②独自設計・構造の解説", aspect: "4:5", axis: "cvr", instruction: "独自設計や内部構造のメリットを図解。ベネフィットをアイコンで整理。" },
  { role: "社会的証明ハイライト②（レビュー＋メディア/インフルエンサーを1枚に集約）", aspect: "4:5", axis: "cvr", instruction: "レビュー総数・総合評価・満足度と、メディア掲載/インフルエンサー紹介を1枚に集約。レビューは★4.2以上中心で、★3以下の不安には改善報告・注意書きを先回りで一言添える。" },
  { role: "機能訴求③品質・技術のこだわり", aspect: "4:5", axis: "cvr", instruction: "採用部品・素材・技術の品質をクローズアップで訴求。" },
  { role: "機能訴求④接続性・利便性・使いやすさ", aspect: "4:5", axis: "cvr", instruction: "対応機器・簡単操作・付属ケーブルなど使い勝手のよさを提示。" },
  { role: "各部名称・付属品（図解）", aspect: "4:5", axis: "cvr", instruction: "各部の名称と付属品をイラスト図解で分かりやすく説明。" },
  { role: "製品仕様テーブル", aspect: "4:5", axis: "cvr", instruction: "サイズ・重量・出力・入力・付属品などを一覧表で整理。" },
  { role: "回遊・クロスセル（関連・売れ筋）", aspect: "4:5", axis: "aov", instruction: "ページ下部の回遊バナー。関連商品・売れ筋ランキングTOP3・セットでお得への誘導を1枚に集約し、店内回遊へ流す。" },
  { role: "クロージング（今買う理由・CTA）", aspect: "4:5", axis: "cvr", instruction: "期間限定・特典・クーポンなど今買う理由を示し、購入アクションを後押し。" },
];
// C: 不安解消型（高単価・食品・初購入ユーザー向け）計16枚。疑問を先回りして潰す構成。
const RAKUTEN_ANXIETY_RELIEF = [
  { role: "メイン画像（白/写真背景・文字20%以下）", aspect: "1:1", main: true, axis: "access", instruction: "ページ1枚目＝クリック後の安心・シズルを最優先に別設計する（検索結果サムネとは別物）。白または写真背景、テキスト20%以下、枠線なし。商品のシズルを主役に。" },
  { role: "ブランド信頼ヘッダー（老舗・創業ストーリー）", aspect: "4:5", axis: "cvr", instruction: "創業年・産地・職人ブランドなどの世界観で、最初に老舗感・信頼感を与える。" },
  { role: "価格の理由を先出し（高い理由・改定理由を正直に）", aspect: "4:5", axis: "cvr", instruction: "なぜこの価格なのかを正直に説明し、高単価への不安・離脱を先回りで防ぐ。" },
  { role: "受賞・ランキング実績", aspect: "4:5", axis: "cvr", instruction: "Shop of the Year・年間ランキング1位など権威ある受賞で『選んで間違いない』安心感を確立。" },
  { role: "数値的実績（社会的証明・★4.2以上を強調）", aspect: "4:5", axis: "cvr", instruction: "総レビュー数・累計販売・『最も売れた』など数値の実績で信頼を積み上げる。評価は★4.2以上を強調。" },
  { role: "訳あり・お得な理由の正直な説明", aspect: "4:5", axis: "cvr", instruction: "規格外・傷など安さの理由を正直に告知し、品質への不安を払拭する。" },
  { role: "品質・製法の核心価値（無添加・素材のこだわり）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "原材料・無添加・無塩など健康面の核心価値を強調。子育て世代・健康志向に訴求。" },
  { role: "内容量・サイズ感の具体提示", aspect: "4:5", axis: "cvr", instruction: "1枚あたり◯g・◯枚入りなど具体的な量とサイズ感を実物写真で示す。" },
  { role: "人気の理由①（食べやすさ等のベネフィット）", aspect: "4:5", axis: "cvr", instruction: "家族みんなが食べやすい等の生活ベネフィットを写真と具体的な声で。" },
  { role: "人気の理由②（産地・品質の説明＋産地マップ）", aspect: "4:5", axis: "cvr", instruction: "産地や品質を地図付きで解説。複数産地表示の理由など疑問を先回りで解消。" },
  { role: "比較で購入判断サポート", aspect: "4:5", axis: "cvr", instruction: "種類や競合との比較表で、どれを選べばよいか購入判断を助ける。" },
  { role: "ブランドストーリー・製造工程（4ステップ可視化）", aspect: "4:5", axis: "cvr", instruction: "買付→加工→品質管理→保管などの工程を4ステップで可視化し、品質の高さを証明。" },
  { role: "利便性・保存・調理方法", aspect: "4:5", axis: "cvr", instruction: "個包装・必要な分だけ解凍・レシピ同梱・調理ステップなどで購入後のイメージを明確に。" },
  { role: "ギフト対応・安心（のし/ラッピング/明細非表示/納期）", aspect: "4:5", axis: "aov", instruction: "ギフト需要向けの安心訴求。のし／ラッピング／メッセージカード／手提げ袋の有無をアイコンで明示。『金額のわかる明細書は同梱しません』を目立たせる。お届け日・配送の確実性を添え、贈る側の不安（届かない/破損/値段バレ）を先回りで払拭。" },
  { role: "よくある不安の解消（Q&A・先回り型）", aspect: "4:5", axis: "cvr", instruction: "購入前の疑問・不安をQ&Aで先回りして解消。レビュー★3以下で出やすい不安への改善報告・注意書きも一言併記する。" },
  { role: "安心の配送・保証・サポート", aspect: "4:5", axis: "cvr", instruction: "発送スケジュール・支払い方法・返品対応・サポート体制などの安心要素を提示。" },
  { role: "定期・まとめ買い訴求（リピート商材向け・任意）", aspect: "4:5", axis: "aov", instruction: "定期購入・まとめ買いのお得訴求。通常購入との価格差、定期初回クーポン、大容量/セットの単価メリットを数値で提示。継続のベネフィット（買い忘れ防止・割引）を添える。※リピート商材向け。" },
  { role: "クロージング（回遊：関連・セット＋今買う理由）", aspect: "4:5", axis: "aov", instruction: "関連商品・セット・健康的な食生活への回遊導線を強化しつつ、今買う理由で背中を押す。" },
];
// D: 実感・継続型（美容・コスメ/サプリ）計17枚。成分根拠×実感データ→ルーティン提案→定期で継続。
const RAKUTEN_FEEL_CONTINUE = [
  { role: "メイン画像（商品＋セット/バリエ＋実績バッジ）", aspect: "1:1", main: true, axis: "access", instruction: "ページ1枚目＝クリック後の安心・シズルを最優先に別設計（検索結果サムネとは別物）。商品本体＋セット内容/バリエーション＋『ランキング1位』『◯◯受賞』バッジを1枚に集約。白/写真背景・文字20%以下・枠線なし。" },
  { role: "悩み共感（自分ごと化）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "ターゲットの肌悩み/不調に共感させ自分ごと化。※悩み直接ワード（くすみ・シワ・たるみ・薄毛等）は楽天審査で弾かれやすいので言い換える（エイジングケア／ハリ・ツヤケア／透明感ケア／スカルプケア等）。" },
  { role: "商品提示・独自コンセプト（誤解解消）", aspect: "4:5", axis: "cvr", instruction: "『これは△△ではなく◯◯です』という独自ポジショニング/誤解解消で差別化（例：角質を取り除くのではなく育む）。" },
  { role: "選ばれる理由サマリー", aspect: "4:5", axis: "cvr", instruction: "このあと続く効能・成分・安全性の要点を3〜5個の目次として提示。" },
  { role: "効能・使用感 reason①（主要ベネフィット）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "主要ベネフィットを使用シーンとともに。※効能の断定標榜は避ける（化粧品56効能・機能性の範囲内）。" },
  { role: "効能・使用感 reason②（サブベネフィット）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "サブのベネフィットを使用シーンとともに。※断定的な効能表現は避ける。" },
  { role: "成分・処方の科学的根拠", aspect: "4:5", axis: "cvr", yakki: true, instruction: "配合成分や独自処方を図解。コスメは『◯◯オイル/△△処方』、サプリは『◯◯mg配合/エビデンス』。※56効能内・機能性の範囲に収める。" },
  { role: "安全性・処方訴求", aspect: "4:5", axis: "cvr", instruction: "弱酸性・アレルギーテスト済・皮膚科医協力・無添加・アルコールフリー（コスメ）／GMP認定工場・国内製造・無添加（サプリ）。敏感肌・初購入の不安を払拭。" },
  { role: "受賞・販売実績・社会的証明", aspect: "4:5", axis: "cvr", instruction: "累計販売数・楽天ランキング1位・◯冠・メディア掲載を数値で提示し権威性を出す。" },
  { role: "実感データ（打消し表示つき）", aspect: "4:5", axis: "cvr", yakki: true, instruction: "『自分の肌に合うと実感92%』等のアンケート結果。※『個人の感想です／効果には個人差があります』の打消し表示を併記し、安易なビフォーアフターは避け使用感の表現に留める。" },
  { role: "ルーティン提案（続けるイメージ）", aspect: "4:5", axis: "cvr", instruction: "既存スキンケア/日常への組み込み方を図解（洗顔→本品→化粧水…、飲むタイミング等）。『続けやすさ』を訴求＝継続型の核。" },
  { role: "ご使用方法ステップ", aspect: "4:5", axis: "cvr", instruction: "①②③の手順をイラストで。初めてでも迷わず正しく使えるように。" },
  { role: "バリエーション選択（任意）", aspect: "4:5", axis: "cvr", instruction: "香り/種類/容量の違いを比較し選ぶ楽しみを提示。※不要な商材では省略可。" },
  { role: "まとめ買い・定期/セット特典", aspect: "4:5", axis: "aov", instruction: "本数別特典の比較表、大容量の単価メリット、定期初回クーポン・継続割引を数値で。客単価/LTVを引き上げる。" },
  { role: "期間限定キャンペーン", aspect: "4:5", axis: "aov", instruction: "『◯円以上でプレゼント』等を期間明記で。緊急性で即時購買を促す。" },
  { role: "正規品・購買後安心（転売注意・公式）", aspect: "4:5", axis: "cvr", instruction: "転売品/並行輸入/模倣品への注意喚起、公式ショップの安心、返品保証・送料無料・サポートを明示。コスメでは必須。" },
  { role: "クロージング（モデルカット＋実感＋今買う理由）", aspect: "4:5", axis: "cvr", instruction: "モデルカット＋情緒コピー＋実感データ＋『今買う理由』で背中を押す。" },
];
// E: 世界観・ライフスタイル型（アパレル・雑貨・インテリア）計17枚。世界観×シーン×UGCで自分ごと化。
const RAKUTEN_LIFESTYLE = [
  { role: "メイン画像（世界観＋選べる自由度＋実績バッジ）", aspect: "1:1", main: true, axis: "access", realmatch: true, instruction: "ページ1枚目＝クリック後の引きを最優先に別設計（検索結果サムネとは別物）。世界観の伝わる商品ビジュアル＋ブランドロゴ＋『選べる◯種/◯タイプ』の自由度＋『ランキング1位』等の実績バッジを1枚に集約。色・形は実物準拠。白/写真背景・文字20%以下・枠線なし。" },
  { role: "実績・信頼バナー（先に信頼）", aspect: "4:5", axis: "cvr", instruction: "ランキング受賞・累計販売数・レビュー件数を冒頭で提示し、購入ハードルを先に下げる。" },
  { role: "世界観・トップコンセプト", aspect: "4:5", axis: "cvr", instruction: "ブランド/商品の世界観を縦長ビジュアル＋コピーで表現。『どんな気分・暮らしになれるか』を伝える。" },
  { role: "ブランドストーリー", aspect: "4:5", axis: "cvr", instruction: "『◯◯とは』で作り手の想い・素材・背景を語り、情緒的な信頼を作る。" },
  { role: "UGC・ユーザー投稿（リアルな使用イメージ）", aspect: "4:5", axis: "cvr", ugc: true, instruction: "実ユーザーの着用/使用写真を複数掲載し『リアルな使用イメージ』を提示。" },
  { role: "シーン・ライフスタイル提案", aspect: "4:5", axis: "cvr", instruction: "アパレルはコーデ・着回し、雑貨は使用シーン・ギフト、インテリアは部屋への配置・空間演出を提案し自分ごと化させる。" },
  { role: "使い方/楽しみ方ガイド", aspect: "4:5", axis: "cvr", instruction: "HOW TO・コーデ例・組み合わせ/ブレンド等、楽しみ方を図解。" },
  { role: "バリエーション体系紹介（選ぶ楽しみ）", aspect: "4:5", axis: "cvr", instruction: "全バリエーションを系統別/タイプ別に整理して一覧化。多SKUを『選ぶ楽しみ』に転換。" },
  { role: "バリエーション詳細（人気タイプ深掘り）", aspect: "4:5", axis: "cvr", instruction: "人気タイプ/香り/カラーを特徴コピー＋ビジュアルで深掘り。" },
  { role: "カラー/種類展開一覧（任意）", aspect: "4:5", axis: "cvr", instruction: "全カラー・全種の展開を俯瞰できる一覧。※不要な商材では省略可。" },
  { role: "サイズ感・選び方サポート", aspect: "4:5", axis: "cvr", realmatch: true, instruction: "アパレルは身長体型別の着用参考・モデル情報(身長/体重)・寸法表、インテリアは寸法・他家具との大きさ比較・設置イメージ、雑貨はサイズ感・容量。届いてからの誤認を防ぐ。色・寸法は実物準拠。" },
  { role: "多角度・ディテール（質感クローズ）", aspect: "4:5", axis: "cvr", realmatch: true, instruction: "正面/側面/背面、素材アップ、質感のクローズアップ。色・質感は実物準拠。" },
  { role: "素材・スペック・お手入れ", aspect: "4:5", axis: "cvr", instruction: "素材構成・品質・取扱い表示／商品の基礎知識。※消臭・抗菌・除菌等をうたう雑貨は景表法・品質表示の対象、根拠なき効果標榜は避ける。" },
  { role: "まとめビジュアル（世界観の総括）", aspect: "4:5", axis: "cvr", instruction: "全ラインナップを並べた総括カットで世界観を締める。" },
  { role: "セット/まとめ買い/関連（回遊）", aspect: "4:5", axis: "aov", instruction: "選べるセット・関連商品・コーデ提案への回遊。客単価を引き上げる。" },
  { role: "プロモ・クーポン/LINE特典", aspect: "4:5", axis: "aov", instruction: "LINE登録◯円OFF・期間限定特典で初回購入を後押し。" },
  { role: "クロージング（世界観コピー＋今選ぶ理由）", aspect: "4:5", axis: "cvr", instruction: "世界観コピー＋『今選ぶ理由』で締める。" },
];

// ===== Amazon 商品ページ構成（通常出品・A+なし前提／各8枚＝メイン1＋サブ7）=====
// メイン画像は全型共通で純白・商品単体・文字/ロゴ/枠線NG。情報ダイエットして長尺LPにしない。
const AMAZON_MAIN_A1 = "純白背景(#FFFFFF)・商品単体。ロゴ/枠線/装飾テキストは入れない。訴求文を入れたい場合は画像直接ではなくパッケージデザイン自体に焼き込む。受賞バッジ等は商品に物理的に貼った状態で撮影して表現する。深い影＋水滴/泡のシズルで立体感・高級感を出す。※バッジ面積が商品より大きくならないよう調整し、完全白抜きに戻せる範囲で。";
// 型A1：機能・スペック型（家電・コスメ・サプリ・日用品）
const AMAZON_A1 = [
  { role: "メイン画像（純白・商品単体）", aspect: "1:1", main: true, axis: "access", instruction: AMAZON_MAIN_A1 },
  { role: "主要ベネフィット（一撃）", aspect: "1:1", axis: "cvr", instruction: "一番の売りを1つ、大きな数値・短いコピーで一撃で伝える。" },
  { role: "スペック/機能①（核心・特大数値）", aspect: "1:1", axis: "cvr", instruction: "核心スペックを特大数値＋クローズアップで。" },
  { role: "スペック/機能②（成分・構造の図解）", aspect: "1:1", axis: "cvr", yakki: true, instruction: "独自処方・配合量・構造を図解。コスメ・サプリは効能の断定標榜を避ける。" },
  { role: "使用シーン・使い方（3ステップ）", aspect: "1:1", axis: "cvr", instruction: "誰が・いつ・どう使うかを3ステップで簡潔に。" },
  { role: "比較・選ばれる理由（○×表）", aspect: "1:1", axis: "cvr", instruction: "自社ラインナップ比較 or 一般比較を○×表で。誇大表現NG・事実ベース。" },
  { role: "社会的証明（ランキング・実感%）", aspect: "1:1", axis: "cvr", yakki: true, instruction: "ランキング・累計販売・受賞バッジ・実感%を数値中心で。実感%は打消し表示を併記。長文レビュー画像は作らない。" },
  { role: "安心・保証/内容物/正規品", aspect: "1:1", axis: "aov", instruction: "保証・サポート・内容物・正規品を提示。定期おトク便対応ならお得を訴求し客単価を補う。" },
];
// 型A2：不安解消・信頼型（高単価・食品・ギフト）
const AMAZON_A2 = [
  { role: "メイン画像（純白・シズル・商品単体）", aspect: "1:1", main: true, axis: "access", instruction: "純白背景・商品単体・シズル重視。文字/ロゴ/枠線NG。訴求はパッケージへ焼き込み、受賞シールは商品に貼った状態で撮影。深い影とシズルで食欲・高級感。" },
  { role: "信頼ヘッダー/ブランド実績", aspect: "1:1", axis: "cvr", instruction: "老舗・累計・ランキングで最初に信頼を与える。" },
  { role: "価格・品質の理由（正直に）", aspect: "1:1", axis: "cvr", yakki: true, instruction: "高い理由・こだわり・製法を正直に。食品の機能性表現に注意。" },
  { role: "安全性・品質保証", aspect: "1:1", axis: "cvr", instruction: "産地・無添加・検査・製造体制で安全性を示す。" },
  { role: "内容量・サイズ感/使い方", aspect: "1:1", axis: "cvr", instruction: "具体提示で疑問を先回りして解消。" },
  { role: "よくある不安の解消（Q&A）", aspect: "1:1", axis: "cvr", instruction: "初購入の疑問をQ&Aで凝縮。" },
  { role: "社会的証明（実績・受賞・実感）", aspect: "1:1", axis: "cvr", yakki: true, instruction: "レビュー実績・受賞・実感を数値中心で。実感は打消し表示を併記。" },
  { role: "配送・保証・正規品/今買う理由", aspect: "1:1", axis: "aov", instruction: "購買後の安心＋今買う理由。ギフト対応・定期があれば訴求し客単価を補う。" },
];
// 型A3：ライフスタイル型（アパレル・雑貨・インテリア）
const AMAZON_A3 = [
  { role: "メイン画像（純白・商品単体）", aspect: "1:1", main: true, axis: "access", realmatch: true, instruction: "純白背景・商品単体（バリエーション並びは2枚目以降）。色・形は実物準拠。文字/ロゴ/枠線NG。" },
  { role: "世界観・コンセプト＋実績バッジ", aspect: "1:1", axis: "cvr", instruction: "世界観コピー＋ランキング等の実績バッジ。" },
  { role: "使用/着用イメージ・シーン提案", aspect: "1:1", axis: "cvr", realmatch: true, instruction: "アパレルはコーデ、雑貨は使用シーン、インテリアは部屋への配置で自分ごと化。色・形は実物準拠。" },
  { role: "バリエーション/カラー展開一覧", aspect: "1:1", axis: "cvr", realmatch: true, instruction: "全カラー・全種を俯瞰できる一覧。色は実物準拠。" },
  { role: "サイズ感・選び方", aspect: "1:1", axis: "cvr", realmatch: true, instruction: "アパレルは身長体型別・寸法表、インテリアは寸法・空間サイズ感、雑貨は容量。実物準拠。" },
  { role: "ディテール・素材・質感", aspect: "1:1", axis: "cvr", realmatch: true, instruction: "多角度・素材アップ・質感のクローズアップ。実物準拠。" },
  { role: "社会的証明（ランキング・レビュー数・UGC）", aspect: "1:1", axis: "cvr", ugc: true, instruction: "ランキング・レビュー数・UGCを数値中心で。UGCは本人許諾済みのみ。" },
  { role: "セット/関連・安心保証/正規品", aspect: "1:1", axis: "aov", instruction: "セット品・関連＋購買後安心（正規品・保証）で客単価を補う。" },
];

const MALLS = {
  amazon: {
    label: "Amazon",
    thumbSize: "1600×1600px以上（正方形）",
    tone: "ロジカル・機能訴求型。煽りは避け、1画像1訴求でスペックや利点を明快に。カタログ調で清潔感重視。",
    mainRule:
      "メイン画像は純白背景(#FFFFFF)必須。文字・ロゴ・イラスト・枠線・同梱物以外のパーツは一切入れない。商品単体を正確に写し、自然な影のみ可。",
    // バナー（プロモ）出力サイズ：[主, 副]
    bannerSizes: [
      { key: "main", label: "Amazon A+ ヘッダー", w: 1464, h: 600, aspect: "16:9" },
      { key: "sub", label: "Amazon サブ画像", w: 1600, h: 1600, aspect: "1:1" },
    ],
    // 商品ページ構成（通常出品・A+なし／各8枚＝メイン1＋サブ7）。3型から選択可能。
    pageSlots: AMAZON_A1, // 既定
    pageTemplates: {
      a1_spec: { label: "A1 機能・スペック型（家電・コスメ・サプリ・日用品）", slots: AMAZON_A1 },
      a2_trust: { label: "A2 不安解消・信頼型（高単価・食品・ギフト）", slots: AMAZON_A2 },
      a3_lifestyle: { label: "A3 ライフスタイル型（アパレル・雑貨・インテリア）", slots: AMAZON_A3 },
    },
  },

  rakuten: {
    label: "楽天市場",
    thumbSize: "700×700px以上（1000px以上推奨・正方形）",
    tone: "イベント連動の賑わい型。お買い物マラソン等のお得感・今買う理由を演出。テレビショッピング調の共感ストーリー。",
    mainRule:
      "メイン画像はテキスト占有率20%以下。枠線（L字・帯含む）一切NG。背景は白または写真背景のみ。文字は1箇所にまとめて配置。",
    bannerSizes: [
      { key: "main", label: "楽天バナー", w: 1080, h: 270, aspect: "4:1" },
      { key: "sub", label: "LINE/縦長バナー", w: 1040, h: 585, aspect: "16:9" },
    ],
    // 既定は課題解決型。構成は pageTemplates から選択可能。
    pageSlots: RAKUTEN_PROBLEM_SOLVING,
    pageTemplates: {
      problem_solving: { label: "課題解決型（共感→解決→信頼）", slots: RAKUTEN_PROBLEM_SOLVING },
      trust_first: { label: "信頼構築最優先型（実績・社会的証明を先行）", slots: RAKUTEN_TRUST_FIRST },
      anxiety_relief: { label: "不安解消型（高単価・食品・初購入ユーザー向け）", slots: RAKUTEN_ANXIETY_RELIEF },
      feel_continue: { label: "実感・継続型（美容・コスメ/サプリ）", slots: RAKUTEN_FEEL_CONTINUE },
      lifestyle_world: { label: "世界観・ライフスタイル型（アパレル・雑貨・インテリア）", slots: RAKUTEN_LIFESTYLE },
    },
  },

  yahoo: {
    label: "Yahoo!ショッピング",
    thumbSize: "1200×1200px推奨（正方形）",
    tone: "減点されないスマート＆クリーン型。前半勝負。PayPay還元・優良配送を意識した安心感。",
    mainRule:
      "メイン画像はテキスト20%以下・枠線NG。「送料無料」「価格」「他社ランキング」等の文字記載は禁止。左上30%に余白を確保（自動バッジ回避）。",
    bannerSizes: [
      { key: "main", label: "Yahoo!バナー", w: 1080, h: 270, aspect: "4:1" },
      { key: "sub", label: "LINE/縦長バナー", w: 1040, h: 585, aspect: "16:9" },
    ],
    // 前半勝負のスマート構成（計6枚）
    pageSlots: [
      { role: "メイン画像（白背景・左上余白・文字20%以下）", aspect: "1:1", main: true, instruction: "白背景・テキスト20%以下・枠線なし。左上30%は余白。送料無料/価格/ランキングの文字は入れない。" },
      { role: "ファーストビュー（実質価格訴求）", aspect: "1:1", instruction: "PayPayポイント還元・優良配送・スピード発送をスマートに訴求。" },
      { role: "3大特徴（要約）", aspect: "1:1", instruction: "この商品の強みを3つ以内で箇条書き要約。" },
      { role: "核心ベネフィット詳細", aspect: "1:1", instruction: "最も伝えたい強みの詳細を1枚で。" },
      { role: "購入者の声・安心感", aspect: "1:1", instruction: "レビューダイジェスト・ショップのサポート体制で安心感。" },
      { role: "要点まとめ（1分で読める）", aspect: "1:1", instruction: "全体の要点をコンパクトにまとめる。" },
    ],
  },

  qoo10: {
    label: "Qoo10",
    thumbSize: "800×800px以上（正方形）",
    tone: "スマホファースト・SNS映え・直感型。Z世代/女性向けに可愛さ・トレンド感・エモさを重視。ネオン/パステル配色。",
    mainRule:
      "公式は白背景推奨だが、メガ割等では文字入れ・可愛い装飾も可。商品の発色・テクスチャーがパッと伝わるInstagram風の映える1枚に。",
    bannerSizes: [
      { key: "main", label: "Qoo10メイン", w: 1080, h: 1080, aspect: "1:1" },
      { key: "sub", label: "Qoo10縦長", w: 1080, h: 1350, aspect: "4:5" },
    ],
    // SNSライクな縦スクロール構成（計6枚）
    pageSlots: [
      { role: "メイン画像（映える1枚）", aspect: "1:1", main: true, instruction: "商品の発色・質感がパッと伝わるInstagram風の映えるメイン。" },
      { role: "トレンド感・バズ感", aspect: "4:5", instruction: "「SNSで話題！」「メガ割限定」などのアイキャッチ。" },
      { role: "Before / After", aspect: "4:5", instruction: "使う前と後の視覚的な圧倒的変化を対比で。" },
      { role: "カラー・バリエーション展開", aspect: "4:5", instruction: "全色・全種類を並べて網羅的に見せる。" },
      { role: "使い方・テクスチャー", aspect: "4:5", instruction: "質感や使い方が伝わる、動きを感じる構図。" },
      { role: "レビュー・インフルエンサー", aspect: "4:5", instruction: "リアルな口コミやインフルエンサー紹介で欲しい気持ちを後押し。" },
    ],
  },
};

// ============================================================
//  デザインテイスト（5分類）
//  サブ画像/バナーの「勝ちパターン」をフォント・配色・レイアウトで定義。
// ============================================================
const TASTES = {
  logical: {
    label: "スタイリッシュ＆ロジカル（男性向け・機能美）",
    guide:
      "フォント: 太めのゴシック体、太いサンセリフ（英字）。配色: 黒・ネイビー・ダークグレー、アクセントに鮮やかな青や赤（蛍光色は避ける）。レイアウト: 背景はコンクリート調/カーボン調、またはスッキリした白・黒。商品を中央に大きく配置し、引き出し線（矢印やライン）でパーツごとの機能・サイズ・数値を解説するガジェット/機械的レイアウト。情緒より、スペック・数値・実用性を論理的に訴求する。",
  },
  natural: {
    label: "ナチュラル＆ニュアンス（女性向け・情緒）",
    guide:
      "フォント: 明朝体、細めの丸ゴシック、手書き風（英語）。配色: ベージュ・くすみカラー・パステルピンク・生成り（キナリ）。レイアウト: 余白をたっぷり取り、自然光が入る部屋の利用シーンやモデルのライフスタイル写真を大きく使う。文字は小〜中。派手な装飾を避け、透け感のある帯の上に文字を乗せるなど透明感を意識。スペックより心地よさ・体験（ベネフィット）への共感を重視。",
  },
  luxury: {
    label: "ラグジュアリー＆ミニマル（高級・ギフト・文字少なめ）",
    guide:
      "フォント: 洗練された細身の明朝体（リュウミン等）、美しいセリフ体（英字）。配色: ゴールド・シルバー・深いワインレッド・漆黒・ディープグリーン。レイアウト: 文字は圧倒的に少なく、キャッチコピーを1行だけ置き、残りは商品の質感が極限まで伝わる高解像度写真で見せる。桐箱入り・リボン包装などのラッピングや、伝統・素材のこだわりを静かに語る引き算のデザイン。価格ではなく価値・信頼感を演出。",
  },
  sns: {
    label: "SNS・トレンド（スマホ特化・若年層）",
    guide:
      "フォント: 太めの丸ゴシック、Y2K風ポップ、韓国風フォント。配色: ネオンカラー（蛍光ピンク・パープル）、ビビッド、ホログラム調。レイアウト: コラージュ風や絵文字・手書き風矢印を多用。テクスチャーのドアップやリール動画の切り抜き風など、動き・リアルさが伝わる切り口。テキストは単語レベルで短く、スマホでスクロールされても指が止まるインパクト勝負。",
  },
  impact: {
    label: "インパクト＆大文字（視認性・メガモール）",
    guide:
      "フォント: 超極太のゴシック体（特太ゴシック）、角ポップ体。配色: 赤×黄（ドンキ風）、オレンジ、ゴールド（売上1位の帯）。レイアウト: 文字をとにかく大きく。画像の上下に太い座布団（背景帯）を敷き、白抜き文字やグラデーション文字を最大サイズで配置。「ランキング1位獲得！」「累計10万個突破！」等の実績バッジを四隅に配置し、賑わい感と安心感を演出する。小さなスマホ画面でも拡大せず読める親切設計。",
  },
  premium: {
    label: "プレミアム・アクティブ（洗練された機能美と信頼感）",
    guide:
      "世界観: 日本のミニマルなWebデザイン（Japanese minimalist web design）、高級感のあるスポーツテック・スタイル（high-end sports technology style）、洗練された高級感（sleek and premium）。" +
      "配色: 清潔感のある白とライトグレーの背景（clean white and light gray background）、チャコールグレーと上品なゴールドのアクセント（premium charcoal gray and gold accents）。" +
      "レイアウト・グラフィック: すっきりとした格子状のレイアウト（clean grid layout）、アワードのリボンやプロ仕様のエンブレム・勲章（award ribbons and professional emblems）、現代的なサンセリフ体のタイポグラフィ（modern sans-serif typography）。" +
      "被写体: ビジネス／プロフェッショナルのシーン（オフィス・会議・出張等）と商品単体の高級感に限定する。『アクティブ』は“活動的なビジネスパーソン”の意味であり運動の意味ではない。使わない被写体：スポーツ・運動・フィットネス・ジム・ダンベル・トレーニング。" +
      "画質・ライティング: 商業用・広告用の写真クオリティ（commercial photography）、明るく柔らかいスタジオ照明で影を強く出しすぎない（bright and soft studio lighting）、ハイコントラストで清潔感のあるプロっぽい仕上がり（high contrast, clean and professional look）、高精細。" +
      "テキストは極限まで少なく: 文字数は最小限にする（minimalist design with very few words / short text phrase only）。短く簡潔なコピーのみ（minimal typography with short and concise text）、1フレーズあたりの語数も大幅に減らす（very few words per sentence）。情報を詰め込まず、余白と洗練を優先する。",
  },
  wafu_food: {
    label: "和風高級食品（老舗・職人・産地直送）",
    guide:
      "全体スタイル: 老舗・職人・産地直送を感じさせる和モダン高級デザイン（Japanese-modern luxury food design）。信頼感と上質さを最優先し、安っぽさ・量産感を排除する。" +
      "背景・配色: ダークトーン（漆黒・濃紺・深緑／deep black, navy, dark green）をベースに、和紙ベージュ／クリームのセクションを段組みで配置（washi-beige and cream stacked sections）。差し色にゴールド／シャンパンゴールドの細線（thin gold / champagne-gold hairlines）。受賞バッジに少量の赤。" +
      "料理写真（最重要）: 脂がのった料理のクローズアップで、照り・湯気・焼き目などのシズル感（glossy sheen, rising steam, char marks）。暗めでムーディな自然光（moody low-key natural lighting）、器は和食器、背景は木目または黒い石板（wood-grain or black slate）。プロのフードフォトグラフィーで食欲をそそる質感。" +
      "タイポグラフィ: 見出しは筆文字（毛筆・書道／Japanese brush calligraphy, shodo）と明朝体の縦組みを併用。『手塩製法』『最高品質厳選』のような語を力強い書道風で。本文は読みやすい明朝。金色の罫線や和柄（wagara）を装飾に。" +
      "信頼演出パーツ: 受賞バッジ風エンブレム、産地を示す日本地図のマップ、丸い『厳選』印、三代続く老舗の物語性（award emblems, regional origin map, premium selection seal, heritage storytelling）。" +
      "構図: 縦長スクロール型LPのように、上から下へ情報が流れる段組みレイアウト。高解像度のプロEC向けグラフィックデザイン。",
  },
  k_beauty: {
    label: "K-Beauty・淡色くすみ（韓国コスメ・SNS映え）",
    guide:
      "全体スタイル: 韓国コスメ・K-Beauty系のトレンド感（Korean beauty aesthetic）。淡くてくすんだパステルカラー（dusty pastel / muted blush pink, lilac, sage green）で統一し、清潔感と可愛さを両立。" +
      "背景・配色: くすみベージュ・ラベンダーグレー・ミルクホワイトを基調。コーラルピンク・ミントグリーン・スモーキーパープルのソフトアクセント。ホログラム・パール素材のテクスチャをさりげなく使用。" +
      "レイアウト: 縦長スマホファーストのレイアウト（mobile-first vertical layout）。コラージュ風・フラットレイ（flat lay）・切り抜き写真の組み合わせ。テキストは手書き風 or 細めの丸ゴシック、短いひと言コピー（short punchy copy）。" +
      "被写体: 清潔感のある肌・素肌美容コスメのクローズアップ、小花・ドライフラワー・パールのスタイリング。「盛れる」感とナチュラルさの共存。SNS映えを意識した配置。" +
      "演出: グラデーションふわっと背景、ピンクゴールドの細い飾りライン、英字キャプション（例: soft & dewy）。",
  },
  eco: {
    label: "エコ・サステナブル（自然・グリーン・環境配慮）",
    guide:
      "全体スタイル: 地球環境・サステナブル・ビーガン・オーガニックを体現した自然派デザイン（eco-friendly, sustainable, organic aesthetic）。自然素材の質感と深みのある緑を基調。" +
      "背景・配色: アースカラー（フォレストグリーン・テラコッタ・サンドベージュ・ナチュラルリネン）。モスグリーン・深いオリーブ・温かみのあるオフホワイト。プラスチックフリーを連想させるクラフト紙・麻のテクスチャ。" +
      "レイアウト: 余白多め・引き算のシンプル構成。植物のイラスト・葉脈・枝をさりげない装飾に。ラベル・スタンプ風のナチュラルなバッジ（クラフト紙風・手書き風）。" +
      "被写体: 豊かな緑・自然光・土・植物のクローズアップ。モデルは素肌ナチュラルメイクまたは屋外ライフスタイル。再生紙・ガラス容器・竹素材の商品演出。" +
      "テキスト: 細い丸ゴシックまたは手書き系フォント。ひらがな多めの穏やかな語調。英字はスラブセリフや手書き体（slab serif / handwritten）。短いエコメッセージを添えると効果的。",
  },
  white_luxury: {
    label: "ホワイト・ラグジュアリー（清潔感×権威性）",
    guide:
      "全体スタイル: クリーン・プレミアム（clean premium）。清潔感・上質さ・科学的な信頼性を最優先。高単価・ギフト向けにふさわしい洗練。余白を大きく取る（generous white space）。" +
      "背景・配色: 明るい白／クリーム／ライトグレーを基調にたっぷりの余白（bright white, cream, light gray base）。主役商品はマット質感（matte）。差し色にゴールド（受賞バッジ）とネイビー／チャコール（gold, navy, charcoal accents）。全体は清潔で落ち着いたトーン。" +
      "主役の写真: 主役商品を明るい背景に配置し、素材や構造のマクロ撮影も交える。清潔な空間でのライフスタイルカット。プロのプロダクトフォトグラフィー、柔らかい自然光、影は柔らかく（professional product photography, soft natural light, gentle soft shadows）。" +
      "信頼演出パーツ: ゴールドの受賞エンブレム（『第1位』『8冠』など）、数値を特大表示したデータグラフ（耐久性・実証データ等）、医師・専門家の推薦バッジ、TV紹介ロゴ風の帯（gold award emblems, oversized KPI numbers, expert recommendation badges, TV-feature bars）。" +
      "タイポグラフィ: クリーンで読みやすいゴシック体。KPI数値は特大で強調、見出しは太字・補足は細字。装飾は最小限で、上品な金の罫線（elegant gold hairlines）のみ。" +
      "構図: 縦長スクロール型LPのように上から下へ情報が流れる段組み。高解像度のプロEC向けグラフィックデザイン、清潔感のある仕上がり。",
  },
};

// 黒×赤テイストの4サブスタイル。ページ構成（スロット役割）に応じて自動選択する。
const KUROAKA = {
  precision:
    "[漆黒の精密感／写真] 黒を基調とした製品クローズアップ。マットブラックの製品（matte black product）を寄りで捉え、背景は深いチャコール〜黒のグラデーション（deep charcoal-to-black gradient）。柔らかい指向性のリムライトで輪郭とテクスチャを繊細に（soft directional rim lighting）。前景に木製デスク小物を浅い被写界深度でボカし高級感を両立。フォトリアルな高級商業写真（photorealistic, high-end commercial product photography）。",
  red:
    "[情熱の赤・インパクト訴求／バナー] 鮮やかな深紅（クリムゾンレッド／vivid crimson red）の単色背景＋わずかな放射状ビネット。中央に大きな白抜きの太ゴシック日本語（oversized white bold Gothic）。ゴールドのメダル/月桂樹エンブレム（gold medal/laurel 'No.1' emblems）を左右対称に複数配置し、受賞・1位・実績の権威感を演出。写真要素は使わずフラットなグラフィックで強い視覚的ヒエラルキー。",
  white:
    "[白ホリゾント・機能解説／インフォグラフィック] 純白〜極薄グレーの無背景（pure white infinity background）に製品を正面〜斜め45度で。均一なソフトボックス照明で細部を明快に、影・反射は抑える（no shadows, no reflections）。各部位に番号アイコンと短い説明を添えたインフォグラフィック（numbered callout annotations）。白背景に黒テキストのクリーンなUI。",
  cinematic:
    "[シネマティック・ライフスタイル／写真] モダンなデスク/利用シーンを俯瞰〜水平アングルで、製品を自然に配置。青〜紫のRGB間接照明が映り込み夜の作業空間をドラマチックに（ambient RGB blue-purple backlighting）。浅いフォーカスとボケのライトアクセント、シネマスコープ的な横長。映画のワンシーンのような空気感、フォトリアル。",
};

// スロットの役割や用途に応じて黒×赤のサブスタイルのキーを選ぶ
function kuroakaPickKey(context) {
  const c = String(context || "");
  const has = (...kw) => kw.some((k) => c.includes(k));
  if (has("ランキング", "受賞", "実績", "社会的証明", "累計", "メディア", "インフルエンサー", "キャッチ", "特典", "クロージング", "問題提起", "共感", "バナー", "ファーストビュー"))
    return "red";
  if (has("仕様", "スペック", "各部名称", "付属品", "機能", "特長", "サマリー", "解説", "比較", "Q&A", "使い方", "接続", "構造", "設計", "品質", "アイコン", "根拠", "テーブル"))
    return "white";
  if (has("利用シーン", "ライフスタイル", "シーン", "ビフォーアフター", "暮らし"))
    return "cinematic";
  return "precision";
}

// 黒×赤のサブスタイルキーから、プロンプトに入れる指示文を組み立てる
function kuroakaText(subKey) {
  return [
    "【デザインテイスト: 黒×赤（楽天感×権威性）】",
    "ブランド世界観は、黒（マットブラックの製品・ダークな質感）と深紅（クリムゾンレッドの権威バナー）を軸に、白ホリゾントの機能解説とシネマティックなライフスタイルを使い分ける。",
    "全サブスタイル共通で、1画像あたりの文字は最小限に抑える（要点のみ・短いコピー）。",
    "この画像では次のサブスタイルを採用すること: " + (KUROAKA[subKey] || KUROAKA.precision),
    TASTE_COMMON,
  ].join("\n");
}

// 商品ページ全体のスロット役割から、黒×赤のサブスタイル指示文を一括割り当てる。
// 赤（権威バナー）は maxRed 枚までに制限し、超過分は白（クリーン）にフォールバックする。
function assignKuroaka(roles, maxRed = 3) {
  let redCount = 0;
  return (roles || []).map((role) => {
    let key = kuroakaPickKey(role);
    if (key === "red") {
      if (redCount < maxRed) redCount++;
      else key = "white";
    }
    return kuroakaText(key);
  });
}

// 和モダン職人EC テイストの4サブスタイル。ページ構成（スロット役割）に応じて自動選択する。
const WAMODERN = {
  food:
    "[商品フードビジュアル／写真] 料理・食材の写真。黒い石板・白磁・木のトレーなど和の器に美しく盛り付け、すだち・しそ等の和の添え物。俯瞰または斜め45度のアングル。生成り和紙テクスチャや白の背景。高解像度のスタジオフード写真、柔らかくドラマチックな照明、湯気・煙の演出で食欲を強調（high-resolution studio food photography, off-white washi background, subtle steam）。",
  banner:
    "[和バナー・インフォグラフィック] オフホワイト〜生成りの和紙テクスチャ背景に、青海波（seigaiha）や波紋の淡い和柄をオーバーレイ。ネイビーブルーと朱赤（vermilion）の2色を効かせた大きな明朝体・筆文字。ゴールドの細い飾り枠（thin gold decorative frame）。受賞・ランキングはゴールドで権威表現。清潔で信頼感のあるプレミアム和モダンECバナー。",
  craftsman:
    "[ブランドストーリー・職人イメージ／写真] 熟練の職人の手が食材を丁寧に手仕事しているクローズアップ。清潔感のある白い作業台、プロの加工場の雰囲気。シネマティックな自然光。藍色・墨色・ティール寄りの落ち着いた暗めのトーンで、テキストオーバーレイを想定（cinematic natural lighting, teal and navy moody tones, artisan craftsmanship）。",
  lifestyle:
    "[ライフスタイル・家族シーン／写真] 明るいダイニングで笑顔の三世代日本人家族が食卓を囲む。白い和食器に盛られた料理、箸・おひつ・味噌汁椀などの和の小物。自然光、温かみのある色調、清潔感のあるライフスタイル写真（warm natural window light, heartwarming multigenerational family meal）。",
};

function wamodernPickKey(context) {
  const c = String(context || "");
  const has = (...kw) => kw.some((k) => c.includes(k));
  if (has("ブランド", "ストーリー", "職人", "製造", "工程", "こだわり", "品質", "製法", "産地", "技術", "設計", "構造"))
    return "craftsman";
  if (has("利用シーン", "ライフスタイル", "家族", "食卓", "暮らし", "ベネフィット", "使い方", "シーン", "ビフォーアフター"))
    return "lifestyle";
  if (has("バナー", "キャッチ", "ファーストビュー", "受賞", "ランキング", "実績", "社会的証明", "累計", "特典", "クロージング", "価格", "お得", "訳あり", "Q&A", "サマリー", "比較", "仕様", "テーブル", "各部名称"))
    return "banner";
  return "food";
}

function wamodernText(subKey) {
  return [
    "【デザインテイスト: 和モダン職人EC（Wa-Modern Artisan E-Commerce）】",
    "世界観: 和モダン・職人仕立て・信頼感・清潔感・温かみ・伝統×現代。配色はオフホワイト/生成りの背景に、ネイビーブルー×朱赤（vermilion）×ゴールドのアクセント、墨色の文字。フォントは毛筆体・明朝体寄り。青海波などの和柄、上品な金の飾り枠。1画像あたりの文字は最小限。",
    "この画像では次のサブスタイルを採用すること: " + (WAMODERN[subKey] || WAMODERN.food),
    TASTE_COMMON,
  ].join("\n");
}

// ============================================================
//  商品ジャンル別 デザインテイスト（10パターン）
//  デザインテイストとは別軸で、ジャンルの「勝ちパターン」を指定する。
// ============================================================
const GENRES = {
  food: {
    label: "食品・グルメ（シズル＆産直）",
    guide: "湯気・肉汁・断面・タレのツヤを限界までアップにしたシズル写真が主役。フォントは筆文字（和食/産直）・太め丸ゴシック（スイーツ）・手書き風（カフェ）。配色は暖色系（赤・橙・黄）、高級感を出すなら黒背景。生産者の顔・高評価レビュー・受賞・個包装/大容量などの要素で『美味しそう・食べたい』本能を刺激する。",
  },
  cosme: {
    label: "コスメ・美容（肌悩み解決＆クリーン）",
    guide: "水滴・テクスチャー（液の伸び・泡立ち）・白基調の透明感ある世界観。フォントは細身の美しい明朝・スタイリッシュなセリフ英字。配色は白・パステルブルー・ミントグリーン・くすみピンク（オーガニックはベージュ）。無添加・専門家監修・SNSで話題・肌悩み訴求などの要素。薬機法に配慮し視覚的に効果を伝える。",
  },
  supplement: {
    label: "健康食品・サプリ（エビデンス＆情報密度）",
    guide: "グラフ・成分の分子イメージ・白衣の専門家などで数値とロジックを徹底的に見せる情報密度の高いデザイン。フォントは視認性の高い太め角ゴシック・赤や黄の袋文字。配色は信頼感のネイビー/緑、または元気なビビッド黄/橙。純度100%・◯mg配合（大文字）・GMP認定工場・1日あたり◯円などの要素で納得させる。",
  },
  apparel: {
    label: "アパレル・ファッション（雑誌・LOOKBOOK）",
    guide: "全身・アップ・背面・生地の寄りを綺麗にコラージュし、余白を多めに。フォントは極細ゴシックや細身英字（Futura等）。配色はグレージュ・白・チャコールなど服を邪魔しないニュートラル。モデルの身長・着用サイズ・カラーバリエーション一覧・体型カバーなどの要素。スペックよりシルエットとサイズ感・着用イメージを伝える。",
  },
  interior: {
    label: "インテリア・寝具（ライフスタイル＆空間調和）",
    guide: "自然光が入るおしゃれな部屋・観葉植物・整えられたベッドなどのスタジオ撮影で空間ごと見せる。フォントは優しい丸ゴシック・モダンなゴシック。配色はアースカラー（ブラウン/カーキ/ベージュ/アイボリー）。組立簡単・耐荷重・お部屋に馴染む・北欧/モダンなどの要素。置いたときの馴染みを想像させる。",
  },
  appliance: {
    label: "家電・ガジェット（近未来＆スペック検証）",
    guide: "メタリックな質感・製品内部の3Dレンダリング・暗闇で光るLEDなどで高性能と最新技術を黒/ネイビー背景で際立たせる。フォントは四角くソリッドな未来的フォント・太いサンセリフ。配色は黒・ダークグレー、アクセントにネオンブルーやサイバーグリーン。業界最高峰・静音設計・比較グラフ・端子一覧などの要素。",
  },
  daily: {
    label: "日用品・雑貨（お悩み解決＆時短）",
    guide: "散らかった状態とスッキリした状態の比較など、一目でわかる図解で『使うとどれだけラクになるか』を直感的に伝える。フォントは親しみやすい太めの角丸ゴシック（POP体含む）。配色は清潔感のある白・水色、または注意を引く黄・黄緑。置くだけ・ワンタッチ・大容量◯個パック・主婦の味方などの要素。",
  },
  baby: {
    label: "ベビー・キッズ・ペット（安心安全＆スマイル）",
    guide: "赤ちゃんやペットの満面の笑み・丸みのあるイラストやフレーム（枠線）を多用し、優しさと安全性を極める。フォントは丸ゴシック・手書き風の可愛いフォント・ポップ体。配色はパステルカラー（たまご色/ベビーピンク/サックスブルー/ミント）。天然素材100%・誤飲防止設計・ギフト対応（出産祝い）・現役ママ監修などの要素。",
  },
  sports: {
    label: "スポーツ・アウトドア（アクティブ＆ダイナミック）",
    guide: "青空・山・岩場などの背景、汗を流す人物、砂埃や水飛沫の演出で躍動感とタフさを表現。フォントは右上がりの斜体・力強い極太ゴシック・ステンシル風。配色はアースカラー（オリーブ/サンドベージュ）またはエネルギッシュな橙・赤。高耐久・防水・超軽量・プロ推奨・コンパクト収納などの要素。",
  },
  business: {
    label: "ビジネス・文具・ギフト（信頼・フォーマル）",
    guide: "デスク上に整然と並べた平置き・俯瞰撮影、クラフト紙やウッド調の背景で品格を保つ。フォントは正統派の明朝体（教科書体）・伝統的なセリフ体（Times New Roman等）。配色は濃紺・深緑・ワインレッド・キャメル（本革色）。名入れ無料・高級化粧箱付き・日本製・ビジネス対応などの要素。",
  },
};

// ============================================================
//  ターゲット年齢層（5段階）
// ============================================================
const TARGETS = {
  "10s": "10代",
  "20s": "20代",
  "30s": "30〜40代", // 中心
  "40s": "40代",
  "50s+": "50代以上",
};

function getMall(key) {
  return MALLS[key] || null;
}

// 構成バリデーション: access / cvr / aov の各軸が最低1枚あるかを検査し、不足軸の配列を返す
function validateTemplate(slots) {
  const axes = new Set((slots || []).map((s) => s.axis).filter(Boolean));
  return ["access", "cvr", "aov"].filter((a) => !axes.has(a));
}

// 全テイスト共通の方針（今後追加するテイストにも自動適用）
const TASTE_COMMON = "共通方針: 1画像あたりの文字数は少なくする。要点のみを短いコピーで伝え、情報を詰め込みすぎないこと。視認性と余白を優先する。";

// バナー・自由生成・商品ページのプロンプトに差し込むテイスト指示
// context: スロットの役割や用途（黒×赤テイストの自動サブスタイル選択に使用）
function tasteGuidance(key, context) {
  if (key === "kuroaka") {
    return kuroakaText(kuroakaPickKey(context));
  }
  if (key === "wamodern") {
    return wamodernText(wamodernPickKey(context));
  }
  const t = TASTES[key];
  if (!t) return "";
  return `【デザインテイスト: ${t.label}】\n${t.guide}\n${TASTE_COMMON}`;
}

// ターゲット年齢層の指示
function targetGuidance(key) {
  const t = TARGETS[key];
  if (!t) return "";
  return `【ターゲット年齢層: ${t}】この年齢層に強く刺さる配色・フォント・コピー・モデル選定にする。`;
}

// 商品ジャンル別テイストの指示
function genreGuidance(key) {
  const g = GENRES[key];
  if (!g) return "";
  return `【商品ジャンル: ${g.label}】\n${g.guide}`;
}

// 全テイスト共通の被写体ルール（プロンプト先頭に前置）。テイスト名の語感で文脈が広がる事故を防ぐ。
function subjectPrefix(genreKey) {
  const g = GENRES[genreKey];
  const target = g ? `商品ジャンル（${g.label}）` : "商品の内容・用途";
  return `【被写体ルール】被写体は必ず${target}に沿った文脈にする。商品と無関係な人物・ポーズ・小道具・背景は生成しない。テイスト名の語感（アクティブ/トレンド等）だけで文脈を広げない。`;
}

// ジャンル・テイスト・ターゲット・備考（自由指示）をまとめた追加ガイドを生成
// context: スロット役割や用途（黒×赤テイストの自動サブスタイル選択に使用）
function extrasGuidance({ genre, taste, target, notes, context, tasteText } = {}) {
  const tasteStr = tasteText !== undefined ? tasteText : tasteGuidance(taste, context);
  const parts = [subjectPrefix(genre), genreGuidance(genre), tasteStr, targetGuidance(target)];
  if (notes && notes.trim()) parts.push(`【追加指示・備考】\n${notes.trim()}`);
  return parts.filter(Boolean).join("\n\n");
}

// バナー・自由生成のプロンプトに差し込むモール最適化ガイド
function mallGuidance(key) {
  const m = MALLS[key];
  if (!m) return "";
  return [
    `【出店モール最適化: ${m.label}】`,
    `推奨サイズ: ${m.thumbSize}`,
    `訴求トーン: ${m.tone}`,
    `画像規約: ${m.mainRule}`,
  ].join("\n");
}

// 商品ページの1スロット分のプロンプトを組み立てる
// extras: テイスト・ターゲット・備考をまとめた文字列（extrasGuidance の戻り値）
function buildProductPagePrompt(key, slot, features, index, total, extras) {
  const m = MALLS[key];
  const lines = [
    `あなたは${m.label}向けのプロのECデザイナーです。`,
    `${m.label}の商品ページ用画像を作成します（${index + 1}/${total}枚目）。`,
    ``,
    `【この画像の役割】${slot.role}`,
    slot.instruction,
  ];
  if (slot.main) lines.push(`【メイン画像の厳守事項】${m.mainRule}`);
  lines.push(
    ``,
    `【モールのトーン】${m.tone}`,
    `【推奨サイズ】${m.thumbSize}`
  );
  if (extras) lines.push("", extras);
  lines.push(
    ``,
    `【商品情報】`,
    features && features.trim() ? features.trim() : "（テキスト情報なし。参考画像から判断して作成）",
    ``,
    `日本語テキストは正確・読みやすく大きく。綴り間違いは厳禁。`,
    `ページ全体でデザインの統一感（配色・フォント・トーン）を保つこと。`
  );
  return lines.join("\n");
}


module.exports = { MALLS, TASTES, GENRES, TARGETS, getMall, validateTemplate, tasteGuidance, targetGuidance, genreGuidance, subjectPrefix, extrasGuidance, mallGuidance, buildProductPagePrompt, assignKuroaka };
