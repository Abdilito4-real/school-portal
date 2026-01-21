import ResultsView from '@/components/student/results-view';

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">My Academic Results</h2>
        <p className="text-muted-foreground">
          View your grades and academic performance by term and year.
        </p>
      </div>
      <ResultsView />
    </div>
  );
}
