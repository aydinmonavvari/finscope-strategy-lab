import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const strategies = await db.strategy.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: strategies });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const strategy = await db.strategy.create({
      data: {
        name: body.name || 'Untitled Strategy',
        description: body.description || '',
        type: body.type || 'custom',
        definition: JSON.stringify(body.definition || {}),
        parameters: JSON.stringify(body.parameters || {}),
        authorId: body.authorId || 'demo-user',
      },
    });
    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Create failed' },
      { status: 500 }
    );
  }
}
