export function generateForm(foodNames) {
    const container = document.getElementById("food-form");
    foodNames.forEach(food => {
        const div = document.createElement("div");
        const radioButtons = Object.keys(freqMap).map(f => `
            <label style="margin-right: 1em;">
                <input type="radio" name="freq_${food}" value="${f}" ${f === "毎日" ? "checked" : ""}>${f}
            </label>
        `).join("");
        div.innerHTML = `
            <label><strong>${food}</strong></label><br>
            ${radioButtons}<br>
            <input type="number" name="amt_${food}" value="1" min="0.01" step="0.01"><br><br>
        `;
        container.appendChild(div);
    });
}