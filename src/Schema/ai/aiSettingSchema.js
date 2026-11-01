import mongoose from "mongoose";

// Admin ke AI on/off switch. Hamesha ek hi document (key: "global").
const aiSettingSchema = new mongoose.Schema(
    {
        key: { type: String, default: "global", unique: true },
        aiEnabled: { type: Boolean, default: true },             // master switch: band = saara AI band
        classificationEnabled: { type: Boolean, default: true }, // ticket classify, summary, suggested reply
        assistantEnabled: { type: Boolean, default: true },      // customer + agent assistant (RAG)
    },
    { timestamps: true }
);

const AiSetting = mongoose.model("AiSetting", aiSettingSchema);
export default AiSetting;
