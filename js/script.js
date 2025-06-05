let foodsData = {};
let diiParams = {};

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
        if (food.includes("ワイン・カクテル")) break;
    }

    generateForm(foodNames);
    document.getElementById("form").style.display = "block";
});

window.toggleAmountInput = function (food) {
    const selected = document.querySelector(`input[name="freq_${food}"]:checked`);
    const display = (selected && freqMap[selected.value] > 0) ? "block" : "none";
    document.getElementById(`form_${food}`).style.display = display;
}

function generateForm(foodNames) {
    const container = document.getElementById("food-form");
    foodNames.forEach(food => {
        const foodId = `form_${food}`;
        const div = document.createElement("div");
        const radios = Object.keys(freqMap).map(f => `
            <label><input type="radio" name="freq_${food}" value="${f}" onchange="toggleAmountInput('${food}')">${f}</label>
        `).join("");
        div.innerHTML = `
            <label><strong>${food}</strong></label><br>
            ${radios}<br>
            <div id="${foodId}" style="display:none">
                <input type="number" name="amt_${food}" value="1" min="0" step="0.5"> 一日当たりの摂取量
            </div><br>
        `;
        container.appendChild(div);
    });
}

// ご飯を選んだら強化米アンケート表示
document.addEventListener("change", function () {
    const gohan = document.querySelector('input[name="freq_ご飯"]:checked');
    const riceSection = document.getElementById("rice-section");
    if (gohan && freqMap[gohan.value] > 0) {
        riceSection.style.display = "block";
    } else {
        riceSection.style.display = "none";
        document.getElementById("rice-options").style.display = "none";
    }

    const riceUsed = document.querySelector('input[name="rice_used"]:checked')?.value;
    document.getElementById("rice-options").style.display = riceUsed === "あり" ? "block" : "none";
});

// フォーム送信処理
const nut_total = {};
document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
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
    if (result["ご飯"] && result["ご飯"] > 0) {
        const riceUsed = formData.get("rice_used");
        if (riceUsed === "あり") {
            const selected = [...document.querySelectorAll('input[name="rice_choice"]:checked')].map(el => el.value);
            if (selected.includes("麦ご飯")) tmp_rice.push(1);
            if (selected.includes("玄米")) tmp_rice.push(2);
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
    const riceBaseAmout = result["ご飯"] || 0;
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

});

document.addEventListener("DII_RESULT", e => {
    const { nut_total, diiScores, totalDiiScore } = e.detail;
    showTotalInTable(nut_total, diiScores, totalDiiScore);
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
        tr.innerHTML = `<td>${nut}</td><td>${dii}</td>`;
        tbody.appendChild(tr);
    }
    if (totalDii !== null) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><strong>総合DIIスコア</strong></td><td colspan="2">${totalDii.toFixed(3)}</td>`;
        tbody.appendChild(tr);
    }
}

export default nut_total;
