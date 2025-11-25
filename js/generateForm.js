import { loadFoods } from "./loadData.js";

const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
console.log("ユーザー情報: ", userInfo);

export const userSelections = {};
const freqMap = { "毎日": 1, "週5-6": 5.5 / 7, "週2-4": 3 / 7, "週1": 1 / 7, "月1-3": 1 / 15, "無": 0 };

// ラジオボタンの選択で表示/非表示
window.toggleAmountInput = function (food) {
    const selected = document.querySelector(`input[name="freq_${food}"]:checked`);
    const display = (selected && freqMap[selected.value] > 0) ? "block" : "none";
    document.getElementById(`form_${food}`).style.display = display;
};

// ±ボタン
window.changeAmount = function (food, delta) {
    const input = document.getElementById(`amt_${food}`);
    let value = parseFloat(input.value) + delta;
    // 範囲の設定
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    if (value < min) value = min;
    if (value > max) value = max;

    input.value = value.toFixed(1);
};

// 表示中フォームの選択値をすべて保存
export function saveCurrentPageSelections() {
    const allInputs = document.querySelectorAll("[id^='amt_']");
    allInputs.forEach(input => {
        const food = input.id.replace("amt_", "");
        const freqEl = document.querySelector(`input[name="freq_${food}"]:checked`);
        if (!freqEl) return;

        const freqValue = freqEl.value;
        const amountValue = (freqValue === "無") ? 0 : parseFloat(input.value);

        userSelections[food] = {
            frequency: freqValue,
            amount: amountValue
        };
    });
}

export async function generateForm(pageNum) {
    const { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive } = await loadFoods();

    const datasets = [foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive];
    const foodsJson = datasets[pageNum - 1];
    const container = document.getElementById("food-form");

    // JSONの各行をオブジェクトに変換して格納
    foodsJson.forEach(row => {
        const foodName = row["食品"];
        const { 食品, ...rest } = row;  //"食品"キーの除外
        
        // 保存済みデータを復元
        const saved = userSelections[foodName] || { frequency: "週2-4", amount: 1.0 };

        const div = document.createElement("div");
        const radios = `
            <div class="radio-group">
                ${["毎日", "週5-6", "週2-4" ,"週1", "月1-3", "無"].map(f => `
                    <label> <!-- これでボタンと文字の間をクリックしても反応する -->
                        <input type="radio" name="freq_${foodName}" value="${f}" ${saved.frequency === f ? "checked" : ""}>
                        ${f}
                    </label>
                `).join("")}
            </div>
        `;
        div.innerHTML = `
            <h3>${foodName}</h3>
            ${radios}
            <div id="form_${foodName}">
                一日当たりの摂取量：
                <button type="button" onclick="changeAmount('${foodName}', -0.5)">ー</button>
                <input type="number" id="amt_${foodName}" name="amt_${foodName}" value="${saved.amount}" min="0" max="5.0" step="0.5">
                <button type="button" onclick="changeAmount('${foodName}', 0.5)">＋</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// riceTypeSelections に選ばれた米の種類を保存
export function saveRiceSelections(selectedRiceArray) {
    localStorage.setItem("selectedRiceTypes", JSON.stringify(selectedRiceArray));
}

export let riceTypeSelections = [];
