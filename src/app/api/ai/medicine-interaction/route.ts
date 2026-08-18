// ============================================================
// RemindMe — AI API Route: Medicine Interaction Checker
// POST /api/ai/medicine-interaction
// Body: { newMedicine: string, existingMedicines: string[] }
// Returns: { interactions: [{ severity, description }], foodWarnings: string[], safe: boolean }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';

export async function POST(req: NextRequest) {
  try {
    const { newMedicine, existingMedicines } = await req.json() as {
      newMedicine: string;
      existingMedicines: string[];
    };

    if (!newMedicine?.trim()) {
      return NextResponse.json({ error: 'newMedicine is required' }, { status: 400 });
    }

    if (!existingMedicines || existingMedicines.length === 0) {
      return NextResponse.json({
        interactions: [],
        foodWarnings: [],
        safe: true,
        summary: 'No existing medicines to check against.',
      });
    }

    const systemPrompt = `You are a clinical pharmacist AI assistant. Check for drug-drug interactions and food interactions.

IMPORTANT: You are NOT a doctor. Always recommend consulting a physician.

Return ONLY valid JSON (no markdown):
{
  "safe": true | false,
  "interactions": [
    {
      "severity": "mild | moderate | severe",
      "medicines": ["drug1", "drug2"],
      "description": "Brief description of the interaction"
    }
  ],
  "foodWarnings": ["grapefruit can increase drug levels", etc.],
  "summary": "1-2 sentence overall safety summary"
}

Rules:
- Only report KNOWN, clinically significant interactions
- severity "severe" only for dangerous combinations (e.g., MAOIs + SSRIs)
- severity "moderate" for interactions that need monitoring
- severity "mild" for minor interactions
- Include common food interactions (grapefruit, dairy, alcohol etc.)
- If no interactions found, return safe: true with empty arrays
- Never diagnose or prescribe — only inform`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `New medicine: ${newMedicine}\nExisting medicines: ${existingMedicines.join(', ')}\n\nCheck for drug interactions.`,
      },
    ], { temperature: 0.2, max_tokens: 500 });

    const result = parseJsonFromAI<{
      safe: boolean;
      interactions: { severity: 'mild' | 'moderate' | 'severe'; medicines: string[]; description: string }[];
      foodWarnings: string[];
      summary: string;
    }>(raw);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[AI medicine-interaction]', err);
    return NextResponse.json({ error: 'Interaction check failed' }, { status: 500 });
  }
}
