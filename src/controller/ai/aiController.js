import { generateText } from "../../service/llm.service.js";

const chatReply = async (req, res) => {
    try {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ status: false, msg: "Message is required" });
            if (message.length > process.env.MAX_MESSAGE_LENGTH) return res.status(400).json({ status: false, msg: "Message is too large" });

            const response = await generateText(message);
            if (response) {
                return res.status(200).json({ status: true, msg: response });
            }
            return res.status(400).json({ status: false, msg: 'No response from API service' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ status: false, msg: err.message });
        }
    } catch (err) {
        console.log(err);
    }
}

export default {
    chatReply
}