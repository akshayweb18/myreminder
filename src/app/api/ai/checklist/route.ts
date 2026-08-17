// ============================================================
// RemindMe — AI API Route: Checklist Generator
// POST /api/ai/checklist
// Body: { title: string, categoryId?: string }
// Returns: { items: Array<{ id, text, completed }> }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { nvidiaChat, parseJsonFromAI } from '@/lib/nvidia';

export async function POST(req: NextRequest) {
  try {
    const { title, categoryId } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const systemPrompt = `You are a productivity assistant. Generate a smart, practical checklist for a reminder task.

Return ONLY a valid JSON array (no markdown) of 3–7 checklist items:
[
  { "id": "1", "text": "action item", "completed": false },
  ...
]

Rules:
- Items must be specific, actionable, and relevant to the task
- Keep each item under 50 characters
- No duplicate or redundant items
- Consider the category: ${categoryId || 'general'}
- Return raw JSON array only, no explanations`;

    const raw = await nvidiaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate checklist for: "${title}"` },
    ], { temperature: 0.5, max_tokens: 300 });

    const items = parseJsonFromAI<{ id: string; text: string; completed: boolean }[]>(raw);
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[AI checklist]', err);
    return NextResponse.json({ error: 'Checklist generation failed' }, { status: 500 });
  }
}
