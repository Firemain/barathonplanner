
import ResultsPage from '@/components/ResultsPage';
import { Suspense } from 'react';

export default function Results() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ResultsPage />
    </Suspense>
  );
}