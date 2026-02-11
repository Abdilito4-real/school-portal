'use client';

import { useState, useMemo } from 'react';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Trash2, ShieldCheck, ShieldAlert, Edit, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import type { Class } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AdminRole {
    id: string;
    email?: string;
    isSuperAdmin?: boolean;
    classIds?: string[];
    createdAt?: any;
}

export default function StaffManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useAuth();

    const [newAdminUid, setNewAdminUid] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
    const [newAssignedClassIds, setNewAssignedClassIds] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<AdminRole | null>(null);
    const [adminToEdit, setAdminToEdit] = useState<AdminRole | null>(null);

    const rolesQuery = useMemoFirebase(() => {
        if (!firestore || !user || user.role !== 'admin') return null;
        return collection(firestore, 'roles_admin');
    }, [firestore, user]);

    const { data: admins, isLoading, error } = useCollection<AdminRole>(rolesQuery);

    const classesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'classes');
    }, [firestore]);
    const { data: classes } = useCollection<Class>(classesQuery);

    const isBootstrapAdmin = user?.email === 'admin@example.com';
    const currentAdminInDb = useMemo(() => admins?.find(a => a.id === user?.uid), [admins, user?.uid]);
    const isSuperAdmin = isBootstrapAdmin || currentAdminInDb?.isSuperAdmin === true;

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !newAdminUid || !isSuperAdmin) return;

        setIsSubmitting(true);
        try {
            await setDoc(doc(firestore, 'roles_admin', newAdminUid), {
                email: newAdminEmail,
                isSuperAdmin: newIsSuperAdmin,
                classIds: newIsSuperAdmin ? [] : newAssignedClassIds,
                createdAt: serverTimestamp(),
                addedBy: user?.uid
            });
            toast({ title: 'Admin Added', description: 'The user now has administrative privileges.' });
            setNewAdminUid('');
            setNewAdminEmail('');
            setNewIsSuperAdmin(false);
            setNewAssignedClassIds([]);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to add admin', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateAdmin = async () => {
        if (!firestore || !adminToEdit || !isSuperAdmin) return;
        setIsSubmitting(true);
        try {
            await setDoc(doc(firestore, 'roles_admin', adminToEdit.id), {
                ...adminToEdit,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: 'Admin Updated' });
            setAdminToEdit(null);
        } catch (error) {
            console.error(error);
            toast({ title: 'Update failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveAdmin = async () => {
        if (!firestore || !adminToDelete || !isSuperAdmin) return;

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
                isSuperAdmin: true,
                classIds: [],
                createdAt: serverTimestamp(),
                note: 'Bootstrap admin claim'
            });
            toast({ title: 'Role Claimed', description: 'You are now a permanent super administrator.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to claim role', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleClass = (classId: string, currentList: string[], setList: (ids: string[]) => void) => {
        if (currentList.includes(classId)) {
            setList(currentList.filter(id => id !== classId));
        } else {
            setList([...currentList, classId]);
        }
    };

    if (!isSuperAdmin && !isLoading) {
        return (
            <div className="p-8 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold">Access Denied</h3>
                <p className="text-muted-foreground">Only Super Administrators can manage staff roles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Staff Management</h2>
                    <p className="text-muted-foreground">
                        Manage administrative roles and class assignments.
                    </p>
                </div>
                {isBootstrapAdmin && !currentAdminInDb && (
                    <Button onClick={handleClaimAdmin} variant="default" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Claim Permanent Super Admin Role
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Administrators</CardTitle>
                        <CardDescription>Users with administrative access and their assigned classes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Assigned Classes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-destructive">
                                            <ShieldAlert className="mx-auto h-6 w-6 mb-2" />
                                            Error loading admins: {error.message}
                                        </TableCell>
                                    </TableRow>
                                ) : !admins || admins.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No administrators found in the database.
                                        </TableCell>
                                    </TableRow>
                                ) : admins.map(admin => (
                                    <TableRow key={admin.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{admin.email || 'No Email'}</span>
                                                <span className="font-mono text-[10px] text-muted-foreground">{admin.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {admin.isSuperAdmin ? (
                                                <Badge variant="default">Super Admin</Badge>
                                            ) : (
                                                <Badge variant="secondary">Class Admin</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {admin.isSuperAdmin ? (
                                                    <span className="text-xs text-muted-foreground italic">All Classes</span>
                                                ) : !admin.classIds || admin.classIds.length === 0 ? (
                                                    <span className="text-xs text-destructive italic">No Classes Assigned</span>
                                                ) : (
                                                    admin.classIds.map(cid => {
                                                        const cls = classes?.find(c => c.id === cid);
                                                        return (
                                                            <Badge key={cid} variant="outline" className="text-[10px]">
                                                                {cls?.name || cid}
                                                            </Badge>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setAdminToEdit(admin)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setAdminToDelete(admin)}
                                                    disabled={admin.id === user?.uid}
                                                    title={admin.id === user?.uid ? "You cannot remove yourself" : "Remove Admin"}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
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
                            <div className="flex items-center space-x-2 py-2">
                                <Checkbox
                                    id="superadmin"
                                    checked={newIsSuperAdmin}
                                    onCheckedChange={(checked) => setNewIsSuperAdmin(checked === true)}
                                />
                                <label htmlFor="superadmin" className="text-sm font-medium leading-none cursor-pointer">
                                    Super Administrator (Full Access)
                                </label>
                            </div>

                            {!newIsSuperAdmin && (
                                <div className="space-y-3 border rounded-md p-3">
                                    <label className="text-sm font-semibold">Assign Classes</label>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {classes?.map(cls => (
                                            <div key={cls.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`class-${cls.id}`}
                                                    checked={newAssignedClassIds.includes(cls.id)}
                                                    onCheckedChange={() => toggleClass(cls.id, newAssignedClassIds, setNewAssignedClassIds)}
                                                />
                                                <label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer truncate">
                                                    {cls.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isSubmitting || !newAdminUid}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Add Admin
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Admin Dialog */}
            <Dialog open={!!adminToEdit} onOpenChange={(open) => !open && setAdminToEdit(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Admin Permissions</DialogTitle>
                        <DialogDescription>
                            Update roles and class assignments for {adminToEdit?.email || 'this admin'}.
                        </DialogDescription>
                    </DialogHeader>
                    {adminToEdit && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-superadmin"
                                    checked={adminToEdit.isSuperAdmin}
                                    onCheckedChange={(checked) => setAdminToEdit({...adminToEdit, isSuperAdmin: checked === true, classIds: checked === true ? [] : adminToEdit.classIds})}
                                />
                                <label htmlFor="edit-superadmin" className="text-sm font-medium leading-none cursor-pointer">
                                    Super Administrator (Full Access)
                                </label>
                            </div>

                            {!adminToEdit.isSuperAdmin && (
                                <div className="space-y-3 border rounded-md p-3">
                                    <label className="text-sm font-semibold">Assigned Classes</label>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {classes?.map(cls => (
                                            <div key={cls.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-class-${cls.id}`}
                                                    checked={adminToEdit.classIds?.includes(cls.id)}
                                                    onCheckedChange={() => toggleClass(cls.id, adminToEdit.classIds || [], (ids) => setAdminToEdit({...adminToEdit, classIds: ids}))}
                                                />
                                                <label htmlFor={`edit-class-${cls.id}`} className="text-sm cursor-pointer truncate">
                                                    {cls.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdminToEdit(null)}>Cancel</Button>
                        <Button onClick={handleUpdateAdmin} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
