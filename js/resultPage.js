import { calculateNutrition } from "./nutritionMath.js"
import { exportToCSV, sendToGoogleSheet } from "./exportCSV.js";
import { calculateSufficiencyRate } from "./sufficiencyRate.js";
import { calculateDii } from "./diiMath.js";

// 記録ボタン
document.getElementById("sendToSheet")?.addEventListener("click", async () => {
    await sendToGoogleSheet();
});

// localStorageから回答データを復元
const stored = localStorage.getItem("userSelections");
if (!stored) {
    document.getElementById("results-container").innerHTML = "<p>アンケート結果が見つかりません。</p>";
    throw new Error("userSelections not found");
}
const userSelections = JSON.parse(stored);

// グローバル変数としてnutritionMath.jsで使えるように設定
import { userSelections as sharedSelections } from "./generateForm.js";
Object.assign(sharedSelections, userSelections);

// 計算
(async () => {
    const { totals } = await calculateNutrition();
    const diiResults = await calculateDii(totals);
    if (!diiResults) return;

    // 総合diiの計算
    const totalDii = Object.values(diiResults).reduce((a, b) => a + b, 0);

    // 充足率の計算
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const gender = userInfo.gender === "男性" ? "男性" : "女性";

    const sufficiency = await calculateSufficiencyRate(totals, gender);

    const container = document.getElementById("results-container");
    container.innerHTML = "<h2>栄養素の合計摂取量</h2>";

    // 総合diiの表示
    const totalBox = document.createElement("p");
    totalBox.className = "total-dii-box";
    totalBox.innerHTML = `総合DII：<strong>${totalDii.toFixed(3)}</strong>`;
    container.appendChild(totalBox);

    // 表の生成
    const table = document.createElement("table");
    table.id = "result-table";

    // ヘッダー行
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>栄養素</th>
            <th>総量</th>
            <th>充足率</th>
            <th>DII</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    Object.entries(totals).forEach(([nut, val]) => {
        const label = nut.replace(/\(.*?\)/, "");  //()の除去
        const unit = nut.match(/\((.*?)\)/)?.[1] || "";  //単位の抽出
        const rate = sufficiency[nut] ? sufficiency[nut].toFixed(1) + "%" : "-";
        const dii = diiResults[nut] ? diiResults[nut].toFixed(3) : "-";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${label}</td>
            <td>${val.toFixed(3)}${unit}</td>
            <td>${rate}</td>
            <td>${dii}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // 但し書き
    const note = document.createElement("p");
    note.className = "note-text";
    note.textContent = "※推奨または世界平均摂取量に対する充足率"
    document.body.appendChild(note);
})();

// ダウンロードボタン
const btn = document.getElementById("downloadCsvBtn");
if (btn) {
    btn.addEventListener("click", () => {
        exportToCSV();
    });
}

// test用
const data = JSON.parse(stored);

console.log("食品データ:", data);
console.log("選ばれた米の種類:", data.riceTypes);
