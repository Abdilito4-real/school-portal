import AnnouncementManagement from '@/components/admin/announcement-management';

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Announcement Management</h2>
        <p className="text-muted-foreground">
          Create, view, and manage announcements for students.
        </p>
      </div>
      <AnnouncementManagement />
    </div>
  );
}
