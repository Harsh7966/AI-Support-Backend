import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Ticket from "./Schema/customers/ticketSchema.js";
import Message from "./Schema/customers/messageSchema.js";

/*
  ====== SOCKET KA POORA FLOW (C-J-S-B) ======
  C - Connect   : user ka socket connect hota hai (token se pehchaan)
  J - Join      : user ticket ke "room" me jaata hai (room name = ticketId)
  S - Send      : user "send-message" event bhejta hai
  B - Broadcast : server DB me save karke room ke sabko "new-message" bhejta hai

  Rule: client emit("naam") <---> server on("naam"). Dono side ka naam same hona chahiye.
*/

// Check: kya ye user is ticket ka customer ya assigned agent hai?
// (sirf wahi 2 log us ticket ki chat dekh/bhej sakte hain)
const canAccessTicket = async (ticketId, userId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return false;
    return (
        String(ticket.customerId) === String(userId) ||
        String(ticket.assignedAgentId) === String(userId)
    );
};

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: "http://localhost:3000", credentials: true },
    });

    // ---------- C: CONNECT (gate) ----------
    // Har naye connection se pehle ye chalta hai. Token sahi nahi to connect hi nahi hoga.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token; // frontend ne io(url, {auth:{token}}) me bheja
            const user = jwt.verify(token, process.env.JWT_SECRET); // { userId, email, role }
            socket.user = user; // aage har event me socket.user se user mil jayega
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.user.email);

        // ---------- J: JOIN ----------
        // Frontend: socket.emit("join-ticket", ticketId)
        socket.on("join-ticket", async (ticketId) => {
            try {
                const allowed = await canAccessTicket(ticketId, socket.user.userId);
                if (!allowed) return socket.emit("chat-error", "You cannot access this ticket");
                socket.join(String(ticketId)); // room me entry
            } catch (err) {
                console.log(err);
            }
        });

        // ---------- S: SEND ----------
        // Frontend: socket.emit("send-message", { ticketId, message })
        socket.on("send-message", async ({ ticketId, message }) => {
            try {
                if (!message || !message.trim()) return;

                const allowed = await canAccessTicket(ticketId, socket.user.userId);
                if (!allowed) return socket.emit("chat-error", "You cannot access this ticket");

                // 1) Pehle DB me save (taaki history kabhi na khoye)
                const saved = await Message.create({
                    ticketId,
                    senderId: socket.user.userId,
                    senderRole: socket.user.role,
                    message,
                });

                // ---------- B: BROADCAST ----------
                // 2) Us ticket ke room me jitne bhi hain (customer + agent), sabko bhejo
                io.to(String(ticketId)).emit("new-message", saved);
            } catch (err) {
                console.log(err);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.user.email);
        });
    });
};
