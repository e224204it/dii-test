const freqMap = {
    "毎日": 1,
    "週5-6": 5.5 / 7,
    "週2-4": 3 / 7,
    "週1": 1 / 7,
    "月1-3": 1 / 15,
    "無": 0
};

let foodsData = {};
let diiParams = {};

Promise.all([
    fetch("./data/foods_data.json").then(res => res.json()),
    fetch("./data/dii_param.json").then(res => res.json())
]).then(([foodsJson, diiJson]) => {
    // 食品データ整形
    foodsJson.forEach(row => {
        const name = row["食品"];
        foodsData[name] = row;
    });

    // DIIパラメータ整形
    diiJson.forEach(row => {
        const key = row["Unnamed: 0"];
        Object.entries(row).forEach(([nutrient, val]) => {
            if (nutrient === "Unnamed: 0") return;
            if (!diiParams[nutrient]) diiParams[nutrient] = {};
            diiParams[nutrient][key] = parseFloat(val);
        });
    });

    const foodNames = [];
    for (const food of Object.keys(foodsData)) {
        foodNames.push(food);
        if (food.includes("玄米")) break;
    }
    generateForm(foodNames);
    document.getElementById("form").style.display = "block";
});

// console.log(foodsData);
// console.log(diiParams);

function generateForm(foodNames) {
    const container = document.getElementById("food-form");
    foodNames.forEach(food => {
        const div = document.createElement("div");
        div.innerHTML = `
        <label><strong>${food}</strong></label><br>
        <select name="freq_${food}">
          ${Object.keys(freqMap).map(f => `<option value="${f}">${f}</option>`).join("")}
        </select>
        <input type="number" name="amt_${food}" value="1" min="0.1" step="0.1"><br><br>
      `;
        container.appendChild(div);
    });
}

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = {};

    for (let [key, value] of formData.entries()) {
        if (key.startsWith("freq_")) {
            const food = key.replace("freq_", "");
            const freq = freqMap[value];
            const amt = parseFloat(formData.get(`amt_${food}`)) || 0;
            result[food] = freq * amt;
        }
    }

    // 栄養素合計
    const total = {};
    for (let food in result) {
        const multiplier = result[food];
        const nutrients = foodsData[food];
        if (!nutrients) continue;
        for (let nut in nutrients) {
            if (nut === "食品") continue;
            const val = parseFloat(nutrients[nut]) || 0;
            total[nut] = (total[nut] || 0) + val * multiplier;
        }
    }
    // console.log(total);

    // DIIスコア計算
    let totalScore = 0;
    for (let nut in total) {
        const params = diiParams[nut];
        if (!params) continue;
        const z = (total[nut] - params["mean"]) / params["S.D"];
        const score = ((0.5 * (1 + Math.tanh(z))) - 0.5) * 2 * params["score"];
        totalScore += score;
    }

    // 結果表示
    const rows = Object.entries(total).map(([nut, val]) => `<tr><td>${nut}</td><td>${val.toFixed(2)}</td></tr>`).join("");
    document.getElementById("result").innerHTML = `
        <h3>摂取栄養素</h3>
        <table><tr><th>栄養素</th><th>量</th></tr>${rows}</table>
    `;
    // <p><strong>DIIスコア: ${totalScore.toFixed(2)}</strong></p>
});
