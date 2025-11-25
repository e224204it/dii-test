import { userSelections } from "./generateForm.js";
import { loadFoods } from "./loadData.js";

const freqMap = { "毎日": 1, "週5-6": 5.5 / 7, "週2-4": 3 / 7, "週1": 1 / 7, "月1-3": 1 / 15, "無": 0 };

function applyTeaAdjustments(totals, selections) {
    const getFreq = (name) => {
        const f = selections[name]?.frequency;
        return freqMap[f] ?? 0;
    };

    const greenTeaFreq = getFreq("緑茶湯呑1杯");
    const blackTeaFreq = getFreq("紅茶カップ1杯");

    const specialValue = greenTeaFreq * (120/50) + blackTeaFreq * (150/50);
    totals["緑茶/紅茶 150ml/3g"] = specialValue;

    return totals;
}

async function applyRiceAdjustments(totals) {
    try {
        const storedData = JSON.parse(localStorage.getItem("userSelections"));
        const riceTypes = storedData?.riceTypes || [];

        if (riceTypes.length === 0) return totals;

        const fortified = await fetch("./data/fortifiedRice.json").then(res => res.json());

        riceTypes.forEach(type => {
            const match = fortified.find(item => item["食品"] === type);
            if (match) {
                for (const [key, val] of Object.entries(match)) {
                    if (key === "食品") continue;
                    if (!totals[key]) totals[key] = 0;
                    totals[key] += Number(val) || 0;
                }
            }
        });

        console.log("totalsTest:", totals);

        return totals;
    } catch (err) {
        console.error("applyRiceAdjustmentsエラー：", err);
        return totals;
    }
}

export async function calculateNutrition() {
    const { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive } = await loadFoods();
    const allFoods = [...foodsOne, ...foodsTwo, ...foodsThree, ...foodsFour, ...foodsFive];

    const results = [];  //食品ごとの計算結果
    let totals = {};  //栄養素ごとの合計

    for (const [foodName, selection] of Object.entries(userSelections)) {
        const foodData = allFoods.find(item => item["食品"] === foodName);
        if (!foodData) continue;

        const freq = freqMap[selection.frequency] ?? 0;
        const amt = selection.amount;

        const foodResult = { 食品: foodName }

        // 栄養素ごとに計算
        Object.entries(foodData).forEach(([key, value]) => {
            if (key === "食品") return;
            const num = parseFloat(value);
            if (isNaN(num)) return;  //isNaN:非数かどうかの判定

            const intake = Math.round(num * freq * amt * 1000)/1000;  //栄養値*頻度*量
            foodResult[key] = intake;

            // 合計への加算
            if (!totals[key]) totals[key] = 0;
            totals[key] += intake;
        });
        results.push(foodResult);
    }
    totals = await applyRiceAdjustments(totals);
    totals = await applyTeaAdjustments(totals, userSelections);

    Object.keys(totals).forEach(key => {
        totals[key] = Math.round(totals[key] * 1000)/1000;
    });

    console.log("results：", results);
    console.log("totals：", totals);
    return { results, totals };
}
