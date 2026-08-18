// ============================================================
// RemindMe — AI API Route: Prescription Image Scanner (v2)
// POST /api/ai/prescription-scan
// Body: { imageBase64: string, mimeType: string }
// Returns: { medicines, rawText, handwritingClarity, doctorName, patientName, date }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseJsonFromAI } from '@/lib/nvidia';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// Use both 90B (primary) and 11B (fallback) vision models
const VISION_MODELS = [
  'meta/llama-3.2-90b-vision-instruct',
  'meta/llama-3.2-11b-vision-instruct',
];

async function callVisionModel(
  apiKey: string,
  model: string,
  imageBase64: string,
  mimeType: string,
  prompt: string,
  maxTokens = 1000,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.05,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

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

    // ── STEP 1: Raw OCR — extract ALL visible text first ──────
    const ocrPrompt = `You are an expert OCR system specialized in reading medical prescriptions — including handwritten ones. 
Your job is to read EVERY piece of text visible in this image, no matter how unclear the handwriting is.

For handwritten text:
- Read character by character if needed
- Make your BEST guess for unclear letters based on medical context
- Common medicine abbreviations: OD=once daily, BD/BID=twice daily, TDS=thrice daily, QID=4x daily, SOS=as needed, PRN=as needed
- Common dosage patterns: tab, cap, mg, ml, mcg
- Duration: days, weeks, months

Return ONLY this JSON (no markdown):
{
  "rawText": "ALL text you can see in the image, transcribed exactly",
  "handwritingClarity": "clear | partial | unclear",
  "confidence": 0.0-1.0,
  "doctorName": "if visible",
  "patientName": "if visible",
  "hospitalClinic": "if visible",
  "date": "if visible",
  "diagnosis": "if visible"
}`;

    // ── STEP 2: Medicine extraction prompt ────────────────────
    const extractPrompt = `You are a clinical pharmacist AI specialized in reading Indian medical prescriptions — both printed AND handwritten.

CRITICAL RULES FOR HANDWRITTEN PRESCRIPTIONS:
- Use medical context to decode unclear handwriting
- Common Indian medicine names: Metformin, Amlodipine, Losartan, Atorvastatin, Aspirin, Paracetamol, Crocin, Dolo, Pantoprazole, Omeprazole, Metoprolol, Ramipril, Telmisartan, Glimepiride, Januvia, Glycomet, Telma, Stamlo, Ecosprin, Calpol, Azithromycin, Amoxicillin, Augmentin, Cefixime
- Indian dosage formats: OD=once-daily, BD=twice-daily, TDS=thrice-daily, QID=4x/day, HS=at night, AC=before meals, PC=after meals, SOS/PRN=as-needed
- Typical Indian prescriptions have: Rx symbol, doctor name on top, patient info, date, medicine list with dosage & duration

EVEN IF HANDWRITING IS UNCLEAR:
- Make your BEST medical inference
- Set confidence field per medicine (0.0-1.0)
- Set clarityNote if you are guessing

Return ONLY valid JSON (no markdown fences):
{
  "medicines": [
    {
      "name": "medicine name (best guess)",
      "genericName": "generic equivalent if known",
      "dosage": "5mg / 10mg / 500mg etc",
      "frequency": "once-daily | twice-daily | thrice-daily | as-needed",
      "time": "morning | afternoon | evening | night | with-food | before-food | after-food",
      "duration": "7 days / 1 month / ongoing etc",
      "notes": "any special instructions",
      "confidence": 0.0-1.0,
      "clarityNote": "if unclear, what made you guess this"
    }
  ],
  "doctorName": "",
  "patientName": "",
  "hospitalClinic": "",
  "date": "",
  "diagnosis": "",
  "handwritingClarity": "clear | partial | unclear",
  "additionalInstructions": "any other visible instructions"
}`;

    let rawText = '';
    let rawResponse = '';
    let lastError = '';

    // Try each vision model in order
    for (const model of VISION_MODELS) {
      try {
        console.log(`[prescription-scan] trying model: ${model}`);

        // Step 1: OCR pass
        const ocrRaw = await callVisionModel(apiKey, model, imageBase64, mimeType, ocrPrompt, 600);
        console.log(`[prescription-scan] OCR raw:`, ocrRaw.substring(0, 200));

        let ocrResult: { rawText?: string; handwritingClarity?: string } = {};
        try {
          ocrResult = parseJsonFromAI(ocrRaw);
          rawText = ocrResult.rawText || '';
        } catch {
          rawText = ocrRaw; // use raw text directly if JSON parse fails
        }

        // Step 2: Medicine extraction pass
        const extractionPrompt = rawText
          ? `${extractPrompt}\n\nOCR Text already extracted from the image:\n"""\n${rawText}\n"""\n\nAlso analyze the image directly for any text missed by OCR.`
          : extractPrompt;

        rawResponse = await callVisionModel(apiKey, model, imageBase64, mimeType, extractionPrompt, 1000);
        console.log(`[prescription-scan] extract raw:`, rawResponse.substring(0, 200));

        // Success — break out of model loop
        break;
      } catch (err) {
        lastError = String(err);
        console.warn(`[prescription-scan] model ${model} failed:`, lastError);
        continue;
      }
    }

    if (!rawResponse) {
      throw new Error(`All vision models failed. Last error: ${lastError}`);
    }

    // Parse medicine extraction result
    let result;
    try {
      result = parseJsonFromAI<{
        medicines: {
          name: string;
          genericName?: string;
          dosage: string;
          frequency: string;
          time: string;
          duration?: string;
          notes: string;
          confidence?: number;
          clarityNote?: string;
        }[];
        doctorName?: string;
        patientName?: string;
        hospitalClinic?: string;
        date?: string;
        diagnosis?: string;
        handwritingClarity?: string;
        additionalInstructions?: string;
      }>(rawResponse);
    } catch {
      // If JSON parse fails entirely, return what we have
      return NextResponse.json({
        medicines: [],
        rawText,
        handwritingClarity: 'unclear',
        parseError: 'Could not parse structured medicines — showing raw text',
        rawResponse: rawResponse.substring(0, 500),
      });
    }

    return NextResponse.json({
      ...result,
      rawText,
    });
  } catch (err) {
    const errMsg = String(err);
    console.error('[AI prescription-scan] FATAL:', errMsg);
    return NextResponse.json(
      { error: 'Prescription scan failed', detail: errMsg },
      { status: 500 },
    );
  }
}
