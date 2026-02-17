import { NextResponse } from 'next/server';
import chemistryQuestions from '@/data/chemistry_questions.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Filter questions for World 9 (boss battle)
    const world9Questions = (chemistryQuestions.questions as any[]).filter(
      (q) => q.worldId === 9 && q.chamberId === 'boss-battle'
    );

    // If no World 9 questions found, return error
    if (world9Questions.length === 0) {
      return NextResponse.json(
        { error: 'No World 9 questions found' },
        { status: 404 }
      );
    }

    // Shuffle and take first 10 questions
    const shuffled = [...world9Questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    // Transform to Question format
    const questions = selected.map((q) => ({
      id: q.id,
      question: q.question,
      optionA: q.options[0],
      optionB: q.options[1],
      optionC: q.options[2],
      optionD: q.options[3],
      correctAnswer: q.correctAnswer,
      topic: q.topic || 'World 9 Boss',
      difficulty: q.difficulty || 'Mastery',
      explanation: q.explanation,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching World 9 questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
