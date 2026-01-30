'use client';

import { useState } from 'react';
import { doc, setDoc, serverTimestamp, collection, deleteDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, Trash2, Plus, Info, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Student, AcademicResult, Class } from '@/lib/types';
import * as XLSX from 'xlsx';

export default function ResultManagementDialog({ student, onClose }: { student: Student; onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const resultsColRef = useMemoFirebase(() => collection(firestore, 'users', student.id, 'academicResults'), [firestore, student.id]);
    const { data: results, isLoading } = useCollection<AcademicResult>(resultsColRef);

    const { data: classes } = useCollection<Class>(useMemoFirebase(() => collection(firestore, 'classes'), [firestore]));
    const studentClass = classes?.find(c => c.id === student.classId);

    const [newResult, setNewResult] = useState({
        className: '',
        grade: 'A' as any,
        term: '1st' as any,
        year: new Date().getFullYear(),
        comments: '',
        position: '',
    });

    const downloadTemplate = () => {
        const templateData = [
            {
                Subject: 'Mathematics',
                Grade: 'A',
                Term: '1st',
                Year: 2024,
                Position: '1st',
                Comments: 'Excellent performance'
            },
            {
                Subject: 'English',
                Grade: 'B',
                Term: '1st',
                Year: 2024,
                Position: '3rd',
                Comments: 'Good, but can improve'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ResultsTemplate");
        XLSX.writeFile(wb, `${student.firstName}_${student.lastName}_Results_Template.xlsx`);
        
        toast({
            title: "Template Downloaded",
            description: "Fill the Excel file and upload it to bulk add results for this student."
        });
    };

    async function handleAddResult() {
        if (!newResult.className) return toast({ title: 'Select a subject', variant: 'destructive' });
        setIsSubmitting(true);
        try {
            const id = `res_${Date.now()}`;
            const data = {
                ...newResult,
                id,
                studentId: student.id,
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(firestore, 'users', student.id, 'academicResults', id), data);
            await setDoc(doc(firestore, 'academicResults', id), data);
            toast({ title: 'Result added successfully' });
            setNewResult(prev => ({ ...prev, className: '', comments: '', position: '' }));
        } catch (e) {
            toast({ title: 'Failed to add result', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteDoc(doc(firestore, 'users', student.id, 'academicResults', id));
            await deleteDoc(doc(firestore, 'academicResults', id));
            toast({ title: 'Result removed' });
        } catch (e) {
            toast({ title: 'Failed to delete' });
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            setIsSubmitting(true);
            try {
                for (const row of data as any[]) {
                    const id = `res_bulk_${Math.random().toString(36).substr(2, 9)}`;
                    const payload = {
                        className: row.Subject || row.subject || row.className || 'Unknown',
                        grade: (row.Grade || row.grade || 'C').toString().toUpperCase(),
                        term: (row.Term || row.term || '1st').toString(),
                        year: Number(row.Year || row.year || new Date().getFullYear()),
                        comments: row.Comments || row.comments || '',
                        position: (row.Position || row.position || '').toString(),
                        studentId: student.id,
                        createdAt: serverTimestamp(),
                    };
                    await setDoc(doc(firestore, 'users', student.id, 'academicResults', id), payload);
                    await setDoc(doc(firestore, 'academicResults', id), payload);
                }
                toast({ title: `Successfully uploaded ${data.length} results` });
            } catch (err) {
                console.error(err);
                toast({ title: 'Bulk upload failed', variant: 'destructive' });
            } finally {
                setIsSubmitting(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle>Academic Results: {student.firstName} {student.lastName}</DialogTitle>
                <DialogDescription>Manage performance records for individual terms and years.</DialogDescription>
            </DialogHeader>

            <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4" />
                <AlertTitle>Bulk Upload Instructions</AlertTitle>
                <AlertDescription className="space-y-4">
                    <p>To upload multiple results, ensure your Excel file contains these exact headers. Note that <strong>Term</strong> must be one of: 1st, 2nd, 3rd.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono font-bold text-primary">
                        <Badge variant="outline">Subject</Badge>
                        <Badge variant="outline">Grade (A-F)</Badge>
                        <Badge variant="outline">Term (1st/2nd/3rd)</Badge>
                        <Badge variant="outline">Year (e.g. 2024)</Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full mt-2">
                        <Download className="mr-2 h-4 w-4" /> Download Result Template (.xlsx)
                    </Button>
                </AlertDescription>
            </Alert>

            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Add New Entry</h4>
                    <div className="flex gap-2">
                        <Label htmlFor="excel-upload" className="cursor-pointer">
                            <div className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Bulk Upload (Excel)
                            </div>
                        </Label>
                        <Input id="excel-upload" type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="md:col-span-2">
                        <Select value={newResult.className} onValueChange={v => setNewResult({...newResult, className: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                            <SelectContent>
                                {studentClass?.subjects?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Select value={newResult.grade} onValueChange={v => setNewResult({...newResult, grade: v as any})}>
                        <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                        <SelectContent>
                            {['A', 'B', 'C', 'D', 'F'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={newResult.term} onValueChange={v => setNewResult({...newResult, term: v as any})}>
                        <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1st">1st Term</SelectItem>
                            <SelectItem value="2nd">2nd Term</SelectItem>
                            <SelectItem value="3rd">3rd Term</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input 
                        type="number" 
                        placeholder="Year" 
                        value={newResult.year} 
                        onChange={e => setNewResult({...newResult, year: Number(e.target.value)})} 
                    />
                    <Button onClick={handleAddResult} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Add
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : results?.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No records found for this student.</TableCell></TableRow>
                        ) : results?.sort((a, b) => b.year - a.year || (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).map(res => (
                            <TableRow key={res.id}>
                                <TableCell className="font-medium">{res.className}</TableCell>
                                <TableCell><Badge variant="secondary">{res.grade}</Badge></TableCell>
                                <TableCell>{res.term}</TableCell>
                                <TableCell>{res.year}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
