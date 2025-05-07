let foodsData = {};
let diiParams = {};

Promise.all([
    fetch("./data/foods_data.json").then(res => res.json()),
    fetch("./data/dii_param.json").then(res => res.json()),
]).then(([foodsJson, diiJson]) => {
    // 食品データ整形
    foodsJson.forEach(row => {
        foodsData[row["食品"]] = row;
    });

    // DII整形（必要なら）
    diiJson.forEach(row => {
        const key = row["Unnamed: 0"];
        Object.entries(row).forEach(([nutKey, val]) => {
            if (!diiParams[nutKey]) diiParams[nutKey] = {};
            diiParams[nutKey][key] = parseFloat(val);
        });
    });

    // フォーム生成
    const foodNames = Object.keys(foodsData);
    generateForm(foodNames);
    document.getElementById("form").style.display = "block";
}).catch(error => {
    console.log("読み込みエラー", error);
});

const freqMap = {
    "毎日": 1,
    "週5-6": 5.5 / 7,
    "週2-4": 3 / 7,
    "週1": 1 / 7,
    "月1-3": 1 / 15,
    "無": 0
};

function generateForm(foodNames) {
    const container = document.getElementById("food-form");
    foodNames.forEach(food => {
        const div = document.createElement("div");
        const radioButtons = Object.keys(freqMap).map(f => `
            <label><input type="radio" name="freq_${food}" value="${f}" ${f === "毎日" ? "checked" : ""}>${f}</label>
        `).join("");
        div.innerHTML = `
            <label><strong>${food}</strong></label><br>
            ${radioButtons}<br>
            <input type="number" name="amt_${food}" value="0" min="0" step="0.01"> 一日当たりの摂取量<br><br>
        `;
        container.appendChild(div);
    });
}

// 「あり/なし」による表示切り替え
document.querySelectorAll('input[name="rice_used"]').forEach(radio => {
    radio.addEventListener("change", function () {
        const riceOptions = document.getElementById("rice-options");
        riceOptions.style.display = this.value === "あり" ? "block" : "none";
    });
});

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // === 1. tmp_riceの判定 ===
    let tmp_rice = [];
    const riceUsed = formData.get("rice_used");
    if (riceUsed === "あり") {
        const riceChoices = [...document.querySelectorAll('input[name="rice_choice"]:checked')].map(el => el.value);
        if (riceChoices.includes("麦ご飯")) tmp_rice.push(1), console.log("麦の選択");
        if (riceChoices.includes("玄米")) tmp_rice.push(2), console.log("玄米の選択");
    } else {
        tmp_rice = [0];
    }

    // === 2. 通常食品の摂取計算 ===
    const result = {};
    for (let [key, value] of formData.entries()) {
        if (key.startsWith("freq_")) {
            const food = key.replace("freq_", "");
            const freq = freqMap[value];
            const amt = parseFloat(formData.get(`amt_${food}`)) || 0;
            result[food] = freq * amt;
        }
    }

    const total = {};
    for (let food in result) {
        const total_intake = result[food];
        const nutrient_content = foodsData[food];
        if (!nutrient_content) continue;

        for (let nut in nutrient_content) {
            if (nut === "食品") continue;
            const val = parseFloat(nutrient_content[nut]) || 0;
            total[nut] = (total[nut] || 0) + val * total_intake;
        }
    }

    // === 3. tmp_riceによる栄養加算（1単位を仮定） ===
    const riceFoodMap = {
        1: "麦ご飯", // foodsDataに存在する名前と一致
        2: "玄米"
    };
    tmp_rice.forEach(riceCode => {
        const riceName = riceFoodMap[riceCode];
        const riceNutrient = foodsData[riceName];
        if (!riceNutrient) return;

        const intakeAmount = 1;  // 1単位仮定（変更可）
        for (let nut in riceNutrient) {
            if (nut === "食品") continue;
            const val = parseFloat(riceNutrient[nut]) || 0;
            total[nut] = (total[nut] || 0) + val * intakeAmount;
        }
    });

    // === 4. CSV変換 + EmailJS送信 ===
    // const csv = convertTotalToCSV(total);
    // downloadCSV(csv, "nutrition_result.csv");
    showTotalInTable(total);
});

function convertTotalToCSV(total) {
    let csv = "栄養素,量\n";
    for (let nut in total) {
        csv += `${nut},${total[nut].toFixed(8)}\n`;  //toFixedで計算精度を調節
    }
    return csv;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showTotalInTable(total) {
    const tbody = document.getElementById("result-table").querySelector("tbody");
    tbody.innerHTML = "";

    for(let nut in total){
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nut}</td>
            <td>${total[nut].toFixed(8)}</td>  <!-- 上に同じく -->
        `;
        tbody.appendChild(tr);
    }
}