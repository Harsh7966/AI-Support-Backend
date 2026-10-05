import Ticket from "../../Schema/customers/ticketSchema.js";
import Message from "../../Schema/customers/messageSchema.js";

// GET /user/messages/:ticketId  ->  purani chat history (customer ke liye)
const getMessages = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId);
        if (!ticket) return res.status(200).json({ status: false, data: [], msg: "Ticket not found" });

        // Security: ticket isi customer ki honi chahiye
        if (String(ticket.customerId) !== String(res.customer.userId)) {
            return res.status(200).json({ status: false, data: [], msg: "Unauthorized" });
        }

        const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ createdAt: 1 });
        return res.status(200).json({ status: true, data: messages, msg: "Messages found" });
    } catch (err) {
        console.log(err);
    }
};

export default { getMessages };
