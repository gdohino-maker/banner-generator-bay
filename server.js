import express from "express";
import archiver from "archiver";
import pptxgen from "pptxgenjs";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { MALLS, getMall, mallGuidance, extrasGuidance, assignKuroaka, validateTemplate, buildProductPagePrompt } from "./malls.js";
import { checkYakki, yakkiPreventionNote } from "./yakkiho.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-image";
// 文字抽出（OCR）用のテキスト/ビジョンモデル。pptx書き出しで使用。
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const PORT = process.env.PORT || 3000;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// 推奨バナーサイズ
const SIZES = {
  rakuten: { w: 1080, h: 270, aspect: "4:1", label: "楽天" },
  line: { w: 1040, h: 585, aspect: "16:9", label: "LINE" },
};

// 制作途中ページの保存先（新規・別フォルダ。.env の PROJECTS_DIR で変更可）
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(__dirname, "..", "banner-projects");
try { fs.mkdirSync(PROJECTS_DIR, { recursive: true }); } catch (_) {}

const app = express();
app.use(express.json({ limit: "120mb" }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * フォーム入力からデザイン用の日本語プロンプトを組み立てる。
 * 入力はすべて任意。空欄の項目は無視する。
 */
function buildDesignPrompt(p, mallKey, extras) {
  const lines = [];
  if (p.name) lines.push(`商品名: ${p.name}`);
  if (p.saleType) {
    if (p.saleType === "ポイントアップ") {
      lines.push(`セール種別: ポイントアップ${p.rate ? `（${p.rate}倍）` : ""}`);
    } else if (p.saleType === "割引") {
      lines.push(`セール種別: 割引${p.rate ? `（${p.rate}%OFF）` : ""}`);
    } else {
      lines.push(`セール種別: ${p.saleType}${p.rate ? `（${p.rate}）` : ""}`);
    }
  } else if (p.rate) {
    lines.push(`数値: ${p.rate}`);
  }
  if (p.period) lines.push(`セール期間: ${p.period}`);

  const detail = lines.length ? lines.join("、") : "おまかせのセールバナー";
  const guide = mallGuidance(mallKey);

  return [
    "あなたはプロのECサイト向けバナーデザイナーです。",
    "以下の情報をもとに、目を引く高品質なセールプロモーション用バナー画像を作成してください。",
    "",
    detail,
    guide ? "\n" + guide : "",
    extras ? "\n" + extras : "",
    "",
    "デザイン要件:",
    "- 日本語のテキストを正確に、読みやすく大きく配置する",
    "- セール種別・倍率/割引率を最も目立たせる",
    "- 商品名とセール期間を分かりやすく入れる",
    "- 鮮やかで購買意欲を高める配色、清潔感のあるモダンなレイアウト",
    "- テキストの綴り間違いがないようにする",
  ].filter(Boolean).join("\n");
}

/**
 * Gemini 画像生成 API を呼び出す低レベル関数。
 * parts: Gemini API の contents.parts 配列（text / inline_data を任意に含む）
 * aspect: アスペクト比（例 "4:1", "16:9", "1:1"）
 * 戻り値: 生成画像の base64（PNG）
 */
async function generateImageFromParts(parts, aspect) {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY が設定されていません。.env を確認してください。");
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(aspect ? { imageConfig: { aspectRatio: aspect } } : {}),
    },
  };

  const res = await fetch(`${API_BASE}/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API エラー (${res.status}): ${text}`);
  }

  const json = await res.json();
  const candidateParts = json?.candidates?.[0]?.content?.parts || [];
  for (const part of candidateParts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) return inline.data;
  }
  throw new Error("画像が生成されませんでした。プロンプトを変更して再試行してください。");
}

/**
 * スタイル見本画像群を解析し、配色・フォント・装飾・レイアウト等を
 * 文章の「デザイン仕様」にまとめて返す（ベストエフォート、失敗時は空文字）。
 */
async function describeStyleImages(styleImages) {
  const imgs = Array.isArray(styleImages) ? styleImages.filter((i) => i?.data) : [];
  if (!API_KEY || imgs.length === 0) return "";
  const prompt = [
    "次の参考画像群に共通する『デザインの見た目の特徴』を、新しい画像を同じテイストで作るための仕様として日本語で簡潔にまとめてください。",
    "次の観点を箇条書きで: 主要な配色（できれば色名や近い16進カラー）、アクセント色、背景の質感、フォントの印象（太ゴシック/明朝/丸ゴシック/手書き/角ポップ等）、装飾やあしらい（帯/リボン/バッジ/枠/箔押し/吹き出し等）、レイアウトの密度と余白、写真の加工トーン、全体のムード。",
    "画像内の具体的な文言・数値・商品名・レビュー件数などの情報は含めないこと。出力は箇条書きの文章のみ。",
  ].join("\n");
  try {
    const parts = [{ text: prompt }, ...imgs.map((i) => ({ inline_data: { mime_type: i.mimeType || "image/png", data: i.data } }))];
    const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    if (!res.ok) return "";
    const json = await res.json();
    const ps = json?.candidates?.[0]?.content?.parts || [];
    return ps.map((p) => p.text || "").join("").trim();
  } catch (_) {
    return "";
  }
}

/**
 * スタイル見本の踏襲指示テキストと inline_data パーツを作る。
 * styleSpec: describeStyleImages の結果（文章のデザイン仕様）。
 */
function styleParts(styleImages, styleSpec) {
  const imgs = Array.isArray(styleImages) ? styleImages : [];
  const parts = [];
  for (const img of imgs) {
    if (img?.data) parts.push({ inline_data: { mime_type: img.mimeType || "image/png", data: img.data } });
  }
  if (!parts.length) return { instruction: "", parts: [] };
  const lines = ["■最重要・デザインの見た目（スタイル踏襲）"];
  if (styleSpec && styleSpec.trim()) {
    lines.push(
      "次の『スタイル仕様』に厳密に従い、同じ世界観・配色・フォント・装飾・レイアウトで作成してください。この仕様はモール/ジャンル/テイストの文章指定より最優先します。",
      "---- スタイル仕様 ----",
      styleSpec.trim(),
      "---- ここまで ----",
      "添付のスタイル見本画像も視覚的な参考にすること。"
    );
  } else {
    lines.push(
      "添付の『スタイル見本画像』の配色・フォント・装飾・余白・質感・全体の雰囲気に強く合わせて、同じ世界観で作成してください（モール/ジャンル/テイスト指定より優先）。"
    );
  }
  lines.push(
    "ただしスタイル見本/仕様に含まれる文字・数値・レビュー件数・価格・バッジ・商品名・ロゴ・固有情報は一切コピーしないこと。表示する文言・商品情報は『商品の特徴』テキストと『商品画像』からのみ取得する。"
  );
  return { instruction: lines.join("\n"), parts };
}

/**
 * テキスト + 任意の参照画像/スタイル見本から画像を生成する（バナー用の薄いラッパー）。
 */
async function callGemini({ prompt, aspect, referenceImage, styleImages, styleSpec }) {
  const sp = styleParts(styleImages, styleSpec);
  const fullPrompt = sp.instruction ? `${sp.instruction}\n\n${prompt}` : prompt;
  const parts = [{ text: fullPrompt }, ...sp.parts];
  if (referenceImage) {
    parts.push({ inline_data: { mime_type: "image/png", data: referenceImage } });
  }
  return generateImageFromParts(parts, aspect);
}

/**
 * 1商品分のバナーを生成する。モール選択時はそのモールのバナーサイズ2種、
 * 未選択時は従来の楽天(4:1)+LINE(16:9)で生成する。
 * 1) 主バナーをテキストから生成
 * 2) その画像を参照に副バナーを同一デザインで再構成
 * 3) それぞれ推奨サイズへリサイズ
 * 戻り値: { banners: [{ key, label, size, image(base64) }, ...] }
 */
async function generateBanners(product, mallKey, extras, styleImages, styleSpec) {
  const prompt = buildDesignPrompt(product, mallKey, extras);
  const mall = getMall(mallKey);
  const sizes = mall
    ? mall.bannerSizes
    : [
        { key: "rakuten", label: "楽天", w: SIZES.rakuten.w, h: SIZES.rakuten.h, aspect: SIZES.rakuten.aspect },
        { key: "line", label: "LINE", w: SIZES.line.w, h: SIZES.line.h, aspect: SIZES.line.aspect },
      ];

  // 1. 主バナーを生成（スタイル見本があれば踏襲）
  const firstRaw = await callGemini({ prompt, aspect: sizes[0].aspect, styleImages, styleSpec });

  const banners = [
    { key: sizes[0].key, label: sizes[0].label, size: `${sizes[0].w}x${sizes[0].h}`, aspect: sizes[0].aspect, image: firstRaw },
  ];

  // 2. 残りのサイズを、主バナーを参照に同一デザインで再構成
  for (let i = 1; i < sizes.length; i++) {
    const s = sizes[i];
    const rePrompt = [
      "次の参照画像とまったく同じデザイン（配色・スタイル・テキスト内容・要素）を保ったまま、",
      `${s.aspect} のアスペクト比に再構成したバナーを作成してください。`,
      "レイアウトのみ最適化し、デザインの統一感は崩さないこと。",
      "",
      prompt,
    ].join("\n");
    const raw = await callGemini({ prompt: rePrompt, aspect: s.aspect, referenceImage: firstRaw });
    banners.push({ key: s.key, label: s.label, size: `${s.w}x${s.h}`, aspect: s.aspect, image: raw });
  }

  return { banners };
}

// 安全なファイル名を作る
function safeName(name, i) {
  const base = (name || `product_${i + 1}`).replace(/[^\w\u3040-\u30ff\u4e00-\u9fff-]+/g, "_");
  return base.slice(0, 40) || `product_${i + 1}`;
}

// バナー生成 API
app.post("/api/generate", async (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const mallKey = req.body?.mall || "";
  let extras = extrasGuidance({ genre: req.body?.genre, taste: req.body?.taste, target: req.body?.target, notes: req.body?.notes, context: "バナー" });
  { const yk = yakkiPreventionNote(req.body?.yakkiClass); if (yk) extras += "\n\n" + yk; }
  const styleImages = Array.isArray(req.body?.styleImages) ? req.body.styleImages : [];
  if (products.length === 0) {
    return res.status(400).json({ error: "商品が1件も入力されていません。" });
  }

  const styleSpec = (req.body?.styleSpec || "").trim() || await describeStyleImages(styleImages);
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const { banners } = await generateBanners(p, mallKey, extras, styleImages, styleSpec);
      results.push({
        index: i,
        name: safeName(p.name, i),
        displayName: p.name || `商品${i + 1}`,
        ok: true,
        banners, // [{ key, label, size, image }]
      });
    } catch (err) {
      results.push({
        index: i,
        displayName: p.name || `商品${i + 1}`,
        ok: false,
        error: err.message,
      });
    }
  }

  res.json({ results });
});

/**
 * 並列実行を上限付きで回す簡易プール。
 * tasks: () => Promise を返す関数の配列。concurrency: 同時実行数。
 * 各要素ごとに { ok, ... } を返す（失敗しても全体は止めない）。
 */
async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const cur = idx++;
      try {
        results[cur] = { ok: true, image: await tasks[cur]() };
      } catch (e) {
        results[cur] = { ok: false, error: e.message };
      }
    }
  }
  const n = Math.min(concurrency, tasks.length) || 1;
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// 自由生成 API（テキスト指示 + 複数の参考画像 + アスペクト比 + 枚数）
app.post("/api/freeform", async (req, res) => {
  const prompt = (req.body?.prompt || "").trim();
  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  const aspect = req.body?.aspect || "1:1";
  const count = Math.max(1, Math.min(10, parseInt(req.body?.count, 10) || 1));

  if (!prompt && images.length === 0) {
    return res.status(400).json({ error: "テキスト指示または参考画像を入力してください。" });
  }

  // 共通の parts（テキスト + 参考画像）を組み立てる
  const parts = [];
  if (prompt) parts.push({ text: prompt });
  for (const img of images) {
    if (img?.data) {
      parts.push({
        inline_data: { mime_type: img.mimeType || "image/png", data: img.data },
      });
    }
  }

  try {
    // count 枚を最大3並列で生成（同じ指示から複数パターン）
    const tasks = Array.from({ length: count }, () => () => generateImageFromParts(parts, aspect));
    const results = await runPool(tasks, 3);
    res.json({ ok: true, aspect, count, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 自由生成（複数項目）API
// items: [{ prompt, aspect, images:[{data,mimeType}] }, ...]
// 各項目で画像を1枚生成し、結果を配列で返す（最大3並列）。
app.post("/api/freeform-batch", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: "生成項目がありません。" });
  }
  const valid = items.filter(
    (it) => (it?.prompt || "").trim() || (Array.isArray(it?.images) && it.images.length > 0)
  );
  if (valid.length === 0) {
    return res.status(400).json({ error: "テキスト指示または参考画像を入力してください。" });
  }

  try {
    const mallKey = req.body?.mall || "";
    const guide = mallGuidance(mallKey);
    let extras = extrasGuidance({ genre: req.body?.genre, taste: req.body?.taste, target: req.body?.target, notes: req.body?.notes, context: "自由生成" });
    { const yk = yakkiPreventionNote(req.body?.yakkiClass); if (yk) extras += "\n\n" + yk; }
    const styleSpec = (req.body?.styleSpec || "").trim() || await describeStyleImages(req.body?.styleImages);
    const sp = styleParts(req.body?.styleImages, styleSpec);
    const tasks = items.map((it) => async () => {
      const aspect = it?.aspect || "1:1";
      const prompt = (it?.prompt || "").trim();
      const images = Array.isArray(it?.images) ? it.images : [];
      if (!prompt && images.length === 0) throw new Error("入力が空の項目です。");
      const fullPrompt = [sp.instruction, prompt, guide, extras].filter(Boolean).join("\n\n");
      const parts = [];
      if (fullPrompt) parts.push({ text: fullPrompt });
      parts.push(...sp.parts); // スタイル見本
      for (const img of images) {
        if (img?.data) {
          parts.push({ inline_data: { mime_type: img.mimeType || "image/png", data: img.data } });
        }
      }
      const image = await generateImageFromParts(parts, aspect);
      return { image, aspect };
    });

    const raw = await runPool(tasks, 3);
    // runPool は { ok, image } を返すが、ここでは aspect も保持したいので整形
    const results = raw.map((r, i) => {
      if (r.ok && r.image && typeof r.image === "object") {
        return { ok: true, image: r.image.image, aspect: r.image.aspect };
      }
      if (r.ok) return { ok: true, image: r.image, aspect: items[i]?.aspect || "1:1" };
      return { ok: false, error: r.error };
    });
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 数値突合チェック（優先度A：検出・警告のみ） =====

// 全角→半角・空白除去・単位ゆれ吸収などの正規化
function normNum(s) {
  return String(s == null ? "" : s)
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .toLowerCase()
    .replace(/メートル/g, "m")
    .replace(/時間/g, "h")
    .replace(/グラム/g, "g")
    .replace(/[，,]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

// 価格・日付・ポイントなど動的に変わる数字か（捏造判定から除外）
function isDynamicNumber(n) {
  const s = String(n);
  if (/円|％|%|ポイント|pt|ポイント|倍|off|オフ|送料|クーポン|税込|税抜/i.test(s)) return true;
  if (/\d{1,2}[\/／]\d{1,2}/.test(s)) return true; // 日付 6/15 等
  if (/(年|月|日|時|分)/.test(s)) return true;
  if (/^20\d{2}$/.test(normNum(s))) return true; // 西暦
  return false;
}

// 画像から数値・型番・認定・最大級表現＋内容妥当性を構造抽出（gemini-2.5-flash）
async function extractNumbersFromImage(imageB64, ctx = {}) {
  if (!API_KEY) return null;
  const genreLabel = ctx.genreLabel || "指定なし";
  const productName = ctx.productName || "指定なし";
  const prompt = [
    `商品ジャンル：${genreLabel}／商品名：${productName}`,
    "この画像の文字情報を抽出し、さらに内容の妥当性を点検して、JSONのみで返してください。装飾文字・背景の数字も含めます。読めない箇所は推測で補完しないでください。",
    '{"text":"画像内の全テキストを1つの文字列で（見出し・本文・バッジ含む）","numbers":["画像内の数値を単位付きで全て"],"models":["型番・品番"],"certs":["認定名・受賞名・ランキング名"],"superlatives":["最強/日本一/No.1/最高品質/◯冠/◯◯突破 等の最大級表現"],"irrelevant_subjects":["商品と無関係な主要被写体・人物のポーズ・小道具があれば列挙（例：ダンベルを持つ人物）。無ければ空配列"],"garbled_text":["意味をなさない文字列・文字化け・不自然な他言語混入・実在しない単語があれば列挙。無ければ空配列"]}',
    "推測で問題を作らない。明らかなものだけ挙げる。出力はこのJSONオブジェクトのみ。コードフェンスや説明は不要。",
  ].join("\n");
  try {
    const parts = [{ text: prompt }, { inline_data: { mime_type: "image/png", data: imageB64 } }];
    const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const ps = json?.candidates?.[0]?.content?.parts || [];
    let text = ps.map((p) => p.text || "").join("").trim();
    text = text.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s >= 0 && e > s) text = text.slice(s, e + 1);
    const obj = JSON.parse(text);
    return {
      text: typeof obj.text === "string" ? obj.text : "",
      numbers: Array.isArray(obj.numbers) ? obj.numbers.map(String) : [],
      models: Array.isArray(obj.models) ? obj.models.map(String) : [],
      certs: Array.isArray(obj.certs) ? obj.certs.map(String) : [],
      superlatives: Array.isArray(obj.superlatives) ? obj.superlatives.map(String) : [],
      irrelevant_subjects: Array.isArray(obj.irrelevant_subjects) ? obj.irrelevant_subjects.map(String).filter(Boolean) : [],
      garbled_text: Array.isArray(obj.garbled_text) ? obj.garbled_text.map(String).filter(Boolean) : [],
    };
  } catch (_) {
    return null;
  }
}

// 抽出値 vs 確定スペックを照合し findings を返す
function checkNumbers(ex, specs, exclude) {
  const findings = [];
  const exNumbers = ex.numbers || [];
  const exAllNorm = [...exNumbers, ...(ex.models || []), ...(ex.certs || [])].map(normNum);
  const exNumNorm = exNumbers.map(normNum);
  const excl = (exclude || []).map(normNum).filter(Boolean);

  // mismatch/missing: 確定値が画像内に正しく存在するか
  for (const sp of specs || []) {
    if (!sp || !sp.value) continue;
    const v = normNum(sp.value);
    if (!v) continue;
    const numericish = /^[\d]/.test(v);
    const found = numericish
      ? exNumNorm.includes(v)
      : exAllNorm.some((e) => e && (e.includes(v) || v.includes(e)));
    if (!found) {
      findings.push({ type: "mismatch", label: sp.label || "", expected: sp.value, message: `確定値「${sp.label || ""}: ${sp.value}」が画像内に見つからない（誤記・欠落の可能性）` });
    }
  }

  // fabricated: 確定値に無い数字（動的数字・除外は対象外）
  const specNorms = (specs || []).map((s) => normNum(s.value));
  for (const n of exNumbers) {
    const nn = normNum(n);
    if (!nn) continue;
    if (specNorms.includes(nn)) continue;
    if (isDynamicNumber(n)) continue;
    if (excl.some((e) => nn.includes(e))) continue;
    findings.push({ type: "fabricated", found: n, message: `確定値に無い数字: ${n}` });
  }

  // superlative: 最大級表現
  for (const s of ex.superlatives || []) {
    findings.push({ type: "superlative", found: s, message: `根拠・出典の確認が必要（最大級表現）: ${s}` });
  }
  return findings;
}

// 数値突合チェック ＋ 薬機法NG表現チェック（抽出は1回で共通化）
app.post("/api/check-numbers", async (req, res) => {
  const image = req.body?.image;
  const truthSpecs = Array.isArray(req.body?.truthSpecs) ? req.body.truthSpecs : [];
  const exclude = Array.isArray(req.body?.exclude) ? req.body.exclude : [];
  const yakkiClass = req.body?.yakkiClass || "";
  const genreLabel = req.body?.genreLabel || "";
  const productName = req.body?.productName || "";
  if (!image) return res.status(400).json({ error: "対象画像がありません。" });
  try {
    const extracted = await extractNumbersFromImage(image, { genreLabel, productName });
    if (!extracted) {
      return res.json({ ok: true, status: "error", message: "抽出できませんでした（チェック不可）", findings: [], yakki: { status: "error", findings: [] }, content: { status: "error", irrelevant: [], garbled: [] } });
    }
    const findings = checkNumbers(extracted, truthSpecs, exclude);
    // 薬機法は抽出した全テキスト＋各要素を結合して照合
    const fullText = [extracted.text || "", ...(extracted.numbers || []), ...(extracted.certs || []), ...(extracted.superlatives || []), ...(extracted.models || [])].join(" ");
    const yakkiFindings = yakkiClass ? checkYakki(fullText, yakkiClass) : [];
    // 内容妥当性（無関係被写体・意味不明テキスト）
    const irrelevant = extracted.irrelevant_subjects || [];
    const garbled = extracted.garbled_text || [];
    res.json({
      ok: true,
      status: findings.length ? "warn" : "ok",
      extracted,
      findings,
      yakki: { status: yakkiClass ? (yakkiFindings.length ? "warn" : "ok") : "none", findings: yakkiFindings },
      content: { status: irrelevant.length || garbled.length ? "warn" : "ok", irrelevant, garbled },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// スタイル見本画像を解析して「デザイン仕様」テキストを返す（画面で確認・編集用）
app.post("/api/analyze-style", async (req, res) => {
  const styleImages = Array.isArray(req.body?.styleImages) ? req.body.styleImages : [];
  if (styleImages.length === 0) {
    return res.status(400).json({ error: "スタイル見本画像がありません。" });
  }
  try {
    const spec = await describeStyleImages(styleImages);
    res.json({ ok: true, spec });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 利用可能なモール一覧（フロントのセレクト用）
app.get("/api/malls", (req, res) => {
  const list = Object.entries(MALLS).map(([key, m]) => ({
    key,
    label: m.label,
    thumbSize: m.thumbSize,
    pageCount: m.pageSlots.length,
  }));
  res.json({ malls: list });
});

// 商品ページ画像 自動生成 API
// body: { mall, features, images:[{data,mimeType}] }
// モール推奨の構成スロット数ぶん、各スロットの役割に沿って画像を生成する。
app.post("/api/product-page", async (req, res) => {
  const mallKey = req.body?.mall || "";
  const features = req.body?.features || "";
  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  const mall = getMall(mallKey);

  if (!mall) return res.status(400).json({ error: "モールを選択してください。" });
  if (!features.trim() && images.length === 0) {
    return res.status(400).json({ error: "商品の特徴テキストか商品画像を入力してください。" });
  }

  const tpl = req.body?.template || "";
  const slots = mall.pageTemplates && mall.pageTemplates[tpl] ? mall.pageTemplates[tpl].slots : mall.pageSlots;
  const total = slots.length;

  // 参考画像（商品写真）は全スロット共通で参照させる
  const refParts = [];
  for (const img of images) {
    if (img?.data) {
      refParts.push({ inline_data: { mime_type: img.mimeType || "image/png", data: img.data } });
    }
  }
  // スタイル見本画像（テイスト踏襲）— 手動仕様があれば優先、なければ解析
  const styleSpec = (req.body?.styleSpec || "").trim() || await describeStyleImages(req.body?.styleImages);
  const sp = styleParts(req.body?.styleImages, styleSpec);

  // 黒×赤テイストは、赤(権威バナー)を最大3枚に制限してページ全体で一括割り当て
  const isKuroaka = req.body?.taste === "kuroaka";
  const kuroakaGuides = isKuroaka ? assignKuroaka(slots.map((s) => s.role), 3) : null;

  // 薬機法・景表法フラグ（食品・化粧品・サプリ選択時、yakki スロットに注記を自動付与）
  const genreKey = req.body?.genre || "";
  const isRegulated = ["food", "cosme", "supplement"].includes(genreKey);
  const isLifestyle = ["apparel", "interior", "daily"].includes(genreKey);
  const YAKKI_NOTE =
    "【薬機法・景表法 注意】このスロットは効能効果・実感・ビフォーアフター・成分根拠に関わるため表現規制対象。効能効果の断定やビフォーアフターの誤認誘発を避け、化粧品は56効能の範囲内に収めること。";
  const REALMATCH_NOTE =
    "【景表法・実物一致 注意】色・サイズ・質感・素材感は実物と一致させること。色を盛る/シルエットやサイズ感を誇張すると優良誤認・返品クレームの原因になる。実物撮影・実データを基準にする。";
  const UGC_NOTE =
    "【UGC利用 注意】着用/使用写真は本人の許諾済みのもののみ。無断転載は権利侵害。AIでUGC風画像を作る場合も、実在人物と誤認させず、実商品と一致させること。";
  const pageYakkiNote = yakkiPreventionNote(req.body?.yakkiClass);

  try {
    const tasks = slots.map((slot, i) => async () => {
      let extras = extrasGuidance({
        genre: req.body?.genre,
        target: req.body?.target,
        notes: req.body?.notes,
        ...(isKuroaka ? { tasteText: kuroakaGuides[i] } : { taste: req.body?.taste, context: slot.role }),
      });
      if (isRegulated && slot.yakki) extras += "\n\n" + YAKKI_NOTE;
      if (isLifestyle && slot.realmatch) extras += "\n\n" + REALMATCH_NOTE;
      if (isLifestyle && slot.ugc) extras += "\n\n" + UGC_NOTE;
      if (pageYakkiNote) extras += "\n\n" + pageYakkiNote;
      const basePrompt = buildProductPagePrompt(mallKey, slot, features, i, total, extras);
      const prompt = sp.instruction ? `${sp.instruction}\n\n${basePrompt}` : basePrompt;
      const parts = [{ text: prompt }, ...sp.parts, ...refParts];
      const image = await generateImageFromParts(parts, slot.aspect);
      return { image, role: slot.role, aspect: slot.aspect };
    });

    const raw = await runPool(tasks, 3);
    const results = raw.map((r, i) => {
      if (r.ok && r.image && typeof r.image === "object") {
        return { ok: true, image: r.image.image, role: r.image.role, aspect: r.image.aspect };
      }
      return { ok: false, role: slots[i].role, error: r.error };
    });
    res.json({ ok: true, mall: mall.label, count: total, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ③ 1枚ごとの修正 API（既存画像 + 修正指示 → 画像編集）
app.post("/api/refine", async (req, res) => {
  const image = req.body?.image;
  const mimeType = req.body?.mimeType || "image/png";
  const instruction = (req.body?.instruction || "").trim();
  const aspect = req.body?.aspect || "";

  if (!image) return res.status(400).json({ error: "対象画像がありません。" });
  if (!instruction) return res.status(400).json({ error: "修正内容を入力してください。" });

  try {
    const prompt = [
      "次の画像を、以下の指示に従って修正してください。",
      "指示で言及されていない要素（全体の構図・配色・トーン・他のテキスト）はできるだけ維持すること。",
      "",
      `【修正指示】${instruction}`,
    ].join("\n");
    const parts = [{ text: prompt }, { inline_data: { mime_type: mimeType, data: image } }];
    const out = await generateImageFromParts(parts, aspect || undefined);
    res.json({ ok: true, image: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 画像内のテキストを抽出する（pptx の編集可能テキスト用）。
 * 戻り値: [{ text, v(top/middle/bottom), align(left/center/right), size(large/medium/small) }]
 * 失敗時は空配列（ベストエフォート）。
 */
async function extractTextElements(imageB64) {
  if (!API_KEY) return [];
  const prompt = [
    "この画像に表示されている文字をすべて抽出してください。",
    "キャッチコピー・見出し・本文・価格・バッジ・装飾英字ロゴに加え、栄養成分表などの表組みの文字も漏れなく含めること。",
    "各テキスト要素を JSON 配列で返してください。要素の形式:",
    '{"text":"文字内容","x":0.00,"y":0.00,"w":0.00,"h":0.00,"align":"left|center|right","color":"RRGGBB"}',
    "・x,y は要素の左上の位置、w,h は幅・高さ。いずれも画像全体に対する 0〜1 の比率。",
    "・color は文字色の16進6桁（#なし）。",
    "・表組みは行や項目ごとにまとめてよい（セル単位に細かく割らない）。",
    "・表示順に並べる。出力は JSON 配列のみ。コードブロックや説明文は付けないこと。",
  ].join("\n");
  try {
    const body = {
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/png", data: imageB64 } }] }],
    };
    const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    let text = parts.map((p) => p.text || "").join("").trim();
    text = text.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr.filter((e) => e && String(e.text || "").trim()) : [];
  } catch (_) {
    return [];
  }
}

// SVG 用のエスケープ
function svgEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 背景画像 + 抽出テキスト要素から編集可能な SVG 文字列を組み立てる
function buildSvg(W, H, bg, elements) {
  const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
  let texts = "";
  for (const el of elements) {
    const bx = Math.max(0, Math.min(0.99, num(el.x, 0.05))) * W;
    const by = Math.max(0, Math.min(0.99, num(el.y, 0.05))) * H;
    const bw = Math.min(num(el.w, 0.9) * W, W - bx);
    const bh = Math.min(num(el.h, 0.08) * H, H - by);
    const fs = Math.max(12, Math.min(80, Math.round(bh * 0.7)));
    let color = /^#?[0-9A-Fa-f]{6}$/.test(el.color || "") ? el.color : "FFFFFF";
    if (!color.startsWith("#")) color = "#" + color;
    let anchor = "middle";
    let tx = bx + bw / 2;
    if (el.align === "left") { anchor = "start"; tx = bx; }
    else if (el.align === "right") { anchor = "end"; tx = bx + bw; }
    const ty = by + fs;
    const lines = String(el.text || "").split(/\n/);
    const tspans = lines
      .map((ln, i) => `<tspan x="${tx.toFixed(1)}" dy="${i === 0 ? 0 : (fs * 1.2).toFixed(1)}">${svgEscape(ln)}</tspan>`)
      .join("");
    const stroke = color.toUpperCase() === "#FFFFFF" ? "#000000" : "#FFFFFF";
    texts += `  <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif" font-size="${fs}" font-weight="bold" fill="${color}" text-anchor="${anchor}" stroke="${stroke}" stroke-width="${Math.max(1, fs * 0.04).toFixed(1)}" style="paint-order:stroke fill;">${tspans}</text>\n`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image x="0" y="0" width="${W}" height="${H}" xlink:href="data:image/png;base64,${bg}"/>
${texts}</svg>`;
}

// ④' 編集可能 SVG 書き出し API（Illustrator/Figma/Inkscape で文字編集可能）
app.post("/api/export-svg", async (req, res) => {
  const image = req.body?.image;
  const aspect = req.body?.aspect || "1:1";
  const title = req.body?.title || "editable";
  if (!image) return res.status(400).json({ error: "対象画像がありません。" });
  try {
    const [aw, ah] = aspect.split(":").map((n) => parseFloat(n) || 1);
    const W = 1080;
    const H = Math.round(W * (ah / aw));
    const refPrompt = [
      "この参照画像から、後から重ねられた『グラフィックの文字・キャッチコピー・帯・栄養成分表などの表・価格やバッジの文字』だけを取り除いた背景版を作成してください。",
      "ただし、商品そのものに印刷・刻印されている文字やロゴ（ボトルやパッケージのラベル等）は必ず残すこと。",
      "取り除いた箇所は、周囲の背景や素材になじむよう自然に補完すること。",
      "全体の構図・配色・商品の位置・大きさは一切変えないこと。",
    ].join("\n");
    const [elements, bgResult] = await Promise.all([
      extractTextElements(image),
      generateImageFromParts(
        [{ text: refPrompt }, { inline_data: { mime_type: "image/png", data: image } }],
        aspect
      ).catch(() => image),
    ]);
    let els = elements;
    if (!els.length) els = [{ text: "ここに文字を入力", x: 0.05, y: 0.05, w: 0.9, h: 0.08, align: "center" }];
    const svg = buildSvg(W, H, bgResult || image, els);
    const asciiName = (String(title).replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").trim() || "editable") + ".svg";
    const utf8Name = encodeURIComponent(`${title}.svg`);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.end(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ④ 編集可能 pptx 書き出し API
// body: { items: [{ image(base64,生成済み), aspect, texts:[string] }], title }
// 各画像から「文字なし背景版」を生成し、その上に編集可能なテキストボックスを配置した
// PowerPoint を返す（PowerPoint で文字を自由に編集できる）。
app.post("/api/export-pptx", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const title = req.body?.title || "editable";
  if (items.length === 0) return res.status(400).json({ error: "書き出し対象がありません。" });

  try {
    const pptx = new pptxgen();
    pptx.title = title;

    for (const item of items) {
      const aspect = item?.aspect || "1:1";
      const [aw, ah] = aspect.split(":").map((n) => parseFloat(n) || 1);
      // スライド幅10インチ基準で、アスペクト比から高さを算出
      const W = 10;
      const H = +(W * (ah / aw)).toFixed(2);
      const layoutName = `L_${aw}x${ah}`;
      pptx.defineLayout({ name: layoutName, width: W, height: H });
      pptx.layout = layoutName;

      const slide = pptx.addSlide();

      // 元画像から文字を位置つきで抽出（編集可能テキスト用）と、文字なし背景版の生成を並行実行
      let elements = [];
      let bg = item?.image;
      if (item?.image) {
        const refPrompt = [
          "この参照画像から、後から重ねられた『グラフィックの文字・キャッチコピー・帯・栄養成分表などの表・価格やバッジの文字』だけを取り除いた背景版を作成してください。",
          "ただし、商品そのものに印刷・刻印されている文字やロゴ（ボトルやパッケージのラベル等）は必ず残すこと。",
          "取り除いた箇所は、周囲の背景や素材になじむよう自然に補完すること。",
          "全体の構図・配色・商品の位置・大きさは一切変えないこと。",
        ].join("\n");
        const [extracted, bgResult] = await Promise.all([
          extractTextElements(item.image),
          generateImageFromParts(
            [{ text: refPrompt }, { inline_data: { mime_type: "image/png", data: item.image } }],
            aspect
          ).catch(() => item.image), // 背景版生成に失敗したら元画像を使う
        ]);
        elements = extracted;
        bg = bgResult;
      }
      if (bg) {
        slide.addImage({ data: `image/png;base64,${bg}`, x: 0, y: 0, w: W, h: H });
      }

      // 抽出できなければ、渡されたテキスト → プレースホルダーの順でフォールバック
      if (!elements.length && Array.isArray(item?.texts) && item.texts.length) {
        elements = item.texts.map((t, i) => ({ text: t, x: 0.05, y: 0.05 + i * 0.1, w: 0.9, h: 0.09, align: "center" }));
      }
      if (!elements.length) {
        elements = [{ text: "ここに文字を入力", x: 0.05, y: 0.05, w: 0.9, h: 0.1, align: "center" }];
      }

      // 編集可能テキストボックスを抽出した位置(0〜1比率)に配置
      const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
      elements.forEach((el) => {
        const bx = Math.max(0, Math.min(0.97, num(el.x, 0.05))) * W;
        const by = Math.max(0, Math.min(0.97, num(el.y, 0.05))) * H;
        let bw = Math.min(num(el.w, 0.9) * W, W - bx);
        let bh = Math.min(num(el.h, 0.1) * H, H - by);
        if (bw < 0.5) bw = Math.min(0.5, W - bx);
        if (bh < 0.3) bh = Math.min(0.4, H - by);
        const fs = Math.max(10, Math.min(48, Math.round(bh * 72 * 0.6)));
        const color = /^[0-9A-Fa-f]{6}$/.test(el.color || "") ? el.color : "FFFFFF";
        slide.addText(String(el.text || ""), {
          x: +bx.toFixed(2), y: +by.toFixed(2), w: +bw.toFixed(2), h: +bh.toFixed(2),
          fontSize: fs, bold: true, color,
          align: el.align === "left" || el.align === "right" ? el.align : "center",
          valign: "middle", fit: "shrink",
          outline: { size: 0.5, color: color.toUpperCase() === "FFFFFF" ? "000000" : "FFFFFF" },
        });
      });
    }

    const buf = await pptx.write({ outputType: "nodebuffer" });
    // HTTP ヘッダーは ASCII のみ可。日本語ファイル名はブラウザ側(a.download)が付けるため、
    // ヘッダーは ASCII セーフ名 + RFC5987 形式の filename* で渡す。
    const asciiName = (String(title).replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").trim() || "editable") + ".pptx";
    const utf8Name = encodeURIComponent(`${title}.pptx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.end(Buffer.from(buf));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 自由生成画像の一括 Zip ダウンロード
app.post("/api/zip-free", (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: "ダウンロード対象がありません。" });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="generated_images.zip"');
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).end(String(err)));
  archive.pipe(res);
  items.forEach((item, i) => {
    if (item?.data) {
      const prefix = String(i + 1).padStart(2, "0");
      const label = item.name ? `_${String(item.name).replace(/[^\w぀-ヿ一-鿿-]+/g, "")}` : "";
      archive.append(Buffer.from(item.data, "base64"), {
        name: `${prefix}${label || "_generated"}.png`,
      });
    }
  });
  archive.finalize();
});

// 一括 Zip ダウンロード API（フロントから生成済み画像を受け取りまとめる）
app.post("/api/zip", (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: "ダウンロード対象がありません。" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="banners.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).end(String(err)));
  archive.pipe(res);

  items.forEach((item, i) => {
    const name = safeName(item.name, i);
    const banners = Array.isArray(item.banners) ? item.banners : [];
    banners.forEach((b) => {
      if (b?.image) {
        const label = (b.label || b.key || "banner").replace(/[^\w぀-ヿ一-鿿-]+/g, "");
        archive.append(Buffer.from(b.image, "base64"), { name: `${name}_${label}_${b.size || ""}.png` });
      }
    });
  });

  archive.finalize();
});

// ===== 制作途中ページの保存（プロジェクト） =====
// フォルダID は ASCII のみ（URL・OSの取り回しを安全に）。表示名は meta.json に保持。
function safeProjId() {
  return "proj_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}
function dirSizeMB(dir) {
  let total = 0;
  for (const f of fs.readdirSync(dir)) {
    try { total += fs.statSync(path.join(dir, f)).size; } catch (_) {}
  }
  return +(total / 1048576).toFixed(1);
}

// 保存：設定＋画像（PNGファイル）＋meta.json を別フォルダに書き出す
app.post("/api/projects/save", (req, res) => {
  const name = (req.body?.name || "無題").trim() || "無題";
  const tab = req.body?.tab || "";
  const settings = req.body?.settings || {};
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  try {
    const id = safeProjId(name);
    const dir = path.join(PROJECTS_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    const meta = { name, tab, settings, savedAt: new Date().toISOString(), items: [] };
    items.forEach((it, i) => {
      const file = `${String(i + 1).padStart(2, "0")}.png`;
      if (it.image) fs.writeFileSync(path.join(dir, file), Buffer.from(it.image, "base64"));
      meta.items.push({ file, tag: it.tag || "", aspect: it.aspect || "", filename: it.filename || file });
    });
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
    res.json({ ok: true, id, count: items.length, sizeMB: dirSizeMB(dir), dir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 一覧
app.get("/api/projects", (req, res) => {
  try {
    const list = [];
    for (const id of fs.readdirSync(PROJECTS_DIR)) {
      const dir = path.join(PROJECTS_DIR, id);
      let st;
      try { st = fs.statSync(dir); } catch (_) { continue; }
      if (!st.isDirectory()) continue;
      const mp = path.join(dir, "meta.json");
      if (!fs.existsSync(mp)) continue;
      try {
        const m = JSON.parse(fs.readFileSync(mp, "utf8"));
        list.push({ id, name: m.name, tab: m.tab, savedAt: m.savedAt, count: (m.items || []).length, sizeMB: dirSizeMB(dir) });
      } catch (_) {}
    }
    list.sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
    res.json({ ok: true, dir: PROJECTS_DIR, projects: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 読み込み（画像をbase64で返す）
app.get("/api/projects/:id", (req, res) => {
  try {
    const dir = path.join(PROJECTS_DIR, path.basename(req.params.id));
    const mp = path.join(dir, "meta.json");
    if (!fs.existsSync(mp)) return res.status(404).json({ error: "プロジェクトが見つかりません。" });
    const m = JSON.parse(fs.readFileSync(mp, "utf8"));
    const items = (m.items || []).map((it) => {
      let image = "";
      try { image = fs.readFileSync(path.join(dir, it.file)).toString("base64"); } catch (_) {}
      return { tag: it.tag, aspect: it.aspect, filename: it.filename, image };
    });
    res.json({ ok: true, name: m.name, tab: m.tab, settings: m.settings || {}, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 削除
app.delete("/api/projects/:id", (req, res) => {
  try {
    const dir = path.join(PROJECTS_DIR, path.basename(req.params.id));
    fs.rmSync(dir, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(API_KEY) });
});

// 起動時：各モールの商品ページ構成について axis 抜けを警告（advisory）
function checkTemplates() {
  for (const [key, mall] of Object.entries(MALLS)) {
    const templates = mall.pageTemplates
      ? Object.entries(mall.pageTemplates).map(([tk, t]) => [`${key}/${tk}`, t.slots])
      : [[key, mall.pageSlots]];
    for (const [name, slots] of templates) {
      if (!slots.some((s) => s.axis)) continue; // axisタグ未設定の構成はスキップ
      const missing = validateTemplate(slots);
      if (missing.length) console.warn(`[構成チェック] ${name}: 不足軸 -> ${missing.join(", ")}`);
    }
  }
}

// Vercel serverless 環境では listen() 不要（export した app をランタイムが使う）
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`バナー生成ツール起動: http://localhost:${PORT}`);
    console.log(`モデル: ${MODEL} / APIキー: ${API_KEY ? "設定済み" : "未設定"}`);
    checkTemplates();
  });
} else {
  checkTemplates();
}

export default app;
