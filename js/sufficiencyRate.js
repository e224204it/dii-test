// sufficiencyRate.js
export async function calculateSufficiencyRate(totals, gender) {
    const avg = await fetch("./data/average.json").then(res => res.json());

    // 男性 or 女性 のレコード取得
    const base = avg.find(v => v["性別"] === gender);
    if (!base) return {};

    const rates = {};

    for (const [nut, value] of Object.entries(totals)) {
        const cleanNut = nut.replace(/\(.*?\)/, "");
        if (cleanNut in base && base[cleanNut] > 0) {
            rates[nut] = (value / base[cleanNut]) * 100;
        }
    }

    return rates;   // 例： { エネルギー: 82.4, たんぱく質: 105.3, ... }
}