// netlify/functions/send-to-gas.js
export const handler = async (event, context) => {
    // CORS 対応（OPTIONS）
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: ""
        };
    }

    // POST 以外は拒否
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed"
        };
    }

    try {
        const data = JSON.parse(event.body);

        // ---- Google Apps Script Webhook に転送 ----
        const GAS_URL = "https://script.google.com/macros/s/AKfycbxFPhofgxlz4cCwvhFSKbIjop9MBV8ZtL7tBC_2cQglogfkoBq0oDH6nTTKMIp2dtl9ew/exec";

        const gasRes = await fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const text = await gasRes.text();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ result: "OK", gasResponse: text })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message })
        };
    }
};
