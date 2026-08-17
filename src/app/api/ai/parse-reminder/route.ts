// ============================================================
// RemindMe — AI API Route: Natural Language → Reminder
// POST /api/ai/parse-reminder
// Body: { text: string }
// Returns: { title, date, time, priority, categoryId, description, checklist }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

    const systemPrompt = `You are a smart reminder assistant. Extract structured reminder data from natural language input.
Today's date is ${today}. Tomorrow is ${tomorrow}.

Return ONLY a valid JSON object with these fields:
{
  "title": "short action title (max 60 chars)",
  "description": "optional extra context",
  "date": "YYYY-MM-DD (today if not specified)",
  "time": "HH:MM in 24h format (null if not specified)",
  "priority": "low | medium | high | urgent",
  "categoryId": "personal | work | health | finance | shopping | travel | education | fitness | family | birthday | bills",
  "emoji": "single relevant emoji",
  "checklist": [{ "id": "1", "text": "task", "completed": false }] // if multiple tasks mentioned, else empty array
}

Rules:
- "kal" or "tomorrow" → use tomorrow's date
- "aaj" or "today" → use today's date
- "subah" → 09:00, "dopahar" → 13:00, "shaam" → 18:00, "raat" → 21:00
- Be smart about Hindi/Hinglish inputs
- priority "urgent" only if words like "urgent", "emergency", "asap", "jaldi" appear
- Do NOT wrap in markdown, return raw JSON only`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ], { temperature: 0.2, max_tokens: 400 });

    const parsed = parseJsonFromAI(raw);
    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error('[AI parse-reminder]', err);
    return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 });
  }
}
