// ============================================================
// RemindMe — AI API Route: Voice-to-Reminder / Voice-to-BP
// POST /api/ai/voice-parse
// Body: { text: string, mode: 'reminder' | 'bp' }
// Returns: parsed structured JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json() as { text: string; mode: 'reminder' | 'bp' };
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

    let systemPrompt = '';

    if (mode === 'reminder') {
      systemPrompt = `You are a smart voice assistant for a reminder app. Extract reminder data from natural language voice input. 
Today's date is ${today}. Tomorrow is ${tomorrow}.

Support Hinglish/Hindi input fully.

Return ONLY a valid JSON object:
{
  "title": "short action title (max 60 chars)",
  "description": "optional extra context",
  "date": "YYYY-MM-DD",
  "time": "HH:MM in 24h format or null",
  "priority": "low | medium | high | urgent",
  "categoryId": "personal | work | health | finance | shopping | travel | education | fitness | family | birthday | bills",
  "emoji": "single relevant emoji",
  "checklist": []
}

Hindi/Hinglish time mappings:
- "subah" / "morning" → 09:00
- "dopahar" / "afternoon" / "lunch" → 13:00
- "shaam" / "evening" → 18:00
- "raat" / "night" → 21:00
- "kal" / "tomorrow" → use tomorrow's date
- "aaj" / "today" → use today's date
- "parso" → day after tomorrow
- "jaldi" / "urgent" → priority urgent
- "doctor", "medicine", "dawa" → categoryId health
- "office", "meeting", "boss" → categoryId work

Return raw JSON only.`;
    } else {
      systemPrompt = `You are a voice assistant for a blood pressure tracking app.
Extract BP reading data from natural voice input in English/Hindi/Hinglish.

Return ONLY a valid JSON object:
{
  "systolic": number (upper BP value),
  "diastolic": number (lower BP value),
  "pulse": number (heart rate, default 72 if not mentioned),
  "notes": "any extra notes mentioned"
}

Examples:
- "BP 130/85 pulse 78" → { systolic: 130, diastolic: 85, pulse: 78, notes: "" }
- "Mera BP abhi 140 upar 90 neeche tha" → { systolic: 140, diastolic: 90, pulse: 72, notes: "" }
- "Blood pressure 120/80 naadi 68" → { systolic: 120, diastolic: 80, pulse: 68, notes: "" }

Return raw JSON only.`;
    }

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ], { temperature: 0.1, max_tokens: 300 });

    const parsed = parseJsonFromAI(raw);
    return NextResponse.json({ data: parsed, mode });
  } catch (err) {
    console.error('[AI voice-parse]', err);
    return NextResponse.json({ error: 'Voice parsing failed' }, { status: 500 });
  }
}
