import { normDist } from "./normDict.js";

let diiParams = {};
fetch("./data/dii_param.json")
    .then(res => res.json())
    .then(data => {
        data.forEach(row => {
            const key = row["Unnamed: 0"];
            Object.entries(row).forEach(([nutKey, val]) => {
                if (nutKey === "Unnamed: 0") return;
                if (!diiParams[nutKey]) diiParams[nutKey] = {};
                diiParams[nutKey][key] = parseFloat(val);
            });
        });
    });

const excludeKeys = [
    "水分(g)",
    "食塩相当量(g)",
    "ナトリウム(mg)",
    "カリウム(mg)",
    "カルシウム(mg)",
    "リン(mg)",
    "ビタミンK(μg)",
    "銅(mg)",
    "ヨウ素(μg)",
]

// フォーム送信後に script.js からイベントを受け取って実行
document.addEventListener("DII_READY", e => {
    const nut_total = e.detail;
    let totalDiiScore = 0;
    const diiScores = {};

    Object.entries(nut_total).forEach(([nutrient, value]) => {
        if (excludeKeys.includes(nutrient)) return;

        const mean = diiParams[nutrient]?.mean;
        const sd = diiParams[nutrient]?.["S.D"];
        const score = diiParams[nutrient]?.score;

        if (mean === undefined || sd === undefined) {
            // console.warn(`DII: ${nutrient} の mean/S.D が見つかりません`);
            return;
        }

        const diiScore = (normDist(value, mean, sd, true) - 0.5) * 2 * score;
        totalDiiScore += diiScore
        // console.log(`${nutrient} のDIIスコア: ${diiScore.toFixed(3)}`);
        diiScores[nutrient] = diiScore;
    });
    // console.log(`総合DIIスコア: ${totalDiiScore.toFixed(3)}`);

    document.dispatchEvent(new CustomEvent("DII_RESULT", {
        detail: {
            nut_total,
            diiScores,
            totalDiiScore
        }
    }));
});
