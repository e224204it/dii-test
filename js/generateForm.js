import { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive, rice } from "./loadData.js"
import { setResult } from "./results.js"

const container = document.getElementById("food-form")
const foodNames = []

function generateForm(num) {
    let foodsData;
    if(num == 1){
        foodsData = foodsOne;
    }else if(num == 2){
        foodsData = foodsTwo;
    }else if(num == 3){
        foodsData = foodsThree;
    }else if(num == 4){
        foodsData = foodsFour;
    }else{
        foodsData = foodsFive;
    }
    console.log(`Data for form ${num}:`, foodsData);

    foodsData.forEach((food, index) => {
        // 食品名をh3で表示
        const foodTitle = document.createElement('h3');
        foodTitle.textContent = food["食品"];
        container.appendChild(foodTitle);

        // 頻度選択のラジオボタングループの作成
        const frequencyGroup = document.createElement('div');
        frequencyGroup.className = 'frequency-group';
        
        const frequencies = [
            { value: 'daily', label: '毎日' },
            { value: 'week5-6', label: '週5-6' },
            { value: 'week2-4', label: '週2-4' },
            { value: 'week1', label: '週1' },
            { value: 'month1-3', label: '月1-3' },
            { value: 'none', label: '無' }
        ];

    frequencies.forEach(freq => {
            const radioDiv = document.createElement('div');
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `frequency-${food["食品"]}-${index}`;
            radio.id = `${freq.value}-${food["食品"]}-${index}`;
            radio.value = freq.value;

            const label = document.createElement('label');
            label.htmlFor = `${freq.value}-${food["食品"]}-${index}`;
            label.textContent = freq.label;

            radioDiv.appendChild(radio);
            radioDiv.appendChild(label);
            frequencyGroup.appendChild(radioDiv);
        });

        container.appendChild(frequencyGroup);

        // 「ワイン･カクテル」の下に米の選択チェックボックスを表示
        // rice データから表示ラベルを取得（存在する項目は利用）
        const labelText = food["食品"] || '';
        if (labelText.indexOf('ワイン') !== -1 && labelText.indexOf('カクテル') !== -1) {
            const riceGroup = document.createElement('div');
            riceGroup.className = 'rice-group';

            const title = document.createElement('p');
            title.textContent = 'よく食べる米の種類を教えてください：';
            riceGroup.appendChild(title);

            // 白米（胚芽米、強化米を含む） - 固定ラベル
            const whiteDiv = document.createElement('div');
            const whiteCb = document.createElement('input');
            whiteCb.type = 'checkbox';
            whiteCb.id = `rice-hakumai-${index}`;
            whiteCb.name = `rice-${food["食品"]}-${index}`;
            whiteCb.value = '白米';
            const whiteLabel = document.createElement('label');
            whiteLabel.htmlFor = whiteCb.id;
            whiteLabel.textContent = '白米（胚芽米、強化米を含む）';
            whiteDiv.appendChild(whiteCb);
            whiteDiv.appendChild(whiteLabel);
            riceGroup.appendChild(whiteDiv);

            // rice 配列にある項目（麦ご飯, 玄米）を利用してチェックボックスを作成
            rice.forEach(r => {
                const name = r["食品"];
                if (!name) return;
                const div = document.createElement('div');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = `rice-${name}-${index}`;
                cb.name = `rice-${food["食品"]}-${index}`;
                cb.value = name;
                const lab = document.createElement('label');
                lab.htmlFor = cb.id;
                lab.textContent = name;
                div.appendChild(cb);
                div.appendChild(lab);
                riceGroup.appendChild(div);

                // 麦ご飯 or 玄米 が選択されたら results に追加/削除
                if (name === '麦ご飯' || name === '玄米') {
                    // 初期は未選択として 0 を設定しない（計算側で無視される）
                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            // 1 回分を足す（qty=1）
                            setResult(name, 1);
                        } else {
                            // 外すときは 0 を設定して除外
                            setResult(name, 0);
                        }
                    });
                }
            });

            container.appendChild(riceGroup);
        }

        // 一日あたりの摂取量入力フィールドの作成
        const intakeDiv = document.createElement('div');
        intakeDiv.className = 'intake-group';

        const intakeLabel = document.createElement('label');
        intakeLabel.textContent = '一日当たりの摂取量：';
        intakeLabel.htmlFor = `intake-${food["食品"]}-${index}`;

        // 数値入力コントロールのコンテナ
        const inputControlDiv = document.createElement('div');
        inputControlDiv.className = 'input-control';

        // マイナスボタン
        const minusButton = document.createElement('button');
        minusButton.textContent = '−';
        minusButton.className = 'quantity-btn minus';
        minusButton.type = 'button';

        const intakeInput = document.createElement('input');
        intakeInput.type = 'number';
        intakeInput.id = `intake-${food["食品"]}-${index}`;
        intakeInput.name = `intake-${food["食品"]}-${index}`;
        intakeInput.min = '0.5';
        intakeInput.max = '10';
        intakeInput.step = '0.5';
        intakeInput.placeholder = '0.5～10';
        intakeInput.value = '1.0'; // デフォルト値を設定

        // 計算と結果保存の共通関数
        const computeAndSet = () => {
            const foodKey = food["食品"];
            const selected = frequencyGroup.querySelector(`input[name="frequency-${food["食品"]}-${index}"]:checked`);
            const multiplierMap = {
                daily: 1,
                'week5-6': 5.5 / 7,
                'week2-4': 3 / 7,
                week1: 1 / 7,
                'month1-3': 1 / 15,
                none: 0
            };
            let multiplier = 0;
            if (selected) multiplier = multiplierMap[selected.value] ?? 0;

            let intakeVal = parseFloat(intakeInput.value);
            if (isNaN(intakeVal)) intakeVal = 0;

            // 無のときは0、その他は multiplier * intakeVal
            const computed = +(multiplier * intakeVal).toFixed(4);
            setResult(foodKey, computed);
        };

        // プラスボタン
        const plusButton = document.createElement('button');
        plusButton.textContent = '＋';
        plusButton.className = 'quantity-btn plus';
        plusButton.type = 'button';

        // ボタンのクリックイベントハンドラ
        minusButton.addEventListener('click', () => {
            const currentValue = parseFloat(intakeInput.value) || 0.5;
            const newValue = Math.max(0.5, currentValue - 0.5);
            intakeInput.value = newValue.toFixed(1);
            computeAndSet();
        });

        plusButton.addEventListener('click', () => {
            const currentValue = parseFloat(intakeInput.value) || 0.5;
            const newValue = Math.min(10, currentValue + 0.5);
            intakeInput.value = newValue.toFixed(1);
            computeAndSet();
        });

        // 直接入力時のバリデーション
        intakeInput.addEventListener('change', () => {
            let value = parseFloat(intakeInput.value);
            if (isNaN(value)) value = 0.5;
            value = Math.max(0.5, Math.min(10, value));
            intakeInput.value = value.toFixed(1);
            computeAndSet();
        });

        inputControlDiv.appendChild(minusButton);
        inputControlDiv.appendChild(intakeInput);
        inputControlDiv.appendChild(plusButton);

        intakeDiv.appendChild(intakeLabel);
        intakeDiv.appendChild(inputControlDiv);

        // 初期はラベルと入力コントロールを非表示にしておく（ラジオが選ばれたら表示）
        intakeLabel.style.display = 'none';
        inputControlDiv.style.display = 'none';

        // ラジオが選択されたときにラベル＋入力欄を表示/非表示切替
        const radioName = `frequency-${food["食品"]}-${index}`;
        const radios = frequencyGroup.querySelectorAll(`input[name="${radioName}"]`);
        radios.forEach(r => {
            r.addEventListener('change', (e) => {
                if (e.target.value === 'none') {
                    intakeLabel.style.display = 'none';
                    inputControlDiv.style.display = 'none';
                } else {
                    intakeLabel.style.display = 'block';
                    inputControlDiv.style.display = 'flex';
                    // フォーカスを当てる
                    intakeInput.focus();
                }
                // 選択が変わったら計算して保存
                computeAndSet();
            });
        });

        container.appendChild(intakeDiv);

        // 区切り線の追加
        const hr = document.createElement('hr');
        container.appendChild(hr);
    });
}

export default generateForm