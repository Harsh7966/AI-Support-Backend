import mongoose from "mongoose";
import KnowledgeDoc from "../../Schema/ai/knowledgeSchema.js";
import { createKnowledge, updateKnowledge, deleteKnowledge, reindexAllKnowledge } from "../../service/knowledge.service.js";
import { MAX_KNOWLEDGE_TITLE, MAX_KNOWLEDGE_CONTENT } from "../../config/aiConfig.js";

// Admin ke liye Knowledge Base: list, add, edit, delete.

// Input sahi hai? Galat ho to error ka message deta hai, sahi ho to null.
// Edit karte waqt (isUpdate) sirf wahi fields check hoti hain jo bheji gayi hain.
const getInputError = (body, isUpdate) => {
    const { title, content, category } = body;

    if (!isUpdate || title !== undefined) {
        const length = String(title || "").trim().length;
        if (length < 3 || length > MAX_KNOWLEDGE_TITLE) return `Title must be 3 to ${MAX_KNOWLEDGE_TITLE} characters`;
    }
    if (!isUpdate || content !== undefined) {
        const length = String(content || "").trim().length;
        if (length < 20 || length > MAX_KNOWLEDGE_CONTENT) return `Content must be 20 to ${MAX_KNOWLEDGE_CONTENT} characters`;
    }
    if (category !== undefined && String(category).length > 50) return "Category must be at most 50 characters";
    return null;
};

// Body se sirf kaam ke fields lo (aur trim karo)
const pickFields = (body) => {
    const data = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.content !== undefined) data.content = String(body.content).trim();
    if (body.category !== undefined) data.category = String(body.category).trim();
    return data;
};

const list = async (req, res) => {
    try {
        const docs = await KnowledgeDoc.find({}).sort({ createdAt: -1 }).limit(200);
        return res.status(200).json({ status: true, data: docs });
    } catch (err) {
        console.log("[AI:kb] list error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not load knowledge base" });
    }
};

const create = async (req, res) => {
    try {
        const error = getInputError(req.body, false);
        if (error) return res.status(400).json({ status: false, msg: error });

        const doc = await createKnowledge({ ...pickFields(req.body), createdBy: res.admin.userId });
        return res.status(200).json({ status: true, data: doc, msg: "Knowledge added" });
    } catch (err) {
        console.log("[AI:kb] create error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not add knowledge (AI service error)" });
    }
};

const update = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ status: false, msg: "Invalid id" });
        const error = getInputError(req.body, true);
        if (error) return res.status(400).json({ status: false, msg: error });

        const doc = await updateKnowledge(req.params.id, pickFields(req.body));
        if (!doc) return res.status(404).json({ status: false, msg: "Knowledge not found" });
        return res.status(200).json({ status: true, data: doc, msg: "Knowledge updated" });
    } catch (err) {
        console.log("[AI:kb] update error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not update knowledge (AI service error)" });
    }
};

const remove = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ status: false, msg: "Invalid id" });

        const deleted = await deleteKnowledge(req.params.id);
        if (!deleted) return res.status(404).json({ status: false, msg: "Knowledge not found" });
        return res.status(200).json({ status: true, msg: "Knowledge deleted" });
    } catch (err) {
        console.log("[AI:kb] delete error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not delete knowledge" });
    }
};

const reindex = async (req, res) => {
    try {
        const count = await reindexAllKnowledge();
        return res.status(200).json({ status: true, indexed: count, msg: `${count} entries re-indexed` });
    } catch (err) {
        console.log("[AI:kb] reindex error:", err.message);
        return res.status(500).json({ status: false, msg: "Reindex failed (AI service error)" });
    }
};

export default { list, create, update, remove, reindex };
