import { NextRequest, NextResponse } from 'next/server';
import chemistryQuestions from '@/data/chemistry_questions.json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');
    const chamberId = searchParams.get('chamberId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!worldId) {
      return NextResponse.json(
        { error: 'Missing worldId parameter' },
        { status: 400 }
      );
    }

    const worldIdNum = parseInt(worldId);

    // Filter questions by worldId and optionally chamberId
    let filteredQuestions = (chemistryQuestions.questions as any[]).filter(
      (q) => q.worldId === worldIdNum
    );

    if (chamberId) {
      filteredQuestions = filteredQuestions.filter(
        (q) => q.chamberId === chamberId
      );
    }

    if (filteredQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this module/chamber' },
        { status: 404 }
      );
    }

    // Shuffle questions and take limit
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

    // Transform to the expected format
    const questions = selected.map((q) => ({
      id: q.id,
      question: q.question,
      optionA: q.options?.[0] || '',
      optionB: q.options?.[1] || '',
      optionC: q.options?.[2] || '',
      optionD: q.options?.[3] || '',
      correctAnswer: q.correctAnswer,
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Medium',
      explanation: q.explanation || '',
      worldId: q.worldId,
      chamberId: q.chamberId,
    }));

    return NextResponse.json({ 
      questions,
      total: filteredQuestions.length,
      worldId: worldIdNum,
      chamberId: chamberId || null,
    });
  } catch (error) {
    console.error('Error fetching module questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
