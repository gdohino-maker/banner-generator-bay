// 薬機法・景表法 NG表現チェック用 ルール辞書とヘルパー
// ※機械的な一次スクリーニング。最終可否は薬事専門家・保健所の確認が前提。

const yakkihoRules = {
  // 全分類共通（楽天市場全体の禁止事項）
  common: {
    banned: [
      { match: ["ビフォーアフター", "before", "after", "使用前", "使用後", "BEFORE", "AFTER"], reason: "楽天はビフォーアフター表現を全面禁止", severity: "high" },
      { match: ["医師", "専門家推奨", "美容師", "理容師", "医療関係者", "ドクター", "皮膚科医"], reason: "医薬関係者の推薦は事実でも禁止", severity: "high" },
      { match: ["かつてない", "今までにない", "他社比較", "一般的な競合", "当店vs", "他社製品", "従来品では"], reason: "他社比較・漠然比較は禁止（自社従来品比較＋製品名明示のみ可）", severity: "high" },
      { match: ["臨床データ", "ヒト試験", "実証データ", "エビデンスグラフ"], reason: "臨床・ヒト試験データの掲載は効能効果の保証になり不可", severity: "high" },
    ],
  },
  cosmetics: {
    label: "化粧品",
    ng: ["シワ", "たるみ", "くすみ", "薄毛", "抜け毛", "ニキビ", "白髪", "美白", "治す", "予防", "改善", "除去", "抗菌", "殺菌", "細胞", "真皮", "アンチエイジング"],
    alt: { "シワ改善": "エイジングケア / ハリ・ツヤケア", "美白": "ブライトニング / 透明感ケア", "抗菌": "清潔ケア / 衛生ケア", "薄毛": "スカルプケア / 頭皮ケア", "ニキビ": "肌トラブルケア" },
    note: "56効能の範囲内。浸透表現は角質層まで（真皮・細胞はNG）",
  },
  quasi_drug: {
    label: "医薬部外品（薬用化粧品）",
    ng: ["治す", "促進", "直接働きかける", "根本から", "分泌促進", "再生", "発毛"],
    alt: { "発毛": "育毛・養毛（※承認効能内）", "分泌促進": "（承認効能の表現に置換）" },
    note: "個別承認された効能のみ標榜可。医薬品的表現NG。育毛剤は『育毛・薄毛/脱毛の予防・養毛・ハリコシ』等の承認範囲で",
  },
  health_food: {
    label: "健康食品・サプリ",
    ng: ["効く", "効果", "治る", "改善", "予防", "痩せる", "燃焼", "血糖値", "血圧", "免疫", "関節の", "目の", "肝臓の"],
    alt: { "効果": "栄養補給 / 健康維持 / 美容", "改善": "習慣・気になる方に", "予防": "健康維持" },
    note: "機能性表示食品でない限り効能訴求NG。身体の一部の構成成分表現はNG（『人間の構成成分』はOK、『関節の構成成分』はNG）",
  },
  goods: {
    label: "雑貨",
    ng: ["効果", "効く", "抗菌", "殺菌", "安眠", "ストレス解消", "腰痛", "肩こり", "冷え性", "不眠", "リラックス効果"],
    alt: { "抗菌": "クリーン / フレッシュ", "効果": "特徴 / 魅力", "安眠": "おやすみ前のひととき", "リラックス効果": "リラックス / 快適" },
    note: "身体への効果・効能はNG。香りや雰囲気を楽しむ範囲はOK。過剰に削らない",
  },
};

function normTxt(s) {
  return String(s || "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

// 画像内テキストを分類ルールと照合し findings を返す
function checkYakki(text, klass) {
  const t = normTxt(text);
  if (!t) return [];
  const findings = [];

  // 共通 banned
  for (const rule of yakkihoRules.common.banned) {
    const hit = rule.match.find((m) => t.includes(normTxt(m)));
    if (hit) findings.push({ category: "共通禁止", term: hit, reason: rule.reason, severity: rule.severity, alt: "" });
  }

  // 選択分類の ng
  const c = yakkihoRules[klass];
  if (c && Array.isArray(c.ng)) {
    for (const ng of c.ng) {
      if (t.includes(normTxt(ng))) {
        let alt = "";
        if (c.alt) {
          alt = c.alt[ng] || "";
          if (!alt) {
            const e = Object.entries(c.alt).find(([k]) => ng.includes(k) || k.includes(ng));
            if (e) alt = e[1];
          }
        }
        findings.push({ category: c.label, term: ng, reason: c.note || "分類のNG表現", severity: "high", alt });
      }
    }
  }
  return findings;
}

// 分類選択時に役割文へ自動付加する予防ガードレール
function yakkiPreventionNote(klass) {
  switch (klass) {
    case "quasi_drug":
      return "【薬機法ガード（医薬部外品）】次の表現を使わない：ビフォーアフター／医師・専門家の推薦／臨床・実証データやグラフ／他社比較／『治す・促進・直接働きかける・根本から・発毛』等の医薬品的表現。承認効能（育毛・脱毛の予防・養毛・ハリコシ等）の範囲で表現する。";
    case "goods":
      return "【薬機法ガード（雑貨）】次の表現を使わない：効果・効く・抗菌・殺菌・安眠・ストレス解消・腰痛/肩こり/冷え/不眠等の身体効果／ビフォーアフター／他社比較。香りを楽しむ・リラックス・空間演出の範囲で表現する。";
    case "cosmetics":
      return "【薬機法ガード（化粧品）】56効能を超える表現・悩み直接ワード（シワ/くすみ/薄毛等）・真皮/細胞への浸透表現・他社比較・医薬関係者推薦を使わない。";
    case "health_food":
      return "【薬機法ガード（健康食品）】効く/効果/治る/改善/予防/痩せる等を使わない。栄養補給・健康維持・美容の範囲で表現し、身体の一部の構成成分表現はしない。";
    default:
      return "";
  }
}


module.exports = { yakkihoRules, checkYakki, yakkiPreventionNote };
