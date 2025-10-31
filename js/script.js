import generateForm from "./generateForm.js"
import { getResults } from "./results.js"
import calculateNutrition from "./nutritionMath.js"
import calculateDII from "./diiMath.js"

const TOTAL_FORMS = 5;
let current = 1;

function render() {
    // コンテナをクリアして現在のフォームだけ描画
    const container = document.getElementById('food-form');
    container.innerHTML = '';

    // 進捗表示
    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap';
    // progressWrap centering is handled via CSS (.progress-wrap)
    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = `ページ ${current} / ${TOTAL_FORMS}`;
    const progressBarBg = document.createElement('div');
    progressBarBg.style.background = '#eee';
    progressBarBg.style.height = '10px';
    progressBarBg.style.borderRadius = '6px';
    progressBarBg.style.overflow = 'hidden';
    progressBarBg.style.marginTop = '6px';
    progressBarBg.style.margin = '6px auto 0 auto';
    const progressBar = document.createElement('div');
    const pct = Math.round((current / TOTAL_FORMS) * 100);
    progressBar.style.width = pct + '%';
    progressBar.style.height = '100%';
    progressBar.style.background = '#4caf50';
    progressBarBg.appendChild(progressBar);
    progressWrap.appendChild(progressText);
    progressWrap.appendChild(progressBarBg);
    container.appendChild(progressWrap);

    // generateForm は同じ container を参照して要素を追加するのでそのまま呼ぶ
    generateForm(current);

    // メッセージ表示領域（未入力メッセージなど）
    const message = document.createElement('div');
    message.className = 'form-message';
    message.style.color = 'red';
    message.style.margin = '8px 0';
    container.appendChild(message);

    // コントロール（前へ／次へボタン）を追加
    const controls = document.createElement('div');
    controls.className = 'form-controls';

    if (current > 1) {
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.textContent = '前へ';
        prev.addEventListener('click', () => {
            current = Math.max(1, current - 1);
            render();
        });
        controls.appendChild(prev);
    }

    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = current < TOTAL_FORMS ? '次へ' : '完了';
    next.addEventListener('click', async () => {
        // バリデーション：このページ内の全ての frequency-group にラジオ選択があるか確認
        const groups = container.querySelectorAll('.frequency-group');
        const missing = [];
        groups.forEach(g => {
            const checked = g.querySelector('input[type="radio"]:checked');
            if (!checked) {
                // 対応する食品名(h3)を探す
                let prev = g.previousElementSibling;
                while (prev && prev.tagName !== 'H3') prev = prev.previousElementSibling;
                const name = prev ? prev.textContent : '項目';
                missing.push(name);
            }
        });

        if (missing.length > 0) {
            // メッセージ表示
            if (missing.length === 1) {
                message.textContent = `${missing[0]}が未入力です`;
            } else {
                message.textContent = `${missing.join('、')}が未入力です`;
            }
            // スクロールしてメッセージを見せる
            message.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return; // 先に進まない
        }

        // バリデーションOKならメッセージをクリアして進む/完了処理
        message.textContent = '';

        if (current < TOTAL_FORMS) {
            current++;
            render();
            // ページ遷移時にトップへスクロール
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // 最後の完了処理：結果を栄養計算してJSONでダウンロード
            const items = getResults();
            console.log('Results (items):', items);
            const nutrition = calculateNutrition(items);
            console.log('Nutrition totals:', nutrition);

            // DII を計算
            let dii = {};
            try {
                dii = await calculateDII(nutrition);
                console.log('DII components:', dii);
            } catch (err) {
                console.error('Failed to calculate DII:', err);
            }

            // 結果と栄養合計をまとめてダウンロード（および result.html へ渡して表示）
            const payload = {
                items,
                nutrition,
                dii
            };

            // localStorage に保存して result.html で読み取れるようにする
            try {
                localStorage.setItem('dii_results', JSON.stringify(payload));
            } catch (e) {
                console.warn('localStorage に保存できませんでした:', e);
            }

            // result.html を新しいタブで開く
            try {
                window.open('./result.html', '_blank');
            } catch (e) {
                console.warn('result.html を開けませんでした:', e);
            }

            // ダウンロードせずに result.html を開くだけに変更
            // alert('アンケートが完了しました。結果ページを新しいタブで開きます。');
        }
    });
    controls.appendChild(next);

    container.appendChild(controls);
}

// 初期描画
render();
