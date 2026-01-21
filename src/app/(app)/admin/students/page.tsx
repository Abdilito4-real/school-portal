import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6 flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>This page has been removed</CardTitle>
                <CardDescription>
                    To provide a more organized experience, students are now managed within their respective classes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Please go to the Classes page to select a class and view its students.
                </p>
                <Button asChild>
                    <Link href="/admin/classes">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go to Classes
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
