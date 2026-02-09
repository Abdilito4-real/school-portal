'use client';

import { useState, useMemo } from 'react';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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

interface AdminRole {
    id: string;
    email?: string;
    createdAt?: any;
}

export default function StaffManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useAuth();

    const [newAdminUid, setNewAdminUid] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<AdminRole | null>(null);

    const rolesQuery = useMemoFirebase(() => {
        if (!firestore || !user || user.role !== 'admin') return null;
        return collection(firestore, 'roles_admin');
    }, [firestore, user]);

    const { data: admins, isLoading } = useCollection<AdminRole>(rolesQuery);

    const isBootstrapAdmin = user?.email === 'admin@example.com';
    const isAlreadyPermanentAdmin = useMemo(() => {
        return admins?.some(admin => admin.id === user?.uid);
    }, [admins, user?.uid]);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !newAdminUid) return;

        setIsSubmitting(true);
        try {
            await setDoc(doc(firestore, 'roles_admin', newAdminUid), {
                email: newAdminEmail,
                createdAt: serverTimestamp(),
                addedBy: user?.uid
            });
            toast({ title: 'Admin Added', description: 'The user now has administrative privileges.' });
            setNewAdminUid('');
            setNewAdminEmail('');
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to add admin', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveAdmin = async () => {
        if (!firestore || !adminToDelete) return;

        try {
            await deleteDoc(doc(firestore, 'roles_admin', adminToDelete.id));
            toast({ title: 'Admin Removed', description: 'Administrative privileges revoked.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to remove admin', variant: 'destructive' });
        } finally {
            setAdminToDelete(null);
        }
    };

    const handleClaimAdmin = async () => {
        if (!firestore || !user || !isBootstrapAdmin) return;

        setIsSubmitting(true);
        try {
            await setDoc(doc(firestore, 'roles_admin', user.uid), {
                email: user.email,
                createdAt: serverTimestamp(),
                note: 'Bootstrap admin claim'
            });
            toast({ title: 'Role Claimed', description: 'You are now a permanent administrator.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to claim role', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Staff Management</h2>
                    <p className="text-muted-foreground">
                        Manage administrative roles and permissions.
                    </p>
                </div>
                {isBootstrapAdmin && !isAlreadyPermanentAdmin && (
                    <Button onClick={handleClaimAdmin} variant="default" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Claim Permanent Admin Role
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Administrators</CardTitle>
                        <CardDescription>A list of users with administrative access.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>UID</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : !admins || admins.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                            No administrators found in the database.
                                        </TableCell>
                                    </TableRow>
                                ) : admins.map(admin => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                                        <TableCell>{admin.email || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setAdminToDelete(admin)}
                                                disabled={admin.id === user?.uid}
                                                title={admin.id === user?.uid ? "You cannot remove yourself" : "Remove Admin"}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Admin</CardTitle>
                        <CardDescription>Grant administrative access to a user UID.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">User UID</label>
                                <Input
                                    placeholder="Enter Firebase UID"
                                    value={newAdminUid}
                                    onChange={e => setNewAdminUid(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email (Optional)</label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={newAdminEmail}
                                    onChange={e => setNewAdminEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting || !newAdminUid}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Add Admin
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Admin Privileges?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove administrative access for this user? They will no longer be able to manage the campus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
