import FeesView from '@/components/student/fees-view';

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">My Fee Status</h2>
        <p className="text-muted-foreground">
          Check your current fee status and payment history.
        </p>
      </div>
      <FeesView />
    </div>
  );
}
