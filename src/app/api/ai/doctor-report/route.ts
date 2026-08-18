// ============================================================
// RemindMe — AI API Route: Doctor Report Generator
// POST /api/ai/doctor-report
// Body: { readings[], medicines[], goal, period: '7d' | '30d' | '90d' }
// Returns: { summary, avgSystolic, avgDiastolic, avgPulse, classification, medications, recommendations, morningAvg, eveningAvg, worstReadings, bestReadings, adherenceScore }
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
  notes?: string;
}

interface MedicineInput {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  active: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { readings, medicines, goal, period } = await req.json() as {
      readings: BpReadingInput[];
      medicines: MedicineInput[];
      goal?: { systolic: number; diastolic: number };
      period: '7d' | '30d' | '90d';
    };

    if (!readings || readings.length === 0) {
      return NextResponse.json({ error: 'No readings to generate report from' }, { status: 400 });
    }

    // Calculate stats for context
    const avgSys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / readings.length);
    const avgDia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length);
    const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse, 0) / readings.length);
    const maxSys = Math.max(...readings.map(r => r.systolic));
    const minSys = Math.min(...readings.map(r => r.systolic));

    const morningReadings = readings.filter(r => r.timeOfDay === 'morning');
    const eveningReadings = readings.filter(r => r.timeOfDay === 'evening');
    const morningAvgSys = morningReadings.length ? Math.round(morningReadings.reduce((s, r) => s + r.systolic, 0) / morningReadings.length) : null;
    const eveningAvgSys = eveningReadings.length ? Math.round(eveningReadings.reduce((s, r) => s + r.systolic, 0) / eveningReadings.length) : null;

    const readingsSummary = readings.slice(-20).map(r =>
      `${r.date} ${r.time} (${r.timeOfDay}): ${r.systolic}/${r.diastolic} mmHg, Pulse: ${r.pulse} — ${r.categoryLabel}`
    ).join('\n');

    const medText = medicines.length
      ? medicines.map(m => `${m.name} ${m.dosage} (${m.frequency})${m.active ? '' : ' [stopped]'}`).join(', ')
      : 'No medications';

    const goalText = goal ? `Target: ${goal.systolic}/${goal.diastolic} mmHg` : 'No target set';
    const periodLabel = period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'Last 3 months';

    const systemPrompt = `You are a cardiologist-level clinical report generator AI.
Generate a professional blood pressure report for doctor review.

IMPORTANT: This is informational only. Always recommend consulting a physician.

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence clinical summary for the doctor",
  "classification": "Normal | Elevated | Hypertension Stage 1 | Hypertension Stage 2 | Hypertensive Crisis",
  "trend": "improving | stable | worsening",
  "morningEveningPattern": "Brief note on AM vs PM patterns",
  "medicationNotes": "Brief assessment of medication effectiveness",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "urgencyLevel": "routine | soon | urgent",
  "adherenceNote": "Note on measurement consistency"
}`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Period: ${periodLabel}\nTotal Readings: ${readings.length}\nAverage BP: ${avgSys}/${avgDia} mmHg\nAverage Pulse: ${avgPulse} bpm\nHighest Systolic: ${maxSys} | Lowest: ${minSys}\nMorning Avg: ${morningAvgSys ?? 'N/A'} | Evening Avg: ${eveningAvgSys ?? 'N/A'}\n${goalText}\nMedications: ${medText}\n\nRecent Readings:\n${readingsSummary}`,
      },
    ], { temperature: 0.3, max_tokens: 600 });

    const aiResult = parseJsonFromAI<{
      summary: string;
      classification: string;
      trend: string;
      morningEveningPattern: string;
      medicationNotes: string;
      recommendations: string[];
      urgencyLevel: 'routine' | 'soon' | 'urgent';
      adherenceNote: string;
    }>(raw);

    return NextResponse.json({
      ...aiResult,
      stats: {
        avgSystolic: avgSys,
        avgDiastolic: avgDia,
        avgPulse,
        totalReadings: readings.length,
        maxSystolic: maxSys,
        minSystolic: minSys,
        morningAvgSys,
        eveningAvgSys,
        period: periodLabel,
      },
      medications: medicines,
      goal,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AI doctor-report]', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
