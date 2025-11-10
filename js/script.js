import generateForm from "./generateForm.js";
import { getResults } from "./results.js";
import calculateNutrition from "./nutritionMath.js";
import calculateDII from "./diiMath.js";

const TOTAL_FORMS = 5;
let current = 1;

// ✅ 他ファイルでも利用できるように export
export let items = [];

function render() {
  const container = document.getElementById("food-form");
  container.innerHTML = "";

  // 進捗バー
  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";

  const progressText = document.createElement("div");
  progressText.className = "progress-text";
  progressText.textContent = `ページ ${current} / ${TOTAL_FORMS}`;

  const progressBarBg = document.createElement("div");
  progressBarBg.style.cssText = `
    background:#eee;
    height:10px;
    border-radius:6px;
    overflow:hidden;
    margin:6px auto 0 auto;
  `;

  const progressBar = document.createElement("div");
  const pct = Math.round((current / TOTAL_FORMS) * 100);
  progressBar.style.cssText = `
    width:${pct}%;
    height:100%;
    background:#4caf50;
  `;
  progressBarBg.appendChild(progressBar);

  progressWrap.append(progressText, progressBarBg);
  container.appendChild(progressWrap);

  // 現在のフォームを生成
  generateForm(current);

  // メッセージ領域
  const message = document.createElement("div");
  message.className = "form-message";
  message.style.cssText = "color:red;margin:8px 0;";
  container.appendChild(message);

  // コントロール（前へ／次へ）
  const controls = document.createElement("div");
  controls.className = "form-controls";

  if (current > 1) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.textContent = "前へ";
    prev.addEventListener("click", () => {
      current = Math.max(1, current - 1);
      render();
    });
    controls.appendChild(prev);
  }

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = current < TOTAL_FORMS ? "次へ" : "完了";
  next.addEventListener("click", async () => {
    // バリデーション
    const groups = container.querySelectorAll(".frequency-group");
    const missing = [];
    groups.forEach((g) => {
      const checked = g.querySelector("input[type='radio']:checked");
      if (!checked) {
        let prev = g.previousElementSibling;
        while (prev && prev.tagName !== "H3") prev = prev.previousElementSibling;
        const name = prev ? prev.textContent : "項目";
        missing.push(name);
      }
    });

    if (missing.length > 0) {
      message.textContent =
        missing.length === 1
          ? `${missing[0]}が未入力です`
          : `${missing.join("、")}が未入力です`;
      message.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 次ページまたは完了処理
    message.textContent = "";

    if (current < TOTAL_FORMS) {
      current++;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // ✅ 結果の取得
      items = getResults();
      console.log("Results (items):", items);

      // 栄養計算
      const nutrition = calculateNutrition(items);
      console.log("Nutrition totals:", nutrition);

      // DII 計算
      let dii = {};
      try {
        dii = await calculateDII(nutrition);
        console.log("DII components:", dii);
      } catch (err) {
        console.error("Failed to calculate DII:", err);
      }

      // CSV 用のデータを組み立て（JSON 形式）
      try {
        const surveyChoices = JSON.parse(localStorage.getItem('survey_choices') || '{}');
        const labelToMultiplier = {
          '毎日': 1,
          '週5-6': 5.5 / 7,
          '週2-4': 3 / 7,
          '週1': 1 / 7,
          '月1-3': 1 / 15,
          '無': 0
        };

        // Build csvExportData primarily from survey_choices (human-readable labels)
        let csvRows = {};
        try { csvRows = JSON.parse(localStorage.getItem('csv_rows') || '{}'); } catch (e) { csvRows = {}; }

        const names = Array.from(new Set([
          ...Object.keys(JSON.parse(localStorage.getItem('survey_choices') || '{}')),
          ...Object.keys(items || {}),
          ...Object.keys(csvRows || {})
        ]));

        const exportArray = names.map((n) => {
          const label = (surveyChoices[n] || '').trim();
          // 摂取量は csv_rows の摂取量を優先。なければ items と label->multiplier から逆算
          let intake = '';
          if (csvRows[n] && typeof csvRows[n]['摂取量'] !== 'undefined') {
            intake = String(csvRows[n]['摂取量']);
          } else {
            const mult = labelToMultiplier[label] || 0;
            const computed = parseFloat(items[n]) || 0;
            if (mult > 0) intake = (Math.round((computed / mult) * 10) / 10).toFixed(1);
            else if (computed === 0) intake = '0';
            else intake = '';
          }

          return {
            "食品": n,
            "摂取頻度": label,
            "摂取量": intake
          };
        });

        csvExportData = exportArray;
      } catch (e) {
        console.warn('csvExportData の構築に失敗しました:', e);
        csvExportData = { names: [], labels: [], intakes: [] };
      }

      // 保存して結果ページへ
      const payload = { items, nutrition, dii };
      try {
        localStorage.setItem("dii_results", JSON.stringify(payload));
      } catch (e) {
        console.warn("localStorage に保存できませんでした:", e);
      }

      try {
        window.open("./result.html", "_blank");
      } catch (e) {
        console.warn("result.html を開けませんでした:", e);
      }
    }
  });

  controls.appendChild(next);
  container.appendChild(controls);
}

// CSV 出力に使うデータを外部から参照できるように export しておく
// 初期表示時にも確認できるよう、localStorage の 'csv_rows' から配列形式で初期化しておく
export let csvExportData = [];
(() => {
  try {
    const surveyChoices = JSON.parse(localStorage.getItem('survey_choices') || '{}');
    const rows = JSON.parse(localStorage.getItem('csv_rows') || '{}');
    const names = Array.from(new Set([...(Object.keys(surveyChoices || {})), ...(Object.keys(rows || {}))]));
    csvExportData = names.map(n => ({
      "食品": n,
      "摂取頻度": surveyChoices[n] || '',
      "摂取量": (rows[n] && typeof rows[n]['摂取量'] !== 'undefined') ? String(rows[n]['摂取量']) : ''
    }));
  } catch (e) {
    csvExportData = [];
  }
})();

// 初期描画
render();
