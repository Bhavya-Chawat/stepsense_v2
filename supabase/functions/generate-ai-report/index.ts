// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import snippets from "./snippets.json" assert { type: "json" };

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "openai/gpt-oss-120b";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch current session_summary row
    const { data: currentSummary, error: summaryError } = await supabase
      .from("session_summary")
      .select("*")
      .eq("session_id", session_id)
      .single();

    if (summaryError || !currentSummary) {
      return new Response(JSON.stringify({ error: "Session summary not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch session details for user_id
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", session_id)
      .single();

    let baselineAvgFatigue: number | null = null;
    let baselineAvgAsymmetry: number | null = null;

    if (sessionData?.user_id) {
      // Fetch last 5 completed sessions
      const { data: pastSessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("user_id", sessionData.user_id)
        .neq("id", session_id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (pastSessions && pastSessions.length > 0) {
        const pastIds = pastSessions.map((s: { id: string }) => s.id);
        const { data: pastSummaries } = await supabase
          .from("session_summary")
          .select("fatigue_index, asymmetry_percent")
          .in("session_id", pastIds);

        if (pastSummaries && pastSummaries.length > 0) {
          const fatigues = pastSummaries.map((s: { fatigue_index: number | null }) => s.fatigue_index).filter((v: number | null): v is number => v !== null);
          const asymmetries = pastSummaries.map((s: { asymmetry_percent: number | null }) => s.asymmetry_percent).filter((v: number | null): v is number => v !== null);

          if (fatigues.length > 0) {
            baselineAvgFatigue = Number((fatigues.reduce((a, b) => a + b, 0) / fatigues.length).toFixed(4));
          }
          if (asymmetries.length > 0) {
            baselineAvgAsymmetry = Number((asymmetries.reduce((a, b) => a + b, 0) / asymmetries.length).toFixed(2));
          }
        }
      }
    }

    // 3. Match snippets
    const matchedSnippets = snippets.filter((s: { topic: string; snippet: string }) => {
      if (s.topic === "asymmetry" && (currentSummary.asymmetry_percent ?? 0) > 15) return true;
      if (s.topic === "fatigue" && (currentSummary.fatigue_bucket === "Moderate" || currentSummary.fatigue_bucket === "Severe")) return true;
      if (s.topic === "fall" && currentSummary.fall_detected) return true;
      if (s.topic === "fungal" && currentSummary.fungal_risk) return true;
      return false;
    });

    let consumerReport = "";
    let doctorReport = "";

    if (groqApiKey) {
      const prompt = `
You are StepSense AI, a specialized biomechanical & gait analysis engine.
Generate a JSON report for a walking session with these exact values:

Metrics:
- Cadence: ${currentSummary.cadence} spm
- Gait Score: ${currentSummary.gait_score} / 100
- Gait Type: ${currentSummary.gait_type}
- Fatigue Index: ${currentSummary.fatigue_index} (Bucket: ${currentSummary.fatigue_bucket})
- Asymmetry: ${currentSummary.asymmetry_percent}%
- Fall Risk Score: ${currentSummary.fall_risk_score} / 100
- Tremor Flag: ${currentSummary.tremor_flag ? 'Yes' : 'No'}
- Joint Strain Score: ${currentSummary.joint_strain_score} / 100 (Dominant Zone: ${currentSummary.joint_strain_zone})
- Vascular Risk Score: ${currentSummary.vascular_risk_score} / 100
- Diabetic Ulcer Risk Score: ${currentSummary.ulcer_risk_score} / 100
- Fungal Risk Score: ${currentSummary.fungal_risk_score} / 100
- Shoe-Bite Detected: ${currentSummary.shoe_bite_detected ? 'Yes' : 'No'}
- Terrain Detection: ${currentSummary.terrain_label} (${currentSummary.terrain_confidence}% conf.)
- Diabetic Gait Speed: ${currentSummary.gait_speed ?? 'N/A'} m/s
- Diabetic Swing/Stance Ratio: ${currentSummary.swing_time && currentSummary.stance_time ? (currentSummary.swing_time / currentSummary.stance_time).toFixed(2) : 'N/A'}
- CoP Progression: ${currentSummary.cop_progression ?? 'N/A'}
- IMU Peak Accel: ${currentSummary.peak_acceleration ?? 'N/A'} g
- Peak PTI: ${currentSummary.pti_zones ? Math.max(...Object.values(currentSummary.pti_zones as Record<string, number>)) : 'N/A'}
- Max Foot Temp: ${currentSummary.max_temperature ?? 'N/A'} °C
- High Humidity Duration: ${currentSummary.high_humidity_time_sec ?? '0'} sec
- User Baseline Avg Fatigue: ${baselineAvgFatigue ?? "N/A"}
- User Baseline Avg Asymmetry: ${baselineAvgAsymmetry ?? "N/A"}

Clinical Literature Context:
${matchedSnippets.map((s: { snippet: string }) => `- ${s.snippet}`).join("\n")}

Respond ONLY with valid JSON in this structure:
{
  "consumer_report": "Plain-language summary of user's walk, performance compared to baseline, and actionable advice.",
  "doctor_report": "Technical clinical summary detailing exact metric values, thresholds, biomechanical strain, and clinical literature context."
}
`;

      const groqRes = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const contentStr = groqData.choices?.[0]?.message?.content;
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          consumerReport = parsed.consumer_report || "";
          doctorReport = parsed.doctor_report || "";
        }
      }
    } else {
      consumerReport = `Session completed. Cadence: ${currentSummary.cadence ?? 'N/A'} spm. Fatigue bucket: ${currentSummary.fatigue_bucket ?? 'Normal'}.`;
      doctorReport = `Clinical Summary: Asymmetry ${currentSummary.asymmetry_percent ?? 0}%, Fatigue Index ${currentSummary.fatigue_index ?? 0}. Baseline Fatigue: ${baselineAvgFatigue ?? 'N/A'}, Baseline Asymmetry: ${baselineAvgAsymmetry ?? 'N/A'}.`;
    }

    // 5. Update session_summary row
    await supabase
      .from("session_summary")
      .update({
        ai_report_consumer: consumerReport,
        ai_report_doctor: doctorReport,
        baseline_avg_fatigue: baselineAvgFatigue,
        baseline_avg_asymmetry: baselineAvgAsymmetry,
      })
      .eq("session_id", session_id);

    return new Response(
      JSON.stringify({
        success: true,
        session_id,
        baselineAvgFatigue,
        baselineAvgAsymmetry,
        ai_report_consumer: consumerReport,
        ai_report_doctor: doctorReport,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
