async function loadJsonData(path) {
    const response = await fetch(path);
    return await response.json();
}

const foodsOne = await loadJsonData("./data/foods_data1.json");
const foodsTwo = await loadJsonData("./data/foods_data2.json");
const foodsThree = await loadJsonData("./data/foods_data3.json");
const foodsFour = await loadJsonData("./data/foods_data4.json");
const foodsFive = await loadJsonData("./data/foods_data5.json");
const rice = await loadJsonData("./data/fortifiedRice.json");

export { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive, rice }
