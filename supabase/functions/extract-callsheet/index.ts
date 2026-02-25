import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a broadcast production call sheet parser for MAKO Live, a live sports production management platform.

Given the raw text of a call sheet, email, or production document, extract structured data using the tool provided.

Rules:
- Extract ALL timeline/schedule entries you can find (time + label pairs).
- Extract ALL staff names with their roles.
- Extract tasks: any action item, check, or verb-based instruction (e.g. "Transmission Check", "Calibrate DED").
- For confidence: use "high" if the field is explicitly stated, "medium" if inferred, "low" if guessed.
- For controlRoom: use the exact string if found (e.g. "PCR23", "CR-26"), otherwise "Unknown".
- For routeHints: extract any signal/transmission info (TX IDs, ISO names, encoder/decoder references).
- showDate should be ISO format (YYYY-MM-DD).
- If a field is not found, use empty string or empty array as appropriate.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Parse the following call sheet / production document:\n\n${text}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_callsheet",
                description:
                  "Extract structured production data from a call sheet or production email.",
                parameters: {
                  type: "object",
                  properties: {
                    showTitle: { type: "string", description: "Show or production name" },
                    showTitleConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    showDate: { type: "string", description: "ISO date YYYY-MM-DD" },
                    showDateConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    airTime: { type: "string", description: "Air time e.g. 19:00" },
                    airTimeConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    venue: { type: "string" },
                    venueConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    facility: { type: "string", description: "Studio or facility name" },
                    facilityConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    controlRoom: { type: "string" },
                    controlRoomConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    productionType: { type: "string", description: "e.g. Live, Live-to-Tape, Post" },
                    productionTypeConfidence: { type: "string", enum: ["high", "medium", "low"] },
                    league: { type: "string" },
                    homeTeam: { type: "string" },
                    awayTeam: { type: "string" },
                    callTimes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string" },
                          label: { type: "string" },
                          category: { type: "string", enum: ["production", "engineering", "talent", "general"] },
                        },
                        required: ["time", "label"],
                        additionalProperties: false,
                      },
                    },
                    staff: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          role: { type: "string" },
                          department: { type: "string", enum: ["production", "engineering", "audio", "operations", "talent", "other"] },
                          email: { type: "string" },
                          phone: { type: "string" },
                        },
                        required: ["name", "role"],
                        additionalProperties: false,
                      },
                    },
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          departmentTag: { type: "string", enum: ["engineering", "transmission", "audio", "production", "operations", "other"] },
                          dueTime: { type: "string" },
                        },
                        required: ["title", "departmentTag"],
                        additionalProperties: false,
                      },
                    },
                    routeHints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          txId: { type: "string" },
                          isoName: { type: "string" },
                          source: { type: "string" },
                          encoder: { type: "string" },
                          transportType: { type: "string" },
                          decoder: { type: "string" },
                          router: { type: "string" },
                          output: { type: "string" },
                        },
                        required: ["txId"],
                        additionalProperties: false,
                      },
                    },
                    accessInstructions: { type: "string" },
                    notes: { type: "string", description: "Any additional relevant info" },
                  },
                  required: [
                    "showTitle", "showTitleConfidence",
                    "showDate", "showDateConfidence",
                    "airTime", "airTimeConfidence",
                    "venue", "venueConfidence",
                    "controlRoom", "controlRoomConfidence",
                    "callTimes", "staff", "tasks",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_callsheet" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extracted;
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ extraction: extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-callsheet error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
