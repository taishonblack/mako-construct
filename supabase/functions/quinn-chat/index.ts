import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Quinn, a binder creation assistant for MAKO — an NHL broadcast production platform.

Your job: extract structured binder fields from the user's free-form messages. You are calm, direct, operational, and efficient. No fluff.

RULES:
- Parse the user's message and extract as many fields as possible.
- Respond with a tool call containing the extracted fields.
- For any field you cannot determine, omit it from the response.
- Normalize control rooms: PCR23/CR23/CR-23/Room 23 → "23", PCR26/CR26/CR-26 → "26"
- Normalize teams to 3-letter NHL codes (NYR, BOS, TOR, MTL, etc.)
- Parse dates into YYYY-MM-DD format. If year missing, assume 2026.
- Parse times into HH:MM 24-hour format.
- Timezones: ET→America/New_York, PT→America/Los_Angeles, CT→America/Chicago, MT→America/Denver, CET→Europe/Berlin
- If "NHL Studios" mentioned, venue is "NHL Studios NYC"
- Also generate a short conversational reply (1-2 sentences max) acknowledging what you found and asking about what's missing. Use MAKO tone: calm, confident, operational. No emoji, no "awesome", no "great question".

Valid NHL team codes: ANA, ARI, BOS, BUF, CGY, CAR, CHI, COL, CBJ, DAL, DET, EDM, FLA, LAK, MIN, MTL, NSH, NJD, NYI, NYR, OTT, PHI, PIT, SJS, SEA, STL, TBL, TOR, VAN, VGK, WPG, WSH`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, draft } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context about current draft state
    const draftContext = draft
      ? `\n\nCurrent draft state (fields already filled):\n${JSON.stringify(draft, null, 2)}\n\nOnly extract fields that are NEW or DIFFERENT from what's already in the draft. Focus your conversational reply on what's still missing.`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + draftContext },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_binder_fields",
              description: "Extract structured binder fields from the user's message along with a conversational reply.",
              parameters: {
                type: "object",
                properties: {
                  reply: {
                    type: "string",
                    description: "Short conversational reply (1-2 sentences) in MAKO tone. Acknowledge what was found, ask about what's missing.",
                  },
                  binderTitle: { type: "string", description: "Binder title, e.g. 'NYR @ BOS' or 'Germany Intl'" },
                  homeTeam: { type: "string", description: "3-letter NHL team code for home team" },
                  awayTeam: { type: "string", description: "3-letter NHL team code for away team" },
                  gameDate: { type: "string", description: "Date in YYYY-MM-DD format" },
                  gameTime: { type: "string", description: "Time in HH:MM 24-hour format" },
                  timezone: { type: "string", description: "IANA timezone string" },
                  controlRoom: { type: "string", description: "Control room: '23', '26', 'Remote', or other" },
                  venue: { type: "string", description: "Venue name" },
                  broadcastFeed: { type: "string", description: "Broadcast feed to watch" },
                  status: { type: "string", enum: ["draft", "active"], description: "Binder status" },
                  onsiteTechManager: { type: "string", description: "Onsite tech manager name" },
                  notes: { type: "string", description: "Any additional notes" },
                  confidence: {
                    type: "object",
                    description: "Confidence level for each extracted field",
                    additionalProperties: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  quickReplies: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 quick reply suggestions for the user. Include 'Skip' if asking a question.",
                  },
                },
                required: ["reply"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_binder_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return the text content
    const content = data.choices?.[0]?.message?.content || "I couldn't parse that. Try again with more details.";
    return new Response(JSON.stringify({ reply: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quinn-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
