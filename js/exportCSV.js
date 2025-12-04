import { loadFoods } from "./loadData.js";

function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

export async function exportToCSV() {
    // localStorageから回答を復元
    const stored = localStorage.getItem("userSelections");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!stored) {
        alert("アンケート結果が見つかりません。");
        return;
    }
    const storedData = JSON.parse(stored);
    const riceTypes = storedData.riceTypes || [];

    // userSelections本体(riceTypes以外)
    const selections = { ...storedData };
    delete selections.riceTypes;

    // 食品の並びを元のjson順に合わせる
    const { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive } = await loadFoods();
    const allFoods = [...foodsOne, ...foodsTwo, ...foodsThree, ...foodsFour, ...foodsFive];
    const orderedFoodNames = allFoods
        .map(r => r["食品"])
        .filter(name => Object.prototype.hasOwnProperty.call(selections, name));
    
    // ヘッダ：食品, 食品, …, 麦ご飯, 玄米
    const header = ["食品", ...orderedFoodNames, "麦ご飯", "玄米"];
    // 2行目：摂取頻度
    const freqRow = ["摂取頻度", ...orderedFoodNames.map(name => selections[name]?.frequency ?? ""),
                    riceTypes.includes("麦ご飯") ? "あり" : "なし",
                    riceTypes.includes("玄米") ? "あり" : "なし"];
    // 3行目：摂取量
    const amtRow = ["摂取量", ...orderedFoodNames.map(name => selections[name]?.amount ?? ""), "", ""];

    // ユーザ情報
    const userInfoRows = [
        ["ニックネーム", userInfo.nickname || ""],
        ["性別", userInfo.gender || ""],
        ["年齢", userInfo.age || ""],
        [""]
    ];

    // CSVの生成
    const rows = [...userInfoRows, header, freqRow, amtRow];
    const csv = "\uFEFF" + rows.map(r => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result_${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

// スプレッドシート
export async function sendToGoogleSheet() {
    const stored = localStorage.getItem("userSelections");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!stored) {
        alert("アンケート結果が見つかりません。");
        return;
    }

    const storedData = JSON.parse(stored);
    const riceTypes = storedData.riceTypes || [];
    const selections = { ...storedData };
    delete selections.riceTypes;

    // 食品ごとのデータ
    const rows = Object.entries(selections).map(([food, data]) => ({
        food,
        frequency: data.frequency,
        amount: data.amount
    }));

    // 米の種類を追加
    riceTypes.forEach(type => {
        rows.push({ food: `米の種類: ${type}`, frequency: "あり", amount: "" });
    });

    // Googleスプレッドシートへ送信
    await fetch("/.netlify/functions/send-to-gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInfo, rows })
    });
    
    alert("Googleスプレッドシートに送信しました！");
}