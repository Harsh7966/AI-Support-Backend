import { generateText } from "../../service/llm.service.js";
import { aiGenerateDraft, classifyTicket } from "../../service/classification.service.js";
import Message from "../../Schema/customers/messageSchema.js";
import Ticket from "../../Schema/customers/ticketSchema.js";
import { embedTexts } from "../../service/embedding.service.js";
import { ensureCollection, upsertPoints, searchSimilar, toPointId } from "../../service/vector.service.js";
import { answerFromTickets } from "../../service/rag.service.js";
import { isWorthIndexing } from "../../utils/helper.js";
import { isFeatureEnabled } from "../../service/aiSettings.service.js";

const chatReply = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ status: false, msg: "Message is required" });
        if (message.length > (Number(process.env.MAX_MESSAGE_LENGTH) || 1000)) return res.status(400).json({ status: false, msg: "Message is too large" });

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
        // Ye function route nahi hai (ticket create ke andar se bulaya jata hai), isliye res nahi hota. Object return karte hain.
        if (!title || !description) return { status: false, reason: "invalid_input", attempts: 0, data: null };
        const result = await classifyTicket(title, description, "classify");
        if (result) return ({ status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data });
        return { status: false, reason: "no_result", attempts: 0, data: null };
    } catch (err) {
        console.log(err);
        return { status: false, reason: "unexpected_error", attempts: 0, data: null };
    }
}

const getTicketSummary = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) return res.status(400).json({ status: false, msg: "title, description and category is required" });
        const result = await classifyTicket(title, description, "summary");
        if (result) return res.status(200).json({ status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

const generateDraft = async (req, res) => {
    try {
        const id = req.params.id;
        const getTicketDetails = await Ticket.findById(id);
        if (!getTicketDetails) return res.status(200).json({ status: false, msg: "Ticket not found" });
        // Agent sirf apne assigned ticket ka draft bana sakta hai (admin sab ka)
        if (res.agent && String(getTicketDetails.assignedAgentId) !== String(res.agent.userId)) {
            return res.status(200).json({ status: false, msg: "Unauthorized" });
        }
        const LastChats = (await Message.find({ ticketId: id }).select("senderRole message").sort({ createdAt: -1 }).limit(10)).reverse();
        // if(LastChats.length === 0) return res.status(200).json({status: false, msg: "No conversation found"});
        const getSummary = await classifyTicket(getTicketDetails?.title, getTicketDetails?.description, "summary");
        if (!getSummary.ok) {
            const msg = getSummary.reason === "ai_disabled" ? "AI is currently turned off by admin" : "No reply for API service for generate summary";
            return res.status(200).json({ status: false, msg });
        }
        const result = await aiGenerateDraft(getSummary?.data, LastChats);
        if (result.ok) return res.status(200).json({ status: result.ok, attempts: result.attempts, data: result.data });
        return res.status(400).json({ status: result.ok, reason: result.reason, attempts: result.attempts, data: result.data });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

const indexOneTicket = async (id) => {
    try {
        await ensureCollection();
        const ticket = await Ticket.findById(id).populate("categoryId", "name").select("title description categoryId");
        const check= isWorthIndexing(ticket);
        if(!check) return;
        const [vector] = await embedTexts([`${ticket?.title}. ${ticket?.description}`.slice(0, 1000)], "RETRIEVAL_DOCUMENT");
        const points = {
            id: toPointId(ticket._id),
            vector,
            payload: { ticketId: String(ticket?._id), title: ticket?.title, category: ticket?.categoryId?.name || "unknown" }
        }
        console.log("Single ticket vector:", JSON.stringify(points.vector)); 
        await upsertPoints([points]);
        return;
    } catch (err) {
        console.log(err);
    }
}

// Stage 8: tickets ko embed karke Qdrant me store karta hai. Dobara chalane par duplicate nahi banta (same id = update).
// Abhi manually chalate hain. Baad me ticket create hone par apne aap hoga.
const indexTickets = async (req, res) => {
    try {
        await ensureCollection();
        const allTickets = await Ticket.find({}).populate("categoryId", "name").select("title description categoryId");
        const tickets = allTickets.filter(isWorthIndexing);
        if (tickets.length === 0) return res.status(200).json({ status: true, indexed: 0, skipped: allTickets.length });

        const BATCH = 50; // ek call me bahut saare texts nahi bhejte
        for (let i = 0; i < tickets.length; i += BATCH) {
            const batch = tickets.slice(i, i + BATCH);
            const vectors = await embedTexts(batch.map((t) => `${t.title}. ${t.description}`.slice(0, 1000)), "RETRIEVAL_DOCUMENT");
            const points = batch.map((t, idx) => ({
                id: toPointId(t._id),
                vector: vectors[idx],
                payload: { ticketId: String(t._id), title: t.title, category: t.categoryId?.name || "unknown" },
            }));
            // DEBUG (dekhne ke baad hata dena): is batch ke SAB tickets ke poore vectors (768 numbers)
            // points.forEach((pt, n) => {
            //     console.log(`[DEBUG:index] #${n + 1} ${pt.payload.title} | ${pt.payload.category} | vectorLength: ${pt.vector.length}`);
            //     console.log(JSON.stringify(pt.vector));
            // });
            await upsertPoints(points);
        }
        return res.status(200).json({ status: true, indexed: tickets.length, skipped: allTickets.length - tickets.length });
    } catch (err) {
        console.log("[AI:index] error:", err.message);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

// Stage 7+8: semantic search. Ab sirf query embed hoti hai, tickets Qdrant se aate hain.
// MIN_SCORE: isse kam score = relevant nahi (aapke tickets ke scores se tay: irrelevant ~0.55, relevant 0.65+).
const MIN_SCORE = 0.6;
const similarTickets = async (req, res) => {
    try {
        const query = String(req.body.query || "").trim();
        const category = req.body.category ? String(req.body.category) : undefined; // optional filter
        if (!query) return res.status(400).json({ status: false, msg: "query is required" });
        if (query.length > 500) return res.status(400).json({ status: false, msg: "query is too large" });

        const [queryVector] = await embedTexts([query], "RETRIEVAL_QUERY");
        const hits = await searchSimilar(queryVector, { limit: 3, scoreThreshold: MIN_SCORE, category });
        // DEBUG (dekhne ke baad hata dena): sawaal ka vector aur Qdrant ne kya diya
        // console.log("[DEBUG:search] query:", query, "| vectorLength:", queryVector.length, "| vectorFirst8:", queryVector.slice(0, 8));
        // console.log("[DEBUG:search] hits:", hits.map((h) => ({ title: h.payload.title, score: Number(h.score.toFixed(3)) })));

        const data = hits.map((h) => ({
            ticketId: h.payload.ticketId,
            title: h.payload.title,
            category: h.payload.category,
            score: Number(h.score.toFixed(3)),
        }));
        return res.status(200).json({ status: true, data });
    } catch (err) {
        console.log("[AI:embed] error:", err);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

// Agent sawaal poochta hai, jawab purane tickets se aata hai (Qdrant + Mongo + LLM).
// Customer ko abhi nahi diya: sources dusre customers ke tickets hain (privacy). Customer ke liye documents/FAQ chahiye honge.
const askAssistant = async (req, res) => {
    try {
        const question = String(req.body.question || "").trim();
        if (!question) return res.status(400).json({ status: false, msg: "question is required" });
        if (question.length > 500) return res.status(400).json({ status: false, msg: "question is too large" });
        if (!(await isFeatureEnabled("assistant"))) return res.status(200).json({ status: false, msg: "AI assistant is currently turned off by admin" });

        const result = await answerFromTickets(question);
        return res.status(200).json({ status: true, ...result });
    } catch (err) {
        console.log("[AI:ask] error:", err.message);
        return res.status(500).json({ status: false, msg: "API service error" });
    }
}

export default {
    chatReply,
    classifyPreview,
    getTicketSummary,
    generateDraft,
    similarTickets,
    indexTickets,
    askAssistant,
    indexOneTicket
}