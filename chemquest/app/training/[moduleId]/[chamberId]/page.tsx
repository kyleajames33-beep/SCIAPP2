'use client';

import { useParams } from 'next/navigation';
import QuizGame from '../../_components/quiz-game';
import { MODULES } from '@/lib/modules';

export default function ChamberTrainingPage() {
  const params = useParams();
  const moduleId = parseInt(params.moduleId as string);
  const chamberId = params.chamberId as string;

  const module = MODULES.find(m => m.id === moduleId);
  const chamber = module?.chambers.find(c => c.id === chamberId);

  if (!module || !chamber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Module Not Found</h1>
          <p>The requested module or chamber could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <QuizGame 
      moduleId={moduleId}
      chamberId={chamberId}
      moduleName={module.name}
      chamberName={chamber.name}
    />
  );
}
