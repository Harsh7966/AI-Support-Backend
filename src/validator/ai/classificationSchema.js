import { z } from "zod";

export const classificationSchema = z.object({
    category: z.string().min(1),                             
    priority: z.enum(["low", "medium", "high", "urgent"]),    
    summary: z.string().min(1).max(200),                      
});

export const SummaryVerificationSchema= z.object({
    category: z.string().min(1),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    summary: z.string().min(1).max(200), 
    keyPoints: z.array(z.string().min(1).max(100)).min(1).max(4),
    suggestedNextStep: z.string().min(1)
})

export const DraftVerificationSchema= z.object({
    aiDraft: z.string().min(1).max(200)
})