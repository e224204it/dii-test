// import { energy, carbohydrates, protein, lipid, fattyAcids, cholesterol } from "./message";

let foodsData = {};
let diiParams = {};
let riceFoodKey = null;

const freqMap = {
    "毎日": 1, "週5-6": 5.5 / 7, "週2-4": 3 / 7, "週1": 1 / 7, "月1-3": 1 / 15, "無": 0
};

// JSON読み込みとフォーム生成
Promise.all([
    fetch("./data/foods_data.json").then(res => res.json()),
    fetch("./data/dii_param.json").then(res => res.json())
]).then(([foodsJson, diiJson]) => {
    foodsJson.forEach(row => {
        foodsData[row["食品"]] = row;
    });
    diiJson.forEach(row => {
        const key = row["Unnamed: 0"];
        Object.entries(row).forEach(([nutKey, val]) => {
            if (nutKey === "Unnamed: 0") return;
            if (!diiParams[nutKey]) diiParams[nutKey] = {};
            diiParams[nutKey][key] = parseFloat(val);
        });
    });

    const foodNames = [];
    for (const food of Object.keys(foodsData)) {
        foodNames.push(food);
        // foods_data.json 内の表記に合わせて『ご飯』に該当するキーを保持
        if (!riceFoodKey && food.includes("ご飯")) {
            riceFoodKey = food;
        }
        if (food.includes("ワイン･カクテル100ml")) break;
    }

    generateForm(foodNames);
    document.getElementById("form").style.display = "block";
});

window.toggleAmountInput = function (food) {
    const selected = document.querySelector(`input[name="freq_${food}"]:checked`);
    const display = (selected && freqMap[selected.value] > 0) ? "block" : "none";
    document.getElementById(`form_${food}`).style.display = display;
}

let allFoodNames = [];
function generateForm(foodNames) {
    allFoodNames = foodNames;
    const container = document.getElementById("food-form");
    foodNames.forEach(food => {
        const foodId = `form_${food}`;
        const div = document.createElement("div");
        const radios = Object.keys(freqMap).map(f => `
            <label>
                <input type="radio" name="freq_${food}" value="${f}" onchange="toggleAmountInput('${food}')" ${f === "週2-4" ? "checked" : ""}>
                ${f}
            </label>
        `).join("");
        div.innerHTML = `
            <label>${food}</label><br>
            ${radios}<br>
            <div id="${foodId}" style="display:none">
                <input type="number" name="amt_${food}" value="1" min="0.5" max="5" step="0.5"> 一日当たりの摂取量
            </div><br>
        `;
        container.appendChild(div);
        // 初期表示を正しくセット
        toggleAmountInput(food);
    });
}

// ご飯を選んだら強化米アンケート表示
document.addEventListener("change", function () {
    const riceSection = document.getElementById("rice-section");
    let gohan = null;
    if (riceFoodKey) {
        gohan = document.querySelector(`input[name="freq_${riceFoodKey}"]:checked`);
    } else {
        // fallback: check any generated freq_ inputs whose name contains 'ご飯'
        const any = document.querySelectorAll('input[name^="freq_"]');
        any.forEach(el => {
            if (el.name.includes('ご飯') && el.checked) gohan = el;
        });
    }

    if (gohan && freqMap[gohan.value] > 0) {
        riceSection.style.display = "block";
        // ご飯にチェックが入った時点で米のチェックリストを表示
        document.getElementById("rice-options").style.display = "block";
    } else {
        riceSection.style.display = "none";
        document.getElementById("rice-options").style.display = "none";
    }
});

// フォーム送信処理
let nut_total = {};
document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.textContent = "";
    
    // 未選択の食品チェック
    for(const food of allFoodNames){
        const selected = document.querySelector(`input[name="freq_${food}"]:checked`);
        if(!selected){
            errorDiv.textContent = `「${food}」の摂取頻度を選択してください`;
            return;
        }
    }
    const formData = new FormData(e.target);
    const result = {};
    let tmp_rice = [];
    for (let [key, val] of formData.entries()) {
        if (key.startsWith("freq_")) {
            const food = key.replace("freq_", "");
            const freq = freqMap[val];
            const amt = parseFloat(formData.get(`amt_${food}`)) || 0;
            result[food] = freq * amt;
        }
    }
    const riceKeyForResult = riceFoodKey || "ご飯";
    if (result[riceKeyForResult] && result[riceKeyForResult] > 0) {
        const riceUsed = formData.get("rice_used");
        if (riceUsed === "あり") {
            const selected = [...document.querySelectorAll('input[name="rice_choice"]:checked')].map(el => el.value);
            // 白米は特に処理なし。麦ご飯と玄米だけ tmp_rice にマップ
            if (selected.includes("麦ご飯")) tmp_rice.push(1);
            if (selected.includes("玄米")) tmp_rice.push(2);
            // 白米が選択されていても特別な処理は不要
        } else {
            tmp_rice = [0];
        }
    } else {
        tmp_rice = [0];
    }
    for (let food in result) {
        const amount = result[food];
        const data = foodsData[food];
        if (!data) continue;
        for (let nut in data) {
            if (nut === "食品") continue;
            const val = parseFloat(data[nut]?.toString().trim()) || 0;
            nut_total[nut] = (nut_total[nut] || 0) + val * amount;
        }
    }
    const riceMap = { 1: "麦ご飯", 2: "玄米" };
    const riceBaseAmout = result[riceKeyForResult] || 0;
    tmp_rice.forEach(code => {
        const food = riceMap[code];
        const riceNutrient = foodsData[food];
        if (!riceNutrient) return;
        for (let nut in riceNutrient) {
            if (nut === "食品") continue;
            const val = parseFloat(riceNutrient[nut]?.toString().trim()) || 0;
            nut_total[nut] = (nut_total[nut] || 0) + val * riceBaseAmout;
        }
    });

    // 緑茶・紅茶の摂取頻度計算
    let greenTeaFreq = result["緑茶"] || 0;
    let blackTeaFreq = result["紅茶"] || 0;
    let tea_combined = greenTeaFreq * (120 / 50) + blackTeaFreq * (150 / 50);
    // console.log(nut_total);
    // console.log(tea_combined);
    if (tea_combined !== null) {
        const teaKey = "緑茶/紅茶(g) 150ml/3g";
        nut_total[teaKey] = tea_combined;
    }
    showTotalInTable(nut_total, tea_combined);
    document.dispatchEvent(new CustomEvent("DII_READY", { detail: nut_total }));  //DIIスコア計算イベントを発火
    nut_total = {};
});

document.addEventListener("DII_RESULT", e => {
    const { nut_total, diiScores, totalDiiScore } = e.detail;
    showTotalInTable(nut_total, diiScores, totalDiiScore);
    const messageDiv1 = document.getElementById("message1");
    let message = "";
    if(totalDiiScore <= -1.5) message = "抗炎症効果の高い食事ができています。";
    else if(totalDiiScore <= -0.5) message = "抗炎症効果のある食事ができています。";
    else if(totalDiiScore <= 0.5) message = "あなたの食事炎症性は標準的です。抗炎症性効果の高い食品も取り入れてみましょう。";
    else if(totalDiiScore <= 1.5) message = "あなたの食事の炎症性はやや高いです。炎症性の高い項目を見直し、抗炎症効果のある食品を取り入れましょう。";
    else message = "あなたの食事の炎症性は高いです。炎症性の高い項目を見直して、抗炎症効果のある食品に置き換えてみましょう。";
    messageDiv1.textContent = message;
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
    "ヨウ素(μg)"
];
function showTotalInTable(total, diiScores = {}, totalDii = null) {
    const tbody = document.getElementById("result-table").querySelector("tbody");
    tbody.innerHTML = "";
    for (let nut in total) {
        if (excludeKeys.includes(nut)) continue;
        const tr = document.createElement("tr");
        const value = total[nut].toFixed(3);
        const dii = diiScores[nut] !== undefined ? diiScores[nut].toFixed(3) : "-";
        tr.innerHTML = `<td>${nut}</td><td>${value}</td><td>${dii}</td>`;
        tbody.appendChild(tr);
    }
    // 表の上にある専用領域に総合DIIを表示（存在しない場合はクリア）
    const totalDiiDiv = document.getElementById('total-dii');
    if (totalDii !== null && totalDii !== undefined) {
        totalDiiDiv.innerHTML = `<strong>総合DII:</strong> ${totalDii.toFixed(3)}`;
    } else {
        totalDiiDiv.innerHTML = "";
    }
}

export default nut_total;

