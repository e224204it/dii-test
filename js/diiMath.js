import { normDist } from "./normDist.js";

export async function calculateDii(totals) {
    try {
        const diiParams = await fetch("../data/dii_param.json").then(res => res.json());

        const meanRow = diiParams.find(r => r["Unnamed: 0"] === "mean");
        const sdRow = diiParams.find(r => r["Unnamed: 0"] === "S.D");
        const scoreRow = diiParams.find(r => r["Unnamed: 0"] === "score");

        if (!meanRow || !sdRow || !scoreRow) {
            console.error("dii_param.jsonの読み込みに失敗");
            return null;
        }

        const diiResults = {};

        Object.entries(totals).forEach(([nutrient, value]) => {
            // if (!(nutrient in meanRow)) return;

            const mean = parseFloat(meanRow[nutrient]);
            const sd = parseFloat(sdRow[nutrient]);
            const score = parseFloat(scoreRow[nutrient]);

            if (isNaN(mean) || isNaN(sd) || isNaN(score) || sd === 0) return;

            const zScore = normDist(value, mean, sd);
            const centered = (zScore - 0.5) * 2;

            diiResults[nutrient] = centered * score;
        });

        console.log("dii計算結果：", diiResults);
        return diiResults;
    } catch (err) {
        console.error("DIIデータ読み込みエラー", err);
        return {};
    }
}