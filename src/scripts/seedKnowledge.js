// Sample knowledge base (FAQ) daalta hai taaki assistant aur evaluation test kar sako.
//   npm run ai:seed-kb             -> sample entries add (jo pehle se hain unhe chhod deta hai)
//   npm run ai:seed-kb -- --remove -> sample entries hata do
// Ye SAMPLE content hai. Asli policies Admin > Knowledge Base page se daalo.
import "dotenv/config";
import dns from "dns";
import fs from "fs";
import mongoose from "mongoose";
import KnowledgeDoc from "../Schema/ai/knowledgeSchema.js";
import { createKnowledge, deleteKnowledge } from "../service/knowledge.service.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const items = JSON.parse(fs.readFileSync(new URL("../eval/seedKnowledge.json", import.meta.url), "utf-8"));
const removeMode = process.argv.includes("--remove");

const main = async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    let changed = 0;
    for (const item of items) {
        const existing = await KnowledgeDoc.findOne({ title: item.title });
        if (removeMode) {
            if (existing) { await deleteKnowledge(existing._id); changed++; console.log("removed:", item.title); }
        } else if (!existing) {
            await createKnowledge({ ...item, createdBy: null });
            changed++;
            console.log("added  :", item.title);
        } else {
            console.log("exists :", item.title);
        }
    }
    console.log(`\nDone. ${changed} entries ${removeMode ? "removed" : "added"}.`);
};

main()
    .catch((err) => { console.log("Seed failed:", err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
