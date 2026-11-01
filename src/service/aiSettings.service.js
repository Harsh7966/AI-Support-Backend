import AiSetting from "../Schema/ai/aiSettingSchema.js";

// Admin ke AI on/off switches. DB me ek hi document rehta hai (key: "global").
// Document na ho to sab ON maane jate hain.
const DEFAULTS = { aiEnabled: true, classificationEnabled: true, assistantEnabled: true };

export const getAiSettings = async () => {
    try {
        const doc = await AiSetting.findOne({ key: "global" }).lean();
        return { ...DEFAULTS, ...doc };
    } catch (err) {
        console.log("[AI:settings] read failed:", err.message);
        return DEFAULTS; // DB problem me bhi app chalta rahe
    }
};

// feature = "classification" ya "assistant". Master switch band ho to dono band.
export const isFeatureEnabled = async (feature) => {
    const settings = await getAiSettings();
    return settings.aiEnabled && settings[`${feature}Enabled`];
};

// Sirf true/false wali known settings save hoti hain
export const updateAiSettings = async (changes) => {
    const update = {};
    for (const key of Object.keys(DEFAULTS)) {
        if (typeof changes[key] === "boolean") update[key] = changes[key];
    }
    await AiSetting.findOneAndUpdate({ key: "global" }, { $set: update }, { upsert: true });
    return getAiSettings();
};
