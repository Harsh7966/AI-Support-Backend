import { AsyncLocalStorage } from "node:async_hooks";
import { getAuthUser } from "../middleware/authMiddleware.js";

// Stage 12 (logging): har AI call ke log me "kaunsa feature" aur "kaunsa user" likhna hai,
// par llm.service ko ye sab pata nahi hota. Isliye request ke saath ek chhota "context" chalta rehta hai.
// Route me aiContext("feature_naam") lagao, baaki sab apne aap ho jata hai (functions ke arguments nahi badalne padte).
const storage = new AsyncLocalStorage();

export const aiContext = (feature) => (req, res, next) => {
    const user = getAuthUser(res);
    storage.run({ feature, userId: user?.userId || null, role: user?.role || null }, next);
};

// Scripts (jaise eval) ke liye: bina request ke context set karna
export const runWithAiContext = (store, fn) => storage.run(store, fn);

export const getAiContext = () => storage.getStore() || {};
