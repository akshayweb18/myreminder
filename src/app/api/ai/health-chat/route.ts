// ============================================================
// RemindMe — AI API Route: Health Chatbot
// POST /api/ai/health-chat
// Body: { message: string, history: [{role, content}], readings[], medicines[], goal }
// Returns: { reply: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, NvidiaMessage, parseJsonFromAI } from '@/lib/nvidia';
import { format } from 'date-fns';

interface BpReadingInput {
  systolic: number;
  diastolic: number;
  pulse: number;
  date: string;
  time: string;
  timeOfDay: string;
  categoryLabel: string;
}

interface MedicineInput {
  name: string;
  dosage: string;
  frequency: string;
  active: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, readings, medicines, goal } = await req.json() as {
      message: string;
      history: { role: 'user' | 'assistant'; content: string }[];
      readings: BpReadingInput[];
      medicines: MedicineInput[];
      goal?: { systolic: number; diastolic: number };
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Build context from user's actual data
    const avgSys = readings.length ? Math.round(readings.reduce((s, r) => s + r.systolic, 0) / readings.length) : null;
    const avgDia = readings.length ? Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length) : null;

    const recentReadings = readings.slice(-10).map(r =>
      `${r.date} ${r.time}: ${r.systolic}/${r.diastolic} mmHg, Pulse: ${r.pulse} (${r.categoryLabel})`
    ).join('\n');

    const activeMeds = medicines.filter(m => m.active).map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(', ');

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

    const systemPrompt = `You are a friendly, highly intelligent AI assistant for the RemindMe AI app.
You can answer ANY question the user asks.

Today's date is ${today}. Tomorrow is ${tomorrow}.

If the user wants to create/schedule a reminder or task (e.g. "Remind me to call John tomorrow", "Remind me to take medicine at 8pm", "Meeting add karo 9 am tomorrow", etc.), you should recognize this intent and include an action object in your response.

You MUST return ONLY a valid JSON object matching this structure:
{
  "reply": "your text response to the user. Explain clearly that you have scheduled the reminder for them.",
  "action": null | {
    "type": "create_reminder",
    "reminder": {
      "title": "short reminder title (max 50 chars)",
      "date": "YYYY-MM-DD",
      "time": "HH:MM (24h format, or null if no time specified)",
      "priority": "low | medium | high | urgent",
      "categoryId": "health | work | personal | finance | shopping | travel | fitness",
      "emoji": "single relevant emoji",
      "description": "optional description"
    }
  }
}

USER'S HEALTH DATA (Only use if they ask about health/BP):
- Total BP Readings: ${readings.length}
- Average BP: ${avgSys ?? 'No data'}/${avgDia ?? 'No data'} mmHg
- Current Medications: ${activeMeds || 'None'}
- BP Goal: ${goal ? `${goal.systolic}/${goal.diastolic} mmHg` : 'Not set'}

Rules:
1. Always reply in the same language as the user (Hindi/Hinglish/English).
2. Keep responses warm and engaging.
3. If they ask a general question (e.g. "Tell me a joke"), set action to null and answer it in "reply".
4. Never include markdown fences (like \`\`\`json) in the response. Return raw JSON.`;

    const messages: NvidiaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const raw = await nvidiaChat(messages, { temperature: 0.3, max_tokens: 500 });

    try {
      const parsed = parseJsonFromAI<{
        reply: string;
        action?: {
          type: 'create_reminder';
          reminder: {
            title: string;
            date: string;
            time?: string;
            priority: 'low' | 'medium' | 'high' | 'urgent';
            categoryId: string;
            emoji?: string;
            description?: string;
          };
        };
      }>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ reply: raw.trim() });
    }
  } catch (err) {
    console.error('[AI health-chat]', err);
    return NextResponse.json({ error: 'Chat response failed' }, { status: 500 });
  }
}
