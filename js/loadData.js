// Promiseを返す関数として定義
export async function loadFoods() {
    const [foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive, rice, diiParam] = await Promise.all([
        fetch("../data/foods_data1.json").then(res => res.json()),
        fetch("../data/foods_data2.json").then(res => res.json()),
        fetch("../data/foods_data3.json").then(res => res.json()),
        fetch("../data/foods_data4.json").then(res => res.json()),
        fetch("../data/foods_data5.json").then(res => res.json()),
        fetch("../data/fortifiedRice.json").then(res => res.json()),
        fetch("../data/dii_param.json").then(res => res.json())
    ]);
    return { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive, rice, diiParam };
}