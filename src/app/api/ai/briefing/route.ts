// ============================================================
// RemindMe — AI API Route: Daily Briefing
// POST /api/ai/briefing
// Body: { reminders: Array<{ title, time, priority, categoryId, status }>, userName?: string }
// Returns: { briefing: string, mood: 'light' | 'moderate' | 'busy' }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';
import { format } from 'date-fns';

interface BriefingReminder {
  title: string;
  time?: string;
  priority: string;
  categoryId: string;
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { reminders, userName } = await req.json() as { reminders: BriefingReminder[]; userName?: string };

    const today = format(new Date(), 'EEEE, MMMM d');
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    const reminderList = reminders.length === 0
      ? 'No reminders scheduled for today.'
      : reminders.map((r, i) =>
          `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}${r.time ? ` at ${r.time}` : ''} (${r.categoryId})`
        ).join('\n');

    const systemPrompt = `You are a friendly, smart daily assistant for a reminder app called RemindMe.
Generate a warm, personalized daily briefing for the user.

Return ONLY valid JSON (no markdown):
{
  "briefing": "2-3 sentence friendly summary in conversational tone. Include smart advice based on tasks.",
  "mood": "light | moderate | busy"
}

Rules:
- mood = "light" if 0-2 tasks, "moderate" if 3-5, "busy" if 6+
- Be warm, encouraging, human-like
- Mention urgent tasks specifically
- Keep it under 80 words
- Today is ${today}, it's ${timeOfDay}
- User name: ${userName || 'there'}`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Today's reminders:\n${reminderList}` },
    ], { temperature: 0.7, max_tokens: 200 });

    const result = parseJsonFromAI<{ briefing: string; mood: 'light' | 'moderate' | 'busy' }>(raw);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[AI briefing]', err);
    return NextResponse.json({ error: 'Briefing generation failed' }, { status: 500 });
  }
}
