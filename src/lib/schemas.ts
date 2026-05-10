import { z } from "zod";

export const RoastLevelSchema = z.enum(["mild", "medium", "heavy", "dhoni"]);
export type RoastLevel = z.infer<typeof RoastLevelSchema>;

export const CategorySchema = z.enum([
  "Humble Bragger",
  "Gurupanti Guru",
  "Buzzword Salad",
  "Engagement Baiter",
  "Genuine Professional",
  "Cringe Royalty",
  "Vibe Coder",
  "Framework Fanatic",
  "Intern Energy",
  "Sales Bro",
  "Founder Mode",
  "Recruiter Bot",
  "AI Evangelist",
  "Thought Leader Cosplay",
]);

export const CringePatternSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
});

export const GeminiResponseSchema = z.object({
  profileName: z.string().min(1),
  roastScore: z.number().int().min(0).max(100),
  category: CategorySchema,
  roastPoints: z.array(z.string()).length(5),
  bannerRoast: z.string().min(1),
  verdict: z.string().min(1),
  cringePatterns: z.array(CringePatternSchema).length(3),
});

export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

export const RoastRequestSchema = z.object({
  image: z.string().min(1).max(8_000_000),
  mimeType: z.enum(["image/jpeg", "image/png"]).default("image/jpeg"),
  level: RoastLevelSchema,
  profileName: z.string().max(100).optional(),
});

export const RoastSourceSchema = z.enum(["screenshot", "pdf"]);
export type RoastSource = z.infer<typeof RoastSourceSchema>;

export const PdfRoastRequestSchema = z.object({
  pdfBase64: z.string().min(1).max(10_000_000),
  level: RoastLevelSchema,
  profileName: z.string().max(100).optional(),
});

export type RoastData = GeminiResponse & {
  roastId: string;
  level: RoastLevel;
  createdAt: number;
  source?: RoastSource;
};
