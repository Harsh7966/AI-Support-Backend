import Ticket from "../Schema/customers/ticketSchema.js";

// ============================================================
// Stage 11: Tool / function calling
// Model sirf BOLTA hai "mujhe ye tool chahiye". Tool CHALATA hamara backend hai.
// Rules: sirf read-only tools, har tool ke andar authorization, model ke arguments par bharosa nahi.
// ============================================================

// Model ko ye list dikhti hai (naam, kaam, arguments)
export const toolDeclarations = [
    {
        name: "getMyTickets",
        description:
            "List the logged-in customer's most recent support tickets (max 5) with title, status and priority. Use it when the customer asks about their tickets in general or has not told which ticket.",
    },
    {
        name: "getTicketStatus",
        description:
            "Get the current status of ONE ticket of the logged-in customer. The ticketId must be a value returned by getMyTickets.",
        parametersJsonSchema: {
            type: "object",
            properties: { ticketId: { type: "string", description: "ticketId taken from getMyTickets" } },
            required: ["ticketId"],
        },
    },
];

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const tools = {
    // customerId hamesha login token se aata hai, model ke argument se kabhi nahi
    getMyTickets: async (args, user) => {
        const tickets = await Ticket.find({ customerId: user.userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("categoryId", "name")
            .select("title status priority createdAt categoryId");
        return {
            tickets: tickets.map((t) => ({
                ticketId: String(t._id),
                title: t.title,
                status: t.status,
                priority: t.priority,
                category: t.categoryId?.name || null,
                createdAt: t.createdAt,
            })),
        };
    },

    getTicketStatus: async (args, user) => {
        const ticketId = String(args?.ticketId || "");
        if (!OBJECT_ID.test(ticketId)) return { error: "Invalid ticket id" }; // model ka argument validate karo
        // Authorization: ticket sirf tab milega jab wo isi customer ka ho
        const ticket = await Ticket.findOne({ _id: ticketId, customerId: user.userId }).populate("categoryId", "name");
        if (!ticket) return { error: "Ticket not found" }; // dusre ka ho ya na ho, jawab same (existence nahi batate)
        return {
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.categoryId?.name || null,
            assignedToAgent: Boolean(ticket.assignedAgentId),
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
        };
    },
};

// Tool chalane ka ek hi darwaza. user = login token se aaya { userId, role }
export const executeTool = async (name, args, user) => {
    if (user?.role !== "user" || !user?.userId) return { error: "Not allowed" }; // sirf customer
    const tool = tools[name];
    if (!tool) return { error: "Unknown tool" }; // sirf upar wali fixed list, aur kuch nahi
    try {
        return await tool(args || {}, user);
    } catch (err) {
        console.log(`[AI:tool] ${name} failed:`, err.message);
        return { error: "Tool failed" };
    }
};
