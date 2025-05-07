// fileLoad.js
export let foodsData = {};
export let diiParams = {};

export function loadJsonFiles() {
    return Promise.all([
        fetch("./data/foods_data.json").then(res => res.json()),
        fetch("./data/dii_param.json").then(res => res.json()),
    ]).then(([foodsJson, diiJson]) => {
        // 食品データの整形
        foodsJson.forEach(row => {
            const name = row["食品"];
            foodsData[name] = row;
        });

        // DIIパラメータの整形
        diiJson.forEach(row => {
            const key = row["Unnamed: 0"];
            Object.entries(row).forEach(([nutKey, val]) => {
                if (!diiParams[nutKey]) diiParams[nutKey] = {};
                diiParams[nutKey][key] = parseFloat(val);
            });
        });

        // 成功時には食品名のリストを返す（任意）
        const foodNames = [];
        for (const food of Object.keys(foodsData)) {
            foodNames.push(food);
            if (food.includes("玄米")) break;
        }
        return foodNames;
    });
}