// Stage 4 practice: apne ASLI tickets par classification chalao. DB se sirf padhta hai, kuch likhta nahi.
//
//   npm run ai:classify                       -> asli Gemini se, latest 10 tickets
//   npm run ai:classify -- --limit=20         -> 20 tickets
//   npm run ai:classify -- --fake=category    -> AI galat category de (validation pakadti hai)
//   npm run ai:classify -- --fake=json        -> AI ka jawab JSON hi na ho
//   npm run ai:classify -- --fake=down        -> Gemini down (fallback dikhta hai)
import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import Ticket from "../Schema/customers/ticketSchema.js";
import "../Schema/admin/categorySchema.js"; // populate("categoryId") ke liye model register hona chahiye
import { classifyTicket } from "../service/classification.service.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]); // server.js jaisa hi (Atlas ke liye)

// Command se option padhna: --limit=20 -> "20"
const getOption = (name) => {
    const found = process.argv.find((a) => a.startsWith(`--${name}=`));
    return found ? found.split("=")[1] : null;
};
const limit = Number(getOption("limit")) || 10;
const fake = getOption("fake");

// Nakli AI: jaanbujhkar galat jawab dete hain, taaki dekh sakein ki validation kya karti hai.
const fakeModels = {
    category: async () => JSON.stringify({ category: "Banana Support", priority: "super-urgent", summary: "x" }),
    json: async () => "Sure! Here is the answer: {category: oops",
    down: async () => { throw new Error("Gemini is down (fake)"); },
};
if (fake && !fakeModels[fake]) {
    console.log("Galat --fake value. Use: category | json | down");
    process.exit(1);
}

const main = async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);

    // Asli tickets, naye pehle. Customer ki chuni hui category ka naam bhi chahiye (populate).
    const tickets = await Ticket.find({}).sort({ createdAt: -1 }).limit(limit).populate("categoryId", "name");
    if (tickets.length === 0) {
        console.log("Abhi DB me koi ticket nahi. App se kuch asli tickets banao, phir chalao.");
        return;
    }

    console.log(`\nMode: ${fake ? "FAKE " + fake : "REAL Gemini"} | Tickets: ${tickets.length}\n`);

    let okCount = 0;
    for (const t of tickets) {
        // fake undefined ho to classifyTicket apna asli generateJson use karega
        const result = await classifyTicket(t.title, t.description, "classify", fake ? fakeModels[fake] : undefined);
        if (result.ok) okCount++;

        console.log("Ticket   :", t.title);
        console.log("Customer :", t.categoryId?.name, "|", t.priority);
        console.log("AI       :", result.data.category, "|", result.data.priority);
        console.log("Summary  :", result.data.summary);
        console.log("Result   :", result.ok ? "OK" : `FALLBACK (${result.reason})`, `| tries: ${result.attempts}\n`);
    }

    console.log(`Validated: ${okCount}/${tickets.length}`);
    console.log("Mismatch ka matlab AI galat hai ye zaruri nahi, customer ne bhi galat chuna ho sakta hai. Har mismatch khud padho.\n");
};

main()
    .catch((err) => console.log("Script failed:", err.message))
    .finally(() => mongoose.disconnect());
