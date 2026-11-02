import { answerCustomer } from "../../service/assistant.service.js";
import { isFeatureEnabled } from "../../service/aiSettings.service.js";
import { MAX_QUESTION_LENGTH } from "../../config/aiConfig.js";

// Customer sawaal poochta hai -> knowledge base + apne tickets (tools) se jawab.
const ask = async (req, res) => {
    try {
        const question = String(req.body.question || "").trim();
        if (!question) return res.status(400).json({ status: false, msg: "question is required" });
        if (question.length > MAX_QUESTION_LENGTH) return res.status(400).json({ status: false, msg: `question is too large (max ${MAX_QUESTION_LENGTH} characters)` });

        if (!(await isFeatureEnabled("assistant"))) {
            return res.status(200).json({ status: false, msg: "AI assistant is currently turned off. Please create a ticket." });
        }

        const result = await answerCustomer(question, res.customer);
        return res.status(200).json({ status: true, ...result });
    } catch (err) {
        console.log("[AI:assistant] error:", err.message);
        return res.status(500).json({ status: false, msg: "AI service error. Please try again or create a ticket." });
    }
};

export default { ask };
