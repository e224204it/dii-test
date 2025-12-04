import { generateForm, saveCurrentPageSelections, userSelections } from "./generateForm.js";

let currentPage = 1;
const totalPages = 5;
let riceTypeSelections = [];

// 進捗バー
function updateProgress() {
    const pageInfo = document.getElementById("page-info");
    const progressBar = document.getElementById(".progress");
    if (pageInfo) pageInfo.textContent = `ページ ${currentPage} / ${totalPages}`;
    if (progressBar) progressBar.style.width = `${(currentPage / totalPages) * 100}%`;
}

// ボタン表示の制御
function updateButtons() {
    document.getElementById("prevBtn").disabled = (currentPage === 1);  //currentPage=1のとき無効
    document.getElementById("nextBtn").style.display = (currentPage === totalPages) ? "none" : "inline-block";
    document.getElementById("finishBtn").style.display = (currentPage === totalPages) ? "inline-block" : "none";
}

// ページ表示の処理
async function showPage(page) {
    const formContainer = document.getElementById("food-form");
    formContainer.innerHTML = "";  //前のページ内容を消す
    await generateForm(page);  //指定ページのフォーム生成

    if (page === totalPages) {
        // 部分一致で探す
        const riceKey = Object.keys(userSelections).find(k => k.includes("ご飯・もち茶碗軽く1杯"));
        const riceData = raceKey ? userSelections[riceKey] : null;
        if (riceData && riceData.frequency !== "無") {
            addRiceTypeQuestion(formContainer);
        }
    }

    updateButtons();
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });  //スクロール
}

function addRiceTypeQuestion(container) {
    const div = document.createElement("div");
    div.innerHTML = `
        <h3>よく食べる米の種類を教えてください。</h3>
        <label><input type="checkbox" name="riceType" value="白米">白米(胚芽米、強化米を含む)</label><br>
        <label><input type="checkbox" name="riceType" value="麦ご飯">麦ご飯</label><br>
        <label><input type="checkbox" name="riceType" value="玄米">玄米</label>
    `;
    container.appendChild(div);

    // 米のチェック変更時に保存
    const checkboxes = div.querySelectorAll("input[name='riceType']");
    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            riceTypeSelections = Array.from(checkboxes)
                .filter(c => c.checked)
                .map(c => c.value);
            console.log("選択中の米の種類：", riceTypeSelections);
        });
    });
}

// 次へボタン
document.getElementById("nextBtn").addEventListener("click", async () => {
    saveCurrentPageSelections();  //ページ切り替え前に保存
    if (currentPage < totalPages) {
        currentPage ++;
        await showPage(currentPage);
    }
});

// 前へボタン
document.getElementById("prevBtn").addEventListener("click", async () => {
    saveCurrentPageSelections();  //ページ切り替え前に保存
    if (currentPage > 1) {
        currentPage --;
        await showPage(currentPage);
    }
});

// 完了ボタン
document.getElementById("finishBtn").addEventListener("click", async () => {
    saveCurrentPageSelections();  //ページ切り替え前に保存
    const data = { ...userSelections, riceTypes: riceTypeSelections };  // コメの種類も保存して一緒に渡す
    localStorage.setItem("userSelections", JSON.stringify(data));
    window.open("result.html", "_blank");
});

showPage(currentPage);  //初期ページの表示