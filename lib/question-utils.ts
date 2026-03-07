/**
 * Question Content Engine
 * Utilities for filtering, retrieving, and managing chemistry questions
 */

// Difficulty levels aligned with HSC curriculum
export type DifficultyLevel = "Foundation" | "Developing" | "Proficient" | "Mastery";

// Question interface matching the enhanced JSON structure
export interface ChemistryQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: DifficultyLevel;
  worldId: number; // 1-8 (HSC Modules)
  chamberId: string; // Specific topic identifier
  explanation: string;
  tags?: string[]; // Additional tags for filtering
  imageUrl?: string; // Optional diagram/image
}

// Question database interface
export interface QuestionDatabase {
  questions: ChemistryQuestion[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalQuestions: number;
    coverage: {
      worlds: number[];
      chambers: string[];
    };
  };
}

// World and Chamber mapping
export const WORLD_CHAMBERS: Record<number, { id: string; name: string }[]> = {
  1: [
    { id: "m1-c1", name: "Properties of Matter" },
    { id: "m1-c2", name: "Atomic Structure" },
    { id: "m1-c3", name: "Periodic Table Trends" },
    { id: "m1-c4", name: "Chemical Bonding" },
  ],
  2: [
    { id: "m2-c1", name: "The Mole Concept" },
    { id: "m2-c2", name: "Stoichiometry" },
    { id: "m2-c3", name: "Concentration & Dilution" },
    { id: "m2-c4", name: "Gas Laws" },
  ],
  3: [
    { id: "m3-c1", name: "Types of Reactions" },
    { id: "m3-c2", name: "Reaction Rates" },
    { id: "m3-c3", name: "Energy Changes" },
  ],
  4: [
    { id: "m4-c1", name: "Acids & Bases" },
    { id: "m4-c2", name: "pH Calculations" },
    { id: "m4-c3", name: "Titration" },
    { id: "m4-c4", name: "Buffer Solutions" },
  ],
  5: [
    { id: "m5-c1", name: "Redox Reactions" },
    { id: "m5-c2", name: "Electrochemical Cells" },
    { id: "m5-c3", name: "Electrolysis" },
  ],
  6: [
    { id: "m6-c1", name: "Organic Nomenclature" },
    { id: "m6-c2", name: "Hydrocarbons" },
    { id: "m6-c3", name: "Functional Groups" },
    { id: "m6-c4", name: "Reaction Pathways" },
  ],
  7: [
    { id: "m7-c1", name: "Chemical Equilibrium" },
    { id: "m7-c2", name: "Le Chatelier's Principle" },
    { id: "m7-c3", name: "Equilibrium Constants" },
  ],
  8: [
    { id: "m8-c1", name: "Radioactivity" },
    { id: "m8-c2", name: "Half-Life" },
    { id: "m8-c3", name: "Nuclear Reactions" },
  ],
};

// In-memory cache for questions
let questionCache: ChemistryQuestion[] | null = null;

/**
 * Load questions from the JSON file
 */
export async function loadQuestions(): Promise<ChemistryQuestion[]> {
  if (questionCache) return questionCache;
  
  try {
    // In a real app, this would fetch from the server
    // For now, we'll import the JSON directly
    const data = await import("@/data/chemistry_questions.json");
    questionCache = (data.questions as ChemistryQuestion[]) || [];
    return questionCache || [];
  } catch (error) {
    console.error("Failed to load questions:", error);
    return [];
  }
}

/**
 * Get all questions for a specific chamber
 */
export async function getQuestionsForChamber(
  worldId: number,
  chamberId: string
): Promise<ChemistryQuestion[]> {
  const questions = await loadQuestions();
  return questions.filter(
    (q) => q.worldId === worldId && q.chamberId === chamberId
  );
}

/**
 * Get questions filtered by difficulty level
 */
export async function getQuestionsForDifficulty(
  level: DifficultyLevel
): Promise<ChemistryQuestion[]> {
  const questions = await loadQuestions();
  return questions.filter((q) => q.difficulty === level);
}

/**
 * Get a random set of questions
 */
export async function getRandomSet(
  count: number,
  filters?: {
    worldId?: number;
    chamberId?: string;
    difficulty?: DifficultyLevel;
    excludeIds?: string[];
  }
): Promise<ChemistryQuestion[]> {
  let questions = await loadQuestions();
  
  // Apply filters
  if (filters?.worldId !== undefined) {
    questions = questions.filter((q) => q.worldId === filters.worldId);
  }
  if (filters?.chamberId) {
    questions = questions.filter((q) => q.chamberId === filters.chamberId);
  }
  if (filters?.difficulty) {
    questions = questions.filter((q) => q.difficulty === filters.difficulty);
  }
  if (filters?.excludeIds) {
    questions = questions.filter((q) => !filters.excludeIds!.includes(q.id));
  }
  
  // Shuffle and return requested count
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a balanced set of questions across difficulty levels
 * Useful for creating well-rounded quizzes
 */
export async function getBalancedSet(
  totalCount: number,
  worldId?: number,
  chamberId?: string
): Promise<ChemistryQuestion[]> {
  const filters = { worldId, chamberId };
  
  // Distribution: 20% Foundation, 30% Developing, 30% Proficient, 20% Mastery
  const distribution = {
    Foundation: Math.ceil(totalCount * 0.2),
    Developing: Math.ceil(totalCount * 0.3),
    Proficient: Math.ceil(totalCount * 0.3),
    Mastery: Math.ceil(totalCount * 0.2),
  };
  
  const result: ChemistryQuestion[] = [];
  const excludeIds: string[] = [];
  
  for (const [difficulty, count] of Object.entries(distribution)) {
    const questions = await getRandomSet(count, {
      ...filters,
      difficulty: difficulty as DifficultyLevel,
      excludeIds,
    });
    result.push(...questions);
    excludeIds.push(...questions.map((q) => q.id));
  }
  
  // Shuffle the combined result
  return result.sort(() => Math.random() - 0.5).slice(0, totalCount);
}

/**
 * Get a question by its ID
 */
export async function getQuestionById(
  id: string
): Promise<ChemistryQuestion | null> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id) || null;
}

/**
 * Search questions by text content
 */
export async function searchQuestions(
  query: string,
  filters?: {
    worldId?: number;
    chamberId?: string;
  }
): Promise<ChemistryQuestion[]> {
  const questions = await loadQuestions();
  const lowerQuery = query.toLowerCase();
  
  return questions.filter((q) => {
    // Text search
    const matchesQuery =
      q.question.toLowerCase().includes(lowerQuery) ||
      q.topic.toLowerCase().includes(lowerQuery) ||
      q.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
    
    // Apply filters
    const matchesFilters =
      (!filters?.worldId || q.worldId === filters.worldId) &&
      (!filters?.chamberId || q.chamberId === filters.chamberId);
    
    return matchesQuery && matchesFilters;
  });
}

/**
 * Get statistics about the question database
 */
export async function getQuestionStats(): Promise<{
  total: number;
  byWorld: Record<number, number>;
  byDifficulty: Record<DifficultyLevel, number>;
  byChamber: Record<string, number>;
}> {
  const questions = await loadQuestions();
  
  const stats = {
    total: questions.length,
    byWorld: {} as Record<number, number>,
    byDifficulty: {
      Foundation: 0,
      Developing: 0,
      Proficient: 0,
      Mastery: 0,
    } as Record<DifficultyLevel, number>,
    byChamber: {} as Record<string, number>,
  };
  
  for (const q of questions) {
    // Count by world
    stats.byWorld[q.worldId] = (stats.byWorld[q.worldId] || 0) + 1;
    
    // Count by difficulty
    stats.byDifficulty[q.difficulty]++;
    
    // Count by chamber
    const chamberKey = `${q.worldId}-${q.chamberId}`;
    stats.byChamber[chamberKey] = (stats.byChamber[chamberKey] || 0) + 1;
  }
  
  return stats;
}

/**
 * Validate a question object has all required fields
 */
export function validateQuestion(
  question: Partial<ChemistryQuestion>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required: (keyof ChemistryQuestion)[] = [
    "id",
    "question",
    "options",
    "correctAnswer",
    "difficulty",
    "worldId",
    "chamberId",
    "explanation",
  ];
  
  for (const field of required) {
    if (question[field] === undefined || question[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate options array
  if (question.options && question.options.length !== 4) {
    errors.push("Question must have exactly 4 options");
  }
  
  // Validate correctAnswer index
  if (
    question.correctAnswer !== undefined &&
    (question.correctAnswer < 0 || question.correctAnswer > 3)
  ) {
    errors.push("correctAnswer must be between 0 and 3");
  }
  
  // Validate worldId
  if (
    question.worldId !== undefined &&
    (question.worldId < 1 || question.worldId > 8)
  ) {
    errors.push("worldId must be between 1 and 8");
  }
  
  // Validate difficulty
  const validDifficulties: DifficultyLevel[] = [
    "Foundation",
    "Developing",
    "Proficient",
    "Mastery",
  ];
  if (
    question.difficulty &&
    !validDifficulties.includes(question.difficulty)
  ) {
    errors.push(
      `difficulty must be one of: ${validDifficulties.join(", ")}`
    );
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate a unique question ID
 */
export function generateQuestionId(
  worldId: number,
  chamberId: string,
  index: number
): string {
  return `w${worldId}-${chamberId}-q${String(index).padStart(3, "0")}`;
}
