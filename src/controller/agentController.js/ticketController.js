import Ticket from "../../Schema/customers/ticketSchema.js";
import { indexResolvedTicket } from "../../service/ticketIndex.service.js";

const getAllTicket = async (req, res) => {
    try {
        const getAllTickets = await Ticket.find({ assignedAgentId: res.agent.userId })
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
        const { status, priority } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(200).json({ status: false, data: ticket, msg: "Ticket not found" });
        if (status !== undefined) ticket.status = status;
        if (priority !== undefined) ticket.priority = priority;
        const updateTicket = await Ticket.findByIdAndUpdate(req.params.id,
            { $set: ticket }, { new: true }
        )
        if (updateTicket) {
            if (status !== undefined && status === "resolved") {
                try {
                    indexResolvedTicket(req.params.id, updateTicket);
                } catch (err) {
                    console.log(err);
                }
            }
            return res.status(200).json({ status: true, data: updateTicket, msg: "Ticket updated successfully" });
        }
    } catch (err) {
        console.log(err);
    }
}

const agentDashboardInfo = async (req, res) => {
    try {
        const { userId } = res.agent;
        let open = 0, pending = 0, resolved = 0;
        const allTickets = await Ticket.find({ assignedAgentId: userId })
            .populate("assignedAgentId", "firstName lastName")
            .populate("categoryId", "name")
            .populate("customerId", "firstName lastName")
            .sort({ createdAt: -1 });
        if (allTickets.length === 0) return res.status(200).json({ status: true, message: "No ticket assign" });
        allTickets.filter((t) => {
            if (t.status === "open") open++;
            else if (t.status === "pending") pending++;
            else if (t.status === "resolved") resolved++;
        })
        return res.status(200).json({ status: true, tickets: allTickets.slice(0, 5), open, pending, resolved, total: allTickets.length });
    } catch (err) {
        console.log(err);
    }
}

export default {
    getAllTicket,
    getTicketDetails,
    updateTicket,
    agentDashboardInfo
}