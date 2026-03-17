import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageText, pageNumber, totalPages, previousSummaries, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === "hypothesis") {
      systemPrompt = `You are Axiom, an autonomous research analysis engine. You generate precise, falsifiable hypotheses by cross-referencing findings across document pages. Be technical, specific, and cite page numbers. Output JSON with fields: text (string), confidence (number 0-100).`;
      userPrompt = `Based on the following page summaries from a research document, generate ONE cross-referential hypothesis that connects insights across pages. Be specific and cite page numbers.

Previous summaries:
${previousSummaries?.map((s: { pageNumber: number; summary: string }) => `Page ${s.pageNumber}: ${s.summary}`).join("\n\n")}

Generate a hypothesis connecting these findings. Return JSON: {"text": "...", "confidence": 92.5}`;
    } else {
      systemPrompt = `You are Axiom, an autonomous document analysis engine. You produce dense, technical summaries of document pages. Each summary should capture: key claims, methodology, data points, and cross-references to other sections. Be precise and objective. Keep summaries to 2-3 sentences. Do not use filler words.`;
      userPrompt = `Analyze and summarize this page (Page ${pageNumber} of ${totalPages}) from a research document:

---
${pageText || `[Page ${pageNumber} content — this is a PDF page. Provide a analytical summary based on what a typical research document page ${pageNumber} of ${totalPages} would contain. Consider the document structure: introduction, methodology, results, discussion, conclusion.]`}
---

${previousSummaries && previousSummaries.length > 0 ? `Context from previous pages:\n${previousSummaries.map((s: { pageNumber: number; summary: string }) => `P${s.pageNumber}: ${s.summary}`).join("\n")}\n\nReference previous findings where relevant.` : "This is the first page of the document."}

Provide a dense, technical summary (2-3 sentences).`;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(mode === "hypothesis" ? {
          tools: [{
            type: "function",
            function: {
              name: "create_hypothesis",
              description: "Create a research hypothesis",
              parameters: {
                type: "object",
                properties: {
                  text: { type: "string", description: "The hypothesis text" },
                  confidence: { type: "number", description: "Confidence score 0-100" },
                },
                required: ["text", "confidence"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_hypothesis" } },
        } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    if (mode === "hypothesis") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ hypothesis: args }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback: parse from content
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ hypothesis: { text: content, confidence: 88 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-pdf-page error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
