require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const key = process.env.GEMINI_API_KEY;
console.log("Key found: " + (key ? "Yes" : "No"));

const genAI = new GoogleGenerativeAI(key);

async function listModels() {
    try {
        // Unfortunately standard SDK doesn't have listModels on the main instance easily? 
        // No, it's not exposed directly on GoogleGenerativeAI class in older versions, 
        // but let's try a known working model: gemini-pro.

        console.log("Testing gemini-1.5-flash-001...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash-001: " + (await result.response).text());
        process.exit(0);
    } catch (err) {
        console.error("gemini-1.5-flash-001 failed: " + err.message);

        try {
            console.log("Testing gemini-pro...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Test");
            console.log("Success with gemini-pro: " + (await result2.response).text());
            process.exit(0);
        } catch (err2) {
            console.error("gemini-pro failed: " + err2.message);
        }
    }
}

listModels();
