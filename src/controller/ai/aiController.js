import { generateText } from "../../service/llm.service.js";
import { classifyTicket } from "../../service/classification.service.js";

const chatReply = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ status: false, msg: "Message is required" });
        if (message.length > Number(process.env.MAX_MESSAGE_LENGTH)) return res.status(400).json({ status: false, msg: "Message is too large" });

        const response = await generateText(message);
        if (response) {
            return res.status(200).json({ status: true, msg: response });
        }
        return res.status(400).json({ status: false, msg: 'No response from API service' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" })
    }
}

const classifyPreview = async (title, description) => {
    try {
        if (!title || !description) {
            return res.status(400).json({ status: false, msg: "title and description are required" });
        }
        const result = await classifyTicket(title, description, "classify");
        if(result) return ({ status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

const getTicketSummary = async (req, res) => {
    try {
        const {title, description}= req.body;
        if(!title || !description) return res.status(400).json({status: false, msg: "title, description and category is required"});
        const result= await classifyTicket(title, description, "summary");
        if(result) return res.status(200).json({status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" });

    }
}

export default {
    chatReply,
    classifyPreview,
    getTicketSummary
}