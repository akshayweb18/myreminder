// ============================================================
// RemindMe — AI API Route: Health Chatbot
// POST /api/ai/health-chat
// Body: { message: string, history: [{role, content}], readings[], medicines[], goal }
// Returns: { reply: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, NvidiaMessage } from '@/lib/nvidia';

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

    const systemPrompt = `You are a friendly, highly intelligent, general-purpose AI assistant for the RemindMe AI app.
You can answer ANY question the user asks, including general knowledge, writing tasks, daily life questions, brainstorming, coding, and medical or health concerns.

USER'S HEALTH DATA (Reference this ONLY if the user asks about their health, blood pressure, or medications):
- Total BP Readings: ${readings.length}
- Average BP: ${avgSys ?? 'No data'}/${avgDia ?? 'No data'} mmHg
- Current Medications: ${activeMeds || 'None'}
- BP Goal: ${goal ? `${goal.systolic}/${goal.diastolic} mmHg` : 'Not set'}
- Recent Readings (last 10):
${recentReadings || 'No readings yet'}

GUIDELINES:
1. Be extremely helpful, engaging, and conversational.
2. Answer in the same language as the user (Hindi/Hinglish/English/etc.).
3. You are fully capable of general knowledge, writing emails, coding, planning schedules, telling jokes, or just casual chatting.
4. IF AND ONLY IF the user asks specifically about their health/BP, reference their health data and append a friendly warning: "Apne doctor se zaroor milein" / "Consult your doctor". Do NOT add this disclaimer for non-health/general chats.
5. Keep responses concise, clear, and friendly with emojis.`;

    const messages: NvidiaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const reply = await nvidiaChat(messages, { temperature: 0.6, max_tokens: 400 });

    return NextResponse.json({ reply: reply.trim() });
  } catch (err) {
    console.error('[AI health-chat]', err);
    return NextResponse.json({ error: 'Chat response failed' }, { status: 500 });
  }
}
