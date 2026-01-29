'use client';

import { useState } from 'react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Student, FeeRecord } from '@/lib/types';
import { format } from 'date-fns';

export default function FeeManagementDialog({ student, onClose }: { student: Student; onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch student's specific fee records
    const feesColRef = useMemoFirebase(() => collection(firestore, 'users', student.id, 'fees'), [firestore, student.id]);
    const { data: feeRecords, isLoading } = useCollection<FeeRecord>(feesColRef);

    const currentFee = feeRecords?.[0];

    const [form, setForm] = useState({
        session: currentFee?.session || '2023/2024',
        term: currentFee?.term || '1st',
        status: currentFee?.status || 'Pending',
        amount: currentFee?.amount || 0,
        amountPaid: currentFee?.amountPaid || 0,
        dueDate: currentFee?.dueDate || format(new Date(), 'yyyy-MM-dd'),
    });

    async function handleSave() {
        setIsSubmitting(true);
        try {
            const balanceRemaining = Math.max(0, form.amount - form.amountPaid);
            const feeId = currentFee?.id || `fee_${Date.now()}`;
            
            const feeData = {
                ...form,
                id: feeId,
                studentId: student.id,
                balanceRemaining,
                paidDate: form.status === 'Paid' ? format(new Date(), 'yyyy-MM-dd') : null,
                createdAt: serverTimestamp(),
            };

            // 1. Save to private student collection
            await setDoc(doc(firestore, 'users', student.id, 'fees', feeId), feeData);
            
            // 2. Save to global aggregation collection
            await setDoc(doc(firestore, 'fees', feeId), feeData);

            toast({ title: 'Fee record updated successfully' });
            onClose();
        } catch (e: any) {
            toast({ title: 'Update failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle>Fee Management: {student.firstName} {student.lastName}</DialogTitle>
                <DialogDescription>Update payment status and billing information.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Academic Session</Label>
                    <Input value={form.session} onChange={e => setForm({...form, session: e.target.value})} placeholder="e.g. 2023/2024" />
                </div>
                <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={form.term} onValueChange={v => setForm({...form, term: v as any})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1st">1st Term</SelectItem>
                            <SelectItem value="2nd">2nd Term</SelectItem>
                            <SelectItem value="3rd">3rd Term</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Total Fee Amount (₦)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <Label>Amount Paid (₦)</Label>
                    <Input type="number" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Fee Status
                </Button>
            </DialogFooter>
        </div>
    );
}
