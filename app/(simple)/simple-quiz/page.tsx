'use client';

import { useState, useEffect } from 'react';
import { getRandomQuestion, Question } from '@/lib/questions-supabase';

export default function SimpleQuizPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setShowResult(false);

    console.log('[SIMPLE-QUIZ] Fetching question...');
    const { question, error } = await getRandomQuestion();

    if (error) {
      console.error('[SIMPLE-QUIZ] Error:', error);
      setError(error);
    } else {
      console.log('[SIMPLE-QUIZ] Question loaded:', question?.id);
      setQuestion(question);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleOptionClick = (optionIndex: number) => {
    if (showResult) return;
    
    setSelectedOption(optionIndex);
    setShowResult(true);
    
    const isCorrect = optionIndex === question?.correctAnswer;
    console.log('[SIMPLE-QUIZ] Selected:', optionIndex, 'Correct:', question?.correctAnswer, 'IsCorrect:', isCorrect);
  };

  const getOptionLabel = (index: number): string => {
    const labels = ['A', 'B', 'C', 'D'];
    return labels[index] || '';
  };

  const getOptionText = (index: number): string => {
    if (!question) return '';
    const options = [question.optionA, question.optionB, question.optionC, question.optionD];
    return options[index] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8 text-blue-400">ChemQuest Quiz</h1>
          <div className="text-slate-400 text-lg">Loading question...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">ChemQuest Quiz</h1>
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={fetchQuestion}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">ChemQuest Quiz</h1>
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
            No question found
          </div>
          <button 
            onClick={fetchQuestion}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">ChemQuest Quiz</h1>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="text-lg font-semibold mb-6 text-slate-100 leading-relaxed">
            {question.question}
          </div>
          
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => {
              const isSelected = selectedOption === index;
              const isCorrect = question.correctAnswer === index;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;
              
              let buttonClass = 'w-full text-left p-4 rounded-xl border-2 transition-all font-medium ';
              
              if (showCorrect) {
                buttonClass += 'bg-green-500/20 border-green-500 text-green-400';
              } else if (showWrong) {
                buttonClass += 'bg-red-500/20 border-red-500 text-red-400';
              } else if (isSelected) {
                buttonClass += 'bg-blue-500/20 border-blue-500 text-blue-400';
              } else {
                buttonClass += 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500';
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <span className="font-bold mr-2">{getOptionLabel(index)}.</span>
                  {getOptionText(index)}
                </button>
              );
            })}
          </div>
          
          {showResult && (
            <div className={`mt-6 p-4 rounded-xl font-medium ${
              selectedOption === question.correctAnswer 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {selectedOption === question.correctAnswer 
                ? '✅ Correct! Well done!' 
                : `❌ Wrong! The correct answer is ${getOptionLabel(question.correctAnswer)}.`}
            </div>
          )}
          
          {showResult && question.explanation && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-xl text-slate-300 text-sm">
              <strong className="text-slate-200">Explanation:</strong> {question.explanation}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-slate-700/30 rounded-xl text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Topic:</span> {question.topic} {' '}
            <span className="mx-2">|</span>
            <span className="text-slate-300 font-medium">Difficulty:</span> {question.difficulty} {' '}
            <span className="mx-2">|</span>
            <span className="text-slate-300 font-medium">Subject:</span> {question.subject}
          </div>
        </div>
        
        <button 
          onClick={fetchQuestion}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/25"
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
