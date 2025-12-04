document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.querySelector(".start-btn");

    startBtn.addEventListener("click", (e) => {
        const nickname = document.getElementById("nickname").value.trim();
        const age = document.getElementById("age").value.trim();
        const gender = document.getElementById("gender").value;

        if (!nickname || !age || !gender) {
            alert("ニックネーム、年齢、性別をすべて入力してください");
            e.preventDefault();
            return;
        }

        // 保存
        const userInfo = { nickname, age, gender };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
    });
});