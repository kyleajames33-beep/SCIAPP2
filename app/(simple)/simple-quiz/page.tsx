'use client';

import { useState, useEffect } from 'react';
import { getRandomQuestion, Question } from '@/lib/questions-supabase';

// Simple inline styles to avoid Tailwind completely
const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '28px',
    marginBottom: '30px',
    textAlign: 'center' as const,
    color: '#333',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  questionText: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '20px',
    color: '#212529',
  },
  options: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  optionButton: {
    padding: '15px',
    fontSize: '16px',
    textAlign: 'left' as const,
    backgroundColor: '#fff',
    border: '2px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  optionButtonHover: {
    backgroundColor: '#e9ecef',
    borderColor: '#adb5bd',
  },
  correctAnswer: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  wrongAnswer: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  nextButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  result: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '16px',
  },
  metadata: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#6c757d',
  },
};

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
      <div style={styles.container}>
        <h1 style={styles.title}>ChemQuest - Simple Quiz</h1>
        <div style={styles.loading}>Loading question...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>ChemQuest - Simple Quiz</h1>
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={fetchQuestion} style={styles.nextButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>ChemQuest - Simple Quiz</h1>
        <div style={styles.error}>No question found</div>
        <button onClick={fetchQuestion} style={styles.nextButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ChemQuest - Simple Quiz</h1>
      
      <div style={styles.questionCard}>
        <div style={styles.questionText}>
          {question.question}
        </div>
        
        <div style={styles.options}>
          {[0, 1, 2, 3].map((index) => {
            const isSelected = selectedOption === index;
            const isCorrect = question.correctAnswer === index;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;
            
            let buttonStyle = { ...styles.optionButton };
            if (showCorrect) {
              buttonStyle = { ...buttonStyle, ...styles.correctAnswer };
            } else if (showWrong) {
              buttonStyle = { ...buttonStyle, ...styles.wrongAnswer };
            }
            
            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                style={buttonStyle}
                disabled={showResult}
              >
                <strong>{getOptionLabel(index)}.</strong> {getOptionText(index)}
              </button>
            );
          })}
        </div>
        
        {showResult && (
          <div style={{
            ...styles.result,
            ...(selectedOption === question.correctAnswer ? styles.correctAnswer : styles.wrongAnswer),
          }}>
            {selectedOption === question.correctAnswer 
              ? '✅ Correct! Well done!' 
              : `❌ Wrong! The correct answer is ${getOptionLabel(question.correctAnswer)}.`}
          </div>
        )}
        
        {showResult && question.explanation && (
          <div style={styles.metadata}>
            <strong>Explanation:</strong> {question.explanation}
          </div>
        )}
        
        <div style={styles.metadata}>
          <strong>Topic:</strong> {question.topic} | 
          <strong> Difficulty:</strong> {question.difficulty} | 
          <strong> Subject:</strong> {question.subject}
        </div>
      </div>
      
      <button onClick={fetchQuestion} style={styles.nextButton}>
        Next Question
      </button>
    </div>
  );
}
