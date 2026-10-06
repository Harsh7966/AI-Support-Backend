import {z} from "zod";

export const classificationSchema= z.object({
    category: z.string().trim().min(1),
    priority: z.enum(["high", "low", "urgent", "medium"]),
    summary: z.string().trim().min(1).max(200),
})