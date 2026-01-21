import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Announcement, Class } from '@/lib/types';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

type AnnouncementCardProps = {
  announcement: Announcement;
  classes: Class[];
};

export default function AnnouncementCard({ announcement, classes }: AnnouncementCardProps) {
  
  const getTargetAudience = (classIds: string[]) => {
    if (classIds.length === classes.length) {
      return 'All Students';
    }
    const classNames = classIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean);
    if (classNames.length > 2) {
      return `${classNames.slice(0, 2).join(', ')} & ${classNames.length - 2} more`;
    }
    return classNames.join(', ');
  }

  return (
    <Card className="flex flex-col transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="text-xl font-headline">{announcement.title}</CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{announcement.createdAt ? format(announcement.createdAt.toDate(), 'PPP') : 'Just now'}</span>
            </div>
            <Badge variant={announcement.classIds.length === classes.length ? 'secondary' : 'default'}>
                <Users className="mr-1 h-3 w-3" />
                {getTargetAudience(announcement.classIds)}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{announcement.content}</p>
      </CardContent>
    </Card>
  );
}
