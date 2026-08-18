// ============================================================
// RemindMe — AI API Route: Smart Schedule Optimizer
// POST /api/ai/optimize-schedule
// Body: { reminders: [{id, title, time, completedAt, categoryId}] }
// Returns: { suggestions: [{reminderId, title, currentTime, suggestedTime, reason}] }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';

interface ReminderInput {
  id: string;
  title: string;
  time?: string;
  completedAt?: string;
  categoryId: string;
  priority: string;
}

export async function POST(req: NextRequest) {
  try {
    const { reminders } = await req.json() as { reminders: ReminderInput[] };

    if (!reminders || reminders.length < 3) {
      return NextResponse.json({ suggestions: [], message: 'Need at least 3 completed reminders for pattern analysis.' });
    }

    // Only analyze reminders with both a scheduled time and a completedAt
    const analyzable = reminders.filter(r => r.time && r.completedAt);

    if (analyzable.length < 2) {
      return NextResponse.json({ suggestions: [], message: 'Complete more timed reminders to unlock smart scheduling.' });
    }

    // Calculate actual completion times vs scheduled times
    const patternData = analyzable.slice(-20).map(r => {
      const completedDate = new Date(r.completedAt!);
      const actualTime = `${completedDate.getHours().toString().padStart(2, '0')}:${completedDate.getMinutes().toString().padStart(2, '0')}`;
      const scheduledHour = parseInt(r.time!.split(':')[0]);
      const actualHour = completedDate.getHours();
      const diffMinutes = (actualHour * 60 + completedDate.getMinutes()) - (scheduledHour * 60 + parseInt(r.time!.split(':')[1]));
      return {
        id: r.id,
        title: r.title,
        scheduledTime: r.time,
        actualTime,
        diffMinutes,
        category: r.categoryId,
      };
    });

    const summaryText = patternData.map(p =>
      `"${p.title}" (${p.category}): scheduled ${p.scheduledTime}, completed at ${p.actualTime} (${p.diffMinutes > 0 ? '+' : ''}${p.diffMinutes} min)`
    ).join('\n');

    const systemPrompt = `You are a smart scheduling AI. Analyze reminder completion patterns and suggest optimal times.

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "reminderId": "id from input",
      "title": "reminder title",
      "currentTime": "HH:MM",
      "suggestedTime": "HH:MM",
      "reason": "Brief explanation why this time works better for user"
    }
  ],
  "insight": "1 sentence overall behavioral insight about the user's schedule patterns"
}

Rules:
- Only suggest changes where actual completion is consistently 30+ minutes different from scheduled time
- Round suggested times to nearest 15-minute mark
- Limit to top 3 most impactful suggestions
- If patterns are already well-aligned, return empty suggestions array
- Reasons should be friendly and encouraging`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze these completion patterns:\n\n${summaryText}` },
    ], { temperature: 0.3, max_tokens: 400 });

    const result = parseJsonFromAI<{
      suggestions: {
        reminderId: string;
        title: string;
        currentTime: string;
        suggestedTime: string;
        reason: string;
      }[];
      insight: string;
    }>(raw);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[AI optimize-schedule]', err);
    return NextResponse.json({ error: 'Schedule optimization failed' }, { status: 500 });
  }
}
