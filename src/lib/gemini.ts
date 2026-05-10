import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiResponseSchema, type GeminiResponse, type RoastLevel } from "./schemas";
import { SYSTEM_PROMPTS, PDF_SYSTEM_PROMPTS } from "./prompts";

const provider = process.env.AI_PROVIDER === "gemini" ? "gemini" : "groq";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing required env var: GROQ_API_KEY");
}
if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
  throw new Error("Missing required env var: GEMINI_API_KEY (AI_PROVIDER=gemini)");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = provider === "gemini" ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!) : null;

export class NotLinkedInError extends Error {
  constructor() {
    super("not_a_linkedin_profile");
    this.name = "NotLinkedInError";
  }
}

async function callGroq(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  console.log("[groq] request:", JSON.stringify({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    prompt,
    mimeType,
    imageBytes: base64Image.length,
    response_format: "json_object",
    temperature: 0.9,
    max_tokens: 1500,
  }, null, 2));

  const result = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
    max_tokens: 1500,
  });
  const text = result.choices[0]?.message?.content?.trim() ?? "";
  console.log("[groq] response:", text);
  return text;
}

async function callGemini(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  console.log("[gemini] request:", JSON.stringify({ model: "gemini-2.5-flash-lite", prompt, mimeType, imageBytes: base64Image.length }, null, 2));

  const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } },
  ]);
  const text = result.response.text().trim();
  console.log("[gemini] response:", text);
  return text;
}

export async function roastProfile(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png",
  level: RoastLevel,
  profileName?: string
): Promise<GeminiResponse> {
  const safeName = profileName
    ? profileName.replace(/[\r\n\t"\\]/g, " ").replace(/[^\x20-\x7E]/g, "").trim()
    : undefined;

  const basePrompt = safeName
    ? `The person's name is "${safeName}". Address them by name throughout the roast.\n\n${SYSTEM_PROMPTS[level]}`
    : SYSTEM_PROMPTS[level];

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? basePrompt
        : basePrompt +
          "\n\nCRITICAL: Your previous response failed validation. Return ONLY the raw JSON object. The 'category' field MUST be exactly one of: \"Humble Bragger\", \"Gurupanti Guru\", \"Buzzword Salad\", \"Engagement Baiter\", \"Genuine Professional\", \"Cringe Royalty\", \"Vibe Coder\", \"Framework Fanatic\", \"Intern Energy\", \"Sales Bro\", \"Founder Mode\", \"Recruiter Bot\", \"AI Evangelist\", \"Thought Leader Cosplay\". No other value is allowed.";

    let text: string;
    if (provider === "gemini") {
      try {
        text = await callGemini(base64Image, mimeType, prompt);
      } catch (geminiErr) {
        console.warn("[roast] Gemini failed, falling back to Groq:", geminiErr);
        text = await callGroq(base64Image, mimeType, prompt);
      }
    } else {
      text = await callGroq(base64Image, mimeType, prompt);
    }

    let parsed: unknown;
    try {
      // Gemini may wrap JSON in markdown code blocks
      const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      if (attempt === 1) throw new Error(`${provider} returned invalid JSON after retry.`);
      continue;
    }

    const asObj = parsed as Record<string, unknown>;
    if (asObj.error === "not_a_linkedin_profile") {
      throw new NotLinkedInError();
    }

    const validated = GeminiResponseSchema.safeParse(parsed);
    if (validated.success) return validated.data;
    console.error(`[roast] ${provider} response category:`, asObj.category);
    console.error(`[roast] ${provider} raw response:`, text);
    if (attempt === 1) {
      throw new Error(`${provider} response failed validation: ${validated.error.message}`);
    }
  }

  throw new Error(`${provider} call failed.`);
}

export async function roastProfileFromText(
  profileText: string,
  level: RoastLevel,
  profileName?: string
): Promise<GeminiResponse> {
  const safeName = profileName
    ? profileName.replace(/[\r\n\t"\\]/g, " ").replace(/[^\x20-\x7E]/g, "").trim()
    : undefined;

  const basePrompt = safeName
    ? `The person's name is "${safeName}". Address them by name throughout the roast.\n\n${PDF_SYSTEM_PROMPTS[level]}`
    : PDF_SYSTEM_PROMPTS[level];

  const fullPrompt = `${basePrompt}\n\n═══════════════════════════════════════\nLINKEDIN PROFILE TEXT (extracted from PDF):\n═══════════════════════════════════════\n${profileText.slice(0, 12_000)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? fullPrompt
        : fullPrompt + "\n\nCRITICAL: Previous response failed validation. Return ONLY raw JSON.";

    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 1500,
    });

    const text = result.choices[0]?.message?.content?.trim() ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      if (attempt === 1) throw new Error("Groq returned invalid JSON after retry.");
      continue;
    }

    const asObj = parsed as Record<string, unknown>;
    if (asObj.error === "not_a_linkedin_profile") throw new NotLinkedInError();

    const validated = GeminiResponseSchema.safeParse(parsed);
    if (validated.success) return validated.data;
    if (attempt === 1) throw new Error(`PDF roast validation failed: ${validated.error.message}`);
  }

  throw new Error("Groq PDF roast failed.");
}
