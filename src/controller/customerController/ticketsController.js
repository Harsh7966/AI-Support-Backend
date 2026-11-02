import Ticket from "../../Schema/customers/ticketSchema.js";
import aiController from "../ai/aiController.js";
import AiLog from "../../Schema/ai/aiLogSchema.js";

const createTicket = async (req, res) => {
    try {
        const { title, description, categoryId, priority } = req.body;
        const aiResponse = await aiController.classifyPreview(title, description);
        const createTicket = await Ticket.create({
            title,
            description,
            customerId: res?.customer?.userId,
            categoryId,
            priority,
            aiCategory: aiResponse?.data?.category,
            aiSummary: aiResponse?.data?.summary,
            aiPriority: aiResponse?.data?.priority
        });
        if (createTicket) {
            await aiController.indexOneTicket(createTicket._id);
            return res.status(200).json({ status: true, data: createTicket, msg: "Ticket created successfully" });
        }
    } catch (err) {
        console.log(err);
    }
}

const getAllTicket = async (req, res) => {
    try {
        const getAllTickets = await Ticket.find({ customerId: res.customer.userId })
            .populate("customerId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
            .populate("assignedAgentId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
            .populate("categoryId", "name description isActive isDeleted");

        if (getAllTickets.length === 0) return res.status(200).json({ status: false, data: getAllTickets, msg: "No tickets found" });
        return res.status(200).json({ status: true, data: getAllTickets, msg: "Tickets found" });

    } catch (err) {
        console.log(err);
    }
}

const getTicketDetails = async (req, res) => {
    try {
        const ticketDetail = await Ticket.findById(req.params.id)
            .populate("customerId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
            .populate("assignedAgentId", "firstName lastName email role phone isActive isEmailVerified isDeleted")
            .populate("categoryId", "name description isActive isDeleted");

        if (!ticketDetail) return res.status(200).json({ status: false, data: ticketDetail, msg: "No ticket found" });
        return res.status(200).json({ status: true, data: ticketDetail, msg: "Ticket found" });
    } catch (err) {
        console.log(err);
    }
}

const updateTicket = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, categoryId, priority } = req.body;
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(200).json({ status: false, data: ticket, msg: "Ticket not found" });
        if (title !== undefined) ticket.title = title;
        if (description !== undefined) ticket.description = description;
        if (categoryId !== undefined) ticket.categoryId = categoryId;
        if (priority !== undefined) ticket.priority = priority;
        const updateTicket = await Ticket.findByIdAndUpdate(id,
            { $set: ticket }, { new: true }
        )
        if (updateTicket) {
            if(title !== undefined || description !== undefined || categoryId !== undefined) await aiController.indexOneTicket(id);
            return res.status(200).json({ status: true, data: updateTicket, msg: "Ticket updated successfully" });
        }
    } catch (err) {
        console.log(err);
    }
}

const customerDashboardInfo = async (req, res) => {
    try {
        const { userId } = res.customer;
        const allTickets = await Ticket.find({ customerId: userId })
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        const open = allTickets.filter((t) => ["open", "pending", "in-progress"].includes(t.status)).length;
        const resolved = allTickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;

        // AI assistant ke LLM calls ka count (har call ka log aiLog me hota hai)
        let aiConversations = 0;
        try {
            aiConversations = await AiLog.countDocuments({ userId, feature: "customer_assistant", kind: "llm" });
        } catch (err) {
            console.log(err);
        }

        return res.status(200).json({
            status: true,
            tickets: allTickets.slice(0, 4),
            total: allTickets.length,
            open,
            resolved,
            aiConversations,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, msg: "Failed to load dashboard" });
    }
}

export default {
    createTicket,
    getAllTicket,
    getTicketDetails,
    updateTicket,
    customerDashboardInfo
}