import { z } from "zod";

// Zod ko "form validation" ki tarah socho.
// Yahan hum likhte hain ki AI ka jawab KAISA dikhna chahiye.
// Jawab is shape me nahi hua to safeParse() fail hoga aur hum use DB tak jaane nahi denge.
export const classificationSchema = z.object({
    category: z.string().min(1),                              // khali nahi hona chahiye
    priority: z.enum(["low", "medium", "high", "urgent"]),    // sirf ye 4 values (ticketSchema ke same)
    summary: z.string().min(1).max(200),                      // 1 se 200 characters
});
