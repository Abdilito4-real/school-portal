import ClassManagement from '@/components/admin/class-management';

export default function AdminClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Class Management</h2>
        <p className="text-muted-foreground">
          Select a class to view and manage its students, or create a new class.
        </p>
      </div>
      <ClassManagement />
    </div>
  );
}
