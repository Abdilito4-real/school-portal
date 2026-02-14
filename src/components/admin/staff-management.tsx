'use client';

import { useState } from 'react';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function StaffManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'roles_admin');
  }, [firestore]);
  const { data: admins, isLoading: isLoadingAdmins } = useCollection<any>(adminsQuery);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newAdminUid || !newAdminEmail) return;

    setIsAdding(true);
    try {
      await setDoc(doc(firestore, 'roles_admin', newAdminUid.trim()), {
        email: newAdminEmail.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        addedBy: currentUser?.email || 'System'
      });
      toast({ title: 'Admin Added', description: `${newAdminEmail} is now an administrator.` });
      setNewAdminUid('');
      setNewAdminEmail('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to add admin', variant: 'destructive', description: "Ensure the UID and email are correct and you have permission." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!firestore || !adminToDelete || !currentUser) return;

    if (adminToDelete.id === currentUser.uid) {
        toast({ title: 'Cannot remove yourself', variant: 'destructive' });
        setAdminToDelete(null);
        return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'roles_admin', adminToDelete.id));
      toast({ title: 'Admin Removed' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to remove admin', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setAdminToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Administrator</CardTitle>
          <CardDescription>
            Grant administrative privileges to a user. You will need their Firebase UID and Email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="grid gap-4 md:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="uid">User UID</Label>
              <Input
                id="uid"
                placeholder="Firebase UID"
                value={newAdminUid}
                onChange={e => setNewAdminUid(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.com"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isAdding || !newAdminUid || !newAdminEmail}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add Admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Staff</CardTitle>
          <CardDescription>
            Users listed here have full access to the administrative dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAdmins ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : admins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No administrators found.
                  </TableCell>
                </TableRow>
              ) : (
                admins?.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {admin.email}
                            {admin.id === currentUser?.uid && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>}
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {admin.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAdminToDelete(admin)}
                        disabled={admin.id === currentUser?.uid}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all administrative privileges for <strong>{adminToDelete?.email}</strong> immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
