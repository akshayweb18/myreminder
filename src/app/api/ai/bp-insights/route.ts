// ============================================================
// RemindMe — AI API Route: BP Health Insights
// POST /api/ai/bp-insights
// Body: { readings: BpReading[], medicines?: string[], goal?: { systolic, diastolic } }
// Returns: { insights: string[], trend: 'improving' | 'stable' | 'worsening', advice: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';

interface BpReadingInput {
  systolic: number;
  diastolic: number;
  pulse: number;
  date: string;
  time: string;
  timeOfDay: string;
  category: string;
  categoryLabel: string;
}

export async function POST(req: NextRequest) {
  try {
    const { readings, medicines, goal } = await req.json() as {
      readings: BpReadingInput[];
      medicines?: string[];
      goal?: { systolic: number; diastolic: number };
    };

    if (!readings || readings.length === 0) {
      return NextResponse.json({
        insights: ['Log more BP readings to get personalized insights.'],
        trend: 'stable',
        advice: 'Start tracking your blood pressure daily for accurate insights.',
      });
    }

    const last20 = readings.slice(-20);
    const readingsSummary = last20.map((r) =>
      `${r.date} ${r.time} (${r.timeOfDay}): ${r.systolic}/${r.diastolic} mmHg, Pulse: ${r.pulse} — ${r.categoryLabel}`
    ).join('\n');

    const goalText = goal ? `Target: ${goal.systolic}/${goal.diastolic} mmHg` : 'No target set';
    const medText = medicines?.length ? `Medicines: ${medicines.join(', ')}` : 'No medicines logged';

    const systemPrompt = `You are a knowledgeable, empathetic health assistant. Analyze blood pressure readings and provide actionable insights.

IMPORTANT: You are NOT a doctor. Always remind users to consult their physician for medical decisions.

Return ONLY valid JSON (no markdown):
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "trend": "improving | stable | worsening",
  "advice": "1-2 sentence personalized lifestyle advice"
}

Rules:
- insights: 3 specific observations about patterns (time of day, weekday trends, variability)
- trend: compare recent 5 readings vs earlier readings
- advice: practical, kind, non-alarming lifestyle tips
- Never diagnose or prescribe
- Keep each insight under 80 characters`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `BP Readings (last ${last20.length}):\n${readingsSummary}\n\n${goalText}\n${medText}`,
      },
    ], { temperature: 0.4, max_tokens: 400 });

    const result = parseJsonFromAI<{
      insights: string[];
      trend: 'improving' | 'stable' | 'worsening';
      advice: string;
    }>(raw);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[AI bp-insights]', err);
    return NextResponse.json({ error: 'BP insights generation failed' }, { status: 500 });
  }
}
