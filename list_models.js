require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
console.log("Using key:", key ? key.substring(0, 5) + "..." : "None");

async function list() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.models) {
        console.log("Available Gemini Models:");
        data.models.forEach(m => {
            if (m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(m.name);
            }
        });
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}
list();
