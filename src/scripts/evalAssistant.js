// Stage 12: Assistant ki quality NUMBER me naapna (30 fixed sawaal).
//   npm run ai:eval                -> sirf retrieval check (sasta: sirf embeddings, LLM nahi)
//   npm run ai:eval -- --answers   -> LLM se poora jawab bhi check (hallucination test)
// Har run ke baad pichle run se compare dikhta hai. Prompt / threshold / top-K badal ke dobara chalao.
// Pehle knowledge base me data chahiye: npm run ai:seed-kb
import "dotenv/config";
import dns from "dns";
import fs from "fs";
import mongoose from "mongoose";
import { searchKnowledge } from "../service/knowledge.service.js";
import { answerCustomer } from "../service/assistant.service.js";
import { runWithAiContext } from "../utils/aiContext.js";
import { MIN_SCORE, TOP_K, NO_ANSWER } from "../config/aiConfig.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const tests = JSON.parse(fs.readFileSync(new URL("../eval/testSet.json", import.meta.url), "utf-8"));
const withAnswers = process.argv.includes("--answers");
const RESULTS_DIR = new URL("../../eval-results/", import.meta.url);
const LATEST = new URL("latest.json", RESULTS_DIR); // pichle run ka summary yahan save hota hai
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

const main = async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    const fakeCustomer = { userId: "000000000000000000000000", role: "user" }; // koi ticket nahi, tools khaali dete hain

    const rows = [];
    for (const t of tests) {
        const start = Date.now();
        // minScore 0: saare scores dekhne ke liye. Threshold neeche khud lagate hain.
        const hits = await searchKnowledge(t.q, { limit: TOP_K, minScore: 0 });
        const retrievalMs = Date.now() - start;
        const accepted = hits.filter((h) => h.score >= MIN_SCORE);
        const topScore = hits[0]?.score ?? 0;

        const row = { q: t.q, expectDoc: t.expectDoc, topScore, retrievalMs, topTitle: hits[0]?.title ?? null };
        if (t.expectDoc) {
            const match = (h) => h.title.toLowerCase().includes(t.expectDoc.toLowerCase());
            row.top1 = accepted.length > 0 && match(accepted[0]);
            row.top3 = accepted.some(match);
            row.pass = row.top3;
        } else {
            row.refused = accepted.length === 0; // knowledge me jawab nahi hai, to kuch nahi milna chahiye
            row.pass = row.refused;
        }

        if (withAnswers) {
            const s2 = Date.now();
            const result = await runWithAiContext({ feature: "evaluation" }, () => answerCustomer(t.q, fakeCustomer));
            row.answerMs = Date.now() - s2;
            row.found = result.found;
            row.answerPass = t.expectDoc ? result.found === true : result.found === false && result.answer === NO_ANSWER;
        }
        rows.push(row);
        console.log(`${row.pass ? "PASS" : "FAIL"}  ${String(row.topScore).padEnd(6)} ${t.q}${row.pass ? "" : `   (top: ${row.topTitle})`}`);
    }

    const ans = rows.filter((r) => r.expectDoc);
    const unk = rows.filter((r) => !r.expectDoc);
    const summary = {
        date: new Date().toISOString(),
        settings: { minScore: MIN_SCORE, topK: TOP_K },
        questions: rows.length,
        retrievalTop1Pct: pct(ans.filter((r) => r.top1).length, ans.length),
        retrievalTop3Pct: pct(ans.filter((r) => r.top3).length, ans.length),
        unknownRefusedPct: pct(unk.filter((r) => r.refused).length, unk.length),
        avgRetrievalMs: Math.round(rows.reduce((n, r) => n + r.retrievalMs, 0) / rows.length),
        // Threshold tune karne ke liye: answerable ka sabse kam top score aur unknown ka sabse zyada top score
        lowestAnswerableScore: Math.min(...ans.map((r) => r.topScore)),
        highestUnknownScore: Math.max(...unk.map((r) => r.topScore)),
    };
    if (withAnswers) {
        summary.answerPassPct = pct(rows.filter((r) => r.answerPass).length, rows.length);
        summary.hallucinationFailures = unk.filter((r) => r.found === true).length; // unknown par jawab de diya = galat
        summary.avgAnswerMs = Math.round(rows.reduce((n, r) => n + (r.answerMs || 0), 0) / rows.length);
    }

    console.log("\n========== SUMMARY ==========");
    console.table(summary);
    if (summary.highestUnknownScore >= summary.lowestAnswerableScore) {
        console.log("Note: kuch unknown sawaalon ka score kuch answerable sawaalon se zyada/barabar hai. Sirf threshold se dono alag nahi honge; knowledge entries ya prompt sudharo.");
    } else {
        const mid = ((summary.highestUnknownScore + summary.lowestAnswerableScore) / 2).toFixed(2);
        console.log(`Threshold suggestion: dono ke beech ~${mid} (abhi ${MIN_SCORE}). .env me RAG_MIN_SCORE=${mid} se try karo.`);
    }

    // Pichle run se compare
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    if (fs.existsSync(LATEST)) {
        const prev = JSON.parse(fs.readFileSync(LATEST, "utf-8"));
        console.log(`\nPichla run (${prev.date}) se compare:`);
        for (const key of ["retrievalTop1Pct", "retrievalTop3Pct", "unknownRefusedPct", "answerPassPct"]) {
            if (summary[key] !== undefined && prev[key] !== undefined) {
                const diff = summary[key] - prev[key];
                console.log(`  ${key}: ${prev[key]} -> ${summary[key]} (${diff >= 0 ? "+" : ""}${diff})`);
            }
        }
    }
    fs.writeFileSync(LATEST, JSON.stringify(summary, null, 2));
};

main()
    .catch((err) => { console.log("Eval failed:", err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
