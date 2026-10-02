import Groq from "groq-sdk";
import type { SessionSummary } from "@stepsense/types";

const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export async function generateAiReport(summary: SessionSummary, depth: 'basic' | 'clinical'): Promise<string> {
  if (!groq) {
    throw new Error("Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env file.");
  }

  const isClinical = depth === 'clinical';
  
  const systemPrompt = isClinical
    ? "You are a specialized podiatric biomechanics AI. Analyze the provided gait and plantar pressure metrics. Provide a highly clinical, medical-grade assessment suitable for a doctor's review. Keep it concise, structured, and professional. Do not use emojis."
    : "You are a helpful fitness and health AI. Analyze the provided foot pressure and walking data. Explain the results in simple, encouraging terms suitable for a general consumer or athlete. Highlight any potential risks simply. Keep it concise and avoid medical jargon. Do not use emojis.";

  const dataPrompt = `
Session Data:
- Average Gait Score: ${summary.gait_score ?? 'Unknown'}/100
- Cadence: ${summary.cadence ?? 'Unknown'} spm
- Fatigue Profile: ${summary.fatigue_bucket ?? 'Unknown'} (Score: ${summary.fatigue_score ?? 'Unknown'}/100)
- Joint Strain: ${summary.joint_strain_severity ?? 'Unknown'} (Focus: ${summary.joint_strain_zone ?? 'Unknown'})
- Fall Risk Score: ${(summary as any).fall_risk_score ?? 'Unknown'}/100
- Fungal/Tinea Risk: ${(summary as any).fungal_risk_score ?? 'Unknown'}/100

Please provide a 3-4 paragraph assessment based on this data. Format with clear markdown headings.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: dataPrompt },
      ],
      model: "groq/compound", // Fast, standard model
      temperature: 0.3,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "Error: No response from AI.";
  } catch (error) {
    console.error("Groq generation failed:", error);
    throw new Error("Failed to generate report. Please try again.");
  }
}
