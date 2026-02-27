import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a structured data extractor for broadcast production call sheets and operational documents.
You will receive document content (as an image/PDF or raw text). Extract all relevant operational data and return it using the provided tool.

Guidelines:
- Show title: the name of the event, game, or broadcast (e.g. "NFL Week 12: Bears vs. Packers")
- Show date: in YYYY-MM-DD format
- Venue: stadium or location name
- Control room: the control room or truck identifier (e.g. "NEP ND5", "Game Creek Bravo")
- Call times: all scheduled times with labels (e.g. "Crew Call", "On Air", "Wrap")
- Staff: names, roles, organization tags (e.g. "ESPN", "NEP"), emails, phones
- Tasks: action items with department tags and due times
- Route hints: any signal routing information (TX IDs, ISO names, sources, encoders, transport types, decoders, routers, outputs)

Set confidence to "high" if clearly stated, "medium" if inferred, "low" if guessing or not found.
If a field is not found at all, use empty string or empty array with "low" confidence.`;

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "extract_call_sheet",
    description: "Return structured extraction from a broadcast call sheet or production document.",
    parameters: {
      type: "object",
      properties: {
        showTitle: {
          type: "object",
          properties: {
            value: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        showDate: {
          type: "object",
          properties: {
            value: { type: "string", description: "YYYY-MM-DD" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        venue: {
          type: "object",
          properties: {
            value: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        controlRoom: {
          type: "object",
          properties: {
            value: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        callTimes: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  time: { type: "string", description: "HH:mm 24h format" },
                },
                required: ["label", "time"],
              },
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        staff: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  orgTag: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                },
                required: ["name", "role", "orgTag", "email", "phone"],
              },
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        tasks: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  departmentTag: { type: "string" },
                  dueTime: { type: "string" },
                },
                required: ["title", "departmentTag", "dueTime"],
              },
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
        routeHints: {
          type: "object",
          properties: {
            value: {
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
                required: ["txId", "isoName", "source", "encoder", "transportType", "decoder", "router", "output"],
              },
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["value", "confidence"],
        },
      },
      required: ["showTitle", "showDate", "venue", "controlRoom", "callTimes", "staff", "tasks", "routeHints"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { fileBase64, fileName, mimeType, rawText } = await req.json();

    if (!fileBase64 && !rawText) {
      return new Response(JSON.stringify({ error: "No file or text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user content: either multimodal (file) or plain text
    const userContent: any[] = [
      {
        type: "text",
        text: `Extract all structured data from this broadcast production document (${fileName || "uploaded file"}). Use the extract_call_sheet tool to return the results.`,
      },
    ];

    if (fileBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "application/pdf"};base64,${fileBase64}`,
        },
      });
    } else if (rawText) {
      userContent[0].text += `\n\nDocument content:\n\n${rawText}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "function", function: { name: "extract_call_sheet" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Failed to extract document" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_call_sheet") {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured extraction" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extraction = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extraction, fileName }), {
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
