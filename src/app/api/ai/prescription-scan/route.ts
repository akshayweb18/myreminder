// ============================================================
// RemindMe — AI API Route: Prescription Image Scanner
// POST /api/ai/prescription-scan
// Body: { imageBase64: string, mimeType: string }
// Returns: { medicines: [{ name, dosage, frequency, time, notes }] }
// Uses NVIDIA Vision Model: nvidia/llama-3.2-90b-vision-instruct
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseJsonFromAI } from '@/lib/nvidia';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json() as {
      imageBase64: string;
      mimeType: string;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY is not set');

    const systemPrompt = `You are a medical prescription analysis AI. Carefully analyze the prescription or medicine label image and extract all medicine information.

Return ONLY valid JSON (no markdown):
{
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "dosage like 5mg, 10mg etc",
      "frequency": "once-daily | twice-daily | as-needed",
      "time": "morning | afternoon | evening | night | with-food | before-food | after-food",
      "notes": "any special instructions"
    }
  ],
  "doctorName": "doctor name if visible",
  "patientName": "patient name if visible",
  "date": "prescription date if visible"
}

Rules:
- Extract ALL medicines mentioned
- If frequency unclear, use "once-daily"
- If time unclear, use "morning"
- Return empty medicines array if no medicines found
- Do NOT include markdown, return raw JSON only`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: systemPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 600,
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NVIDIA Vision API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    const result = parseJsonFromAI<{
      medicines: {
        name: string;
        dosage: string;
        frequency: 'once-daily' | 'twice-daily' | 'as-needed';
        time: string;
        notes: string;
      }[];
      doctorName?: string;
      patientName?: string;
      date?: string;
    }>(raw);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[AI prescription-scan]', err);
    return NextResponse.json({ error: 'Prescription scan failed' }, { status: 500 });
  }
}
