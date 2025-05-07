import { loadJsonFiles, foodsData, diiParams } from './fileLoad.js';
import { generateForm } from './js/generateForm.js';


loadJsonFiles().then(foodNames => {
    console.log("読み込み完了！");
    console.log("食品名:", foodNames);
    console.log("foodsData:", foodsData);
    console.log("diiParams:", diiParams);

    // ここでフォームなどを生成してOK
}).catch(error => {
    console.error("読み込みエラー:", error);
});