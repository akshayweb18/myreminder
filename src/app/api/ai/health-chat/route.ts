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

    const systemPrompt = `You are a friendly, knowledgeable AI health assistant for the RemindMe app. You help users understand their blood pressure data and health patterns.

USER'S HEALTH DATA (for personalized responses):
- Total BP Readings: ${readings.length}
- Average BP: ${avgSys ?? 'No data'}/${avgDia ?? 'No data'} mmHg
- Current Medications: ${activeMeds || 'None'}
- BP Goal: ${goal ? `${goal.systolic}/${goal.diastolic} mmHg` : 'Not set'}
- Recent Readings (last 10):
${recentReadings || 'No readings yet'}

GUIDELINES:
1. Always be warm, supportive, and conversational
2. Answer in the same language as the user (Hindi/Hinglish/English)
3. Use the user's actual BP data to give personalized answers
4. NEVER diagnose diseases or prescribe medicines
5. For serious concerns, always recommend seeing a doctor
6. Keep responses concise (2-4 sentences usually)
7. Use simple language, avoid medical jargon
8. Add relevant emojis to make responses friendly

DISCLAIMER: Always add "Apne doctor se zaroor milein" or "Consult your doctor" when discussing specific health concerns.`;

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
