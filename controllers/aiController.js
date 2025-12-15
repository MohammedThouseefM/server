const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
// Note: Requires GEMINI_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in .env");
    }
    return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
};

// @desc    Enhance post content (tone, grammar, hashtags)
// @route   POST /api/ai/enhance
exports.enhancePost = async (req, res) => {
    const { content, tone, type } = req.body; // type: 'grammar', 'tone', 'hashtags'

    try {
        const model = getModel();
        let prompt = "";

        if (type === 'grammar') {
            prompt = `Fix grammar and spelling for the following text. Return only the corrected text: "${content}"`;
        } else if (type === 'tone') {
            prompt = `Rewrite the following text to have a ${tone || 'professional'} tone. Return only the rewritten text: "${content}"`;
        } else if (type === 'hashtags') {
            prompt = `Generate 5-10 relevant hashtags for the following post content. Return only the hashtags separated by spaces: "${content}"`;
        } else {
            // General enhancement
            prompt = `Enhance the following post content. Improve clarity and engagement. Return only the enhanced text: "${content}"`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ result: text.trim() });
    } catch (err) {
        console.error("AI Error:", err.message);
        res.status(500).json({ msg: err.message.includes("API_KEY") ? "API Key Missing" : "AI Service Error" });
    }
};

// @desc    Generate image caption
// @route   POST /api/ai/caption
exports.generateCaption = async (req, res) => {
    const { imageUrl } = req.body;

    try {
        const model = getModel();

        // Fetch image and convert to proper format for Gemini
        // Note: In a real app, you might handle file uploads differently.
        // For now, we assume a public URL or base64. 
        // Gemini supports receiving image data directly.
        // To keep it simple without extra fetch dependencies on server if possible,
        // we'll fetch the image buffer.

        const imageResp = await fetch(imageUrl);
        const arrayBuffer = await imageResp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const imagePart = {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: imageResp.headers.get("content-type") || "image/jpeg",
            },
        };

        const prompt = "Describe this image for a social media post caption. Keep it engaging and concise.";
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ result: text.trim() });
    } catch (err) {
        console.error("AI Error:", err.message);
        res.status(500).json({ msg: "Failed to generate caption" });
    }
};

// @desc    Translate text
// @route   POST /api/ai/translate
exports.translateText = async (req, res) => {
    const { content, targetLang } = req.body;

    try {
        const model = getModel();
        const prompt = `Translate the following text to ${targetLang || 'English'}. Return only the translated text: "${content}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ result: text.trim() });
    } catch (err) {
        console.error("AI Error:", err.message);
        res.status(500).json({ msg: "AI Service Error" });
    }
};

// @desc    Suggest smart replies
// @route   POST /api/ai/replies
exports.suggestReplies = async (req, res) => {
    const { history } = req.body; // Array of last few messages: [{sender: 'Me'|'Them', content: '...'}]

    try {
        const model = getModel();
        // Format history for context
        const conversation = history.map(msg => `${msg.sender}: ${msg.content}`).join('\n');

        const prompt = `Based on the following conversation, suggest 3 short, relevant, and polite responses for 'Me'. Return ONLY the responses separated by '|'.
        
Conversation:
${conversation}

Responses:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Split by | and clean up
        const replies = text.split('|').map(r => r.trim()).filter(r => r.length > 0).slice(0, 3);

        res.json({ result: replies });
    } catch (err) {
        console.error("AI Error:", err.message);
        res.status(500).json({ msg: "AI Service Error" });
    }
};

// @desc    Summarize chat conversation
// @route   POST /api/ai/summary
exports.summarizeChat = async (req, res) => {
    const { history } = req.body;

    try {
        const model = getModel();
        const conversation = history.map(msg => `${msg.sender}: ${msg.content}`).join('\n');

        const prompt = `Summarize the following chat conversation in 3-4 bullet points. Highlight key decisions or topics.
        
Conversation:
${conversation}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ result: text.trim() });
    } catch (err) {
        console.error("AI Error:", err.message);
        res.status(500).json({ msg: "AI Service Error" });
    }
};

// @desc    Analyze message tone
// @route   POST /api/ai/tone
exports.analyzeTone = async (req, res) => {
    const { content } = req.body;

    try {
        const model = getModel();
        const prompt = `Analyze the tone of this message: "${content}". 
        Return JSON format with two keys: 
        1. "tone" (e.g., Neutral, Friendly, Angry, Professional)
        2. "risk" (boolean: true if tone is aggressive/toxic, false otherwise).
        Return ONLY valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Sanitize JSON output (Gemini sometimes adds markdown blocks)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(text);
        res.json(analysis);
    } catch (err) {
        console.error("AI Error:", err.message);
        // Fallback safe response if JSON parse fails
        res.json({ tone: "Neutral", risk: false });
    }
};
