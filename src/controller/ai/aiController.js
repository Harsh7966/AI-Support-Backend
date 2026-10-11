import { generateText } from "../../service/llm.service.js";
import { aiGenerateDraft, classifyTicket } from "../../service/classification.service.js";
import Message from "../../Schema/customers/messageSchema.js";
import Ticket from "../../Schema/customers/ticketSchema.js";

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

const generateDraft= async(req, res)=>{
    try{
        const id= req.params.id;
        const getTicketDetails= await Ticket.findById(id);
        const LastChats= (await Message.find({ticketId: id}).select("senderRole message").sort({createdAt: -1}).limit(10)).reverse();
        if(LastChats.length === 0) return res.status(200).json({status: false, msg: "No conversation found"});
        const getSummary= await classifyTicket(getTicketDetails?.title, getTicketDetails?.description, "summary");
        if(!getSummary.ok) return res.status(200).json({status: false, msg: "No reply for API service for generate summary"});
        const result= await aiGenerateDraft(getSummary?.data, LastChats);
        if(result.ok) return res.status(200).json({status: result.ok, attempts: result.attempts, data: result.data});
        return res.status(400).json({status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data});
    }catch(err){
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

export default {
    chatReply,
    classifyPreview,
    getTicketSummary,
    generateDraft
}