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
import { cn } from '@/lib/utils';

export default function ResultManagementDialog({ student, onClose }: { student: Student; onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const resultsColRef = useMemoFirebase(() => firestore ? collection(firestore, 'users', student.id, 'academicResults') : null, [firestore, student.id]);
    const { data: results, isLoading } = useCollection<AcademicResult>(resultsColRef);

    const { data: classes } = useCollection<Class>(useMemoFirebase(() => firestore ? collection(firestore, 'classes') : null, [firestore]));
    const studentClass = classes?.find(c => c.id === student.classId);

    const [selectedTerm, setSelectedTerm] = useState<'1st' | '2nd' | '3rd'>('1st');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [termResults, setTermResults] = useState<{subject: string, grade: string}[]>([]);
    const [comments, setComments] = useState('');
    const [position, setPosition] = useState('');

    const downloadTemplate = () => {
        const subjects = studentClass?.subjects || ['Mathematics', 'English', 'Civic Education', 'Physics', 'Biology', 'Chemistry', 'Religious Studies'];
        const templateData = [
            {
                'Student ID': student.id,
                'First Name': student.firstName,
                'Last Name': student.lastName,
                ...Object.fromEntries(subjects.map(s => [s, 'A'])),
                'Position': '1st',
                'Comments': 'Excellent performance'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ResultsTemplate");
        XLSX.writeFile(wb, `${student.firstName}_${student.lastName}_Results_Template.xlsx`);
        
        toast({
            title: "Template Downloaded",
            description: "Fill the Excel file and upload it. Term and Year are selected in the dialog."
        });
    };

    async function handleSaveReport() {
        if (!firestore) return;
        if (termResults.length === 0) return toast({ title: 'Add at least one subject grade', variant: 'destructive' });

        setIsSubmitting(true);
        try {
            const reportId = `report_${student.id}_${selectedTerm}_${selectedYear}`.replace(/[^a-zA-Z0-9]/g, '_');
            const data = {
                id: reportId,
                studentId: student.id,
                term: selectedTerm,
                year: selectedYear,
                subjects: termResults,
                comments,
                position,
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(firestore, 'users', student.id, 'academicResults', reportId), data);
            await setDoc(doc(firestore, 'academicResults', reportId), data);
            toast({ title: 'Report saved successfully' });
        } catch (e) {
            toast({ title: 'Failed to save report', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'users', student.id, 'academicResults', id));
            await deleteDoc(doc(firestore, 'academicResults', id));
            toast({ title: 'Record removed' });
        } catch (e) {
            toast({ title: 'Failed to delete' });
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !firestore) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                const row = data[0] as any;

                if (!row) throw new Error("File is empty");

                const nonSubjectKeys = ['studentId', 'firstName', 'lastName', 'email', 'position', 'comments', 'Student ID', 'First Name', 'Last Name', 'Email', 'Position', 'Comments'];
                const subjectsInRow = Object.keys(row).filter(key => !nonSubjectKeys.includes(key));
                const uploadedSubjects = subjectsInRow.map(s => ({
                    subject: s,
                    grade: (row[s] || 'C').toString().toUpperCase()
                }));

                setTermResults(uploadedSubjects);
                setComments((row['Comments'] || row['comments'] || '').toString());
                setPosition((row['Position'] || row['position'] || '').toString());

                toast({ title: "Excel data loaded. Review and click Save Report." });
            } catch (err) {
                console.error(err);
                toast({ title: 'Upload failed', variant: 'destructive' });
            }
        };
        reader.readAsBinaryString(file);
    };

    const addSubjectRow = () => {
        const firstAvailable = studentClass?.subjects?.find(s => !termResults.find(tr => tr.subject === s)) || studentClass?.subjects?.[0] || 'New Subject';
        setTermResults([...termResults, { subject: firstAvailable, grade: 'A' }]);
    };

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle>Academic Results: {student.firstName} {student.lastName}</DialogTitle>
                <DialogDescription>Manage term-based performance records. Uploading overwrites previous data for the same term/year.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                    <h4 className="font-semibold text-sm border-b pb-2">Report Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label>Term</Label>
                            <Select value={selectedTerm} onValueChange={v => setSelectedTerm(v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1st">1st Term</SelectItem>
                                    <SelectItem value="2nd">2nd Term</SelectItem>
                                    <SelectItem value="3rd">3rd Term</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Year</Label>
                            <Input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Position in Class</Label>
                        <Input placeholder="e.g. 1st of 30" value={position} onChange={e => setPosition(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Principal's Comments</Label>
                        <Input placeholder="General remarks..." value={comments} onChange={e => setComments(e.target.value)} />
                    </div>

                    <div className="pt-4 border-t flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Download Template
                        </Button>
                        <Label htmlFor="excel-upload" className="cursor-pointer">
                            <div className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "w-full")}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Load from Excel
                            </div>
                        </Label>
                        <Input id="excel-upload" type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                        <Button onClick={handleSaveReport} disabled={isSubmitting} className="w-full mt-2">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Save Report
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-semibold text-sm">Subject Grades</h4>
                        <Button variant="ghost" size="sm" onClick={addSubjectRow}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {termResults.map((tr, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <Select value={tr.subject} onValueChange={v => {
                                    const next = [...termResults];
                                    next[idx].subject = v;
                                    setTermResults(next);
                                }}>
                                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {studentClass?.subjects?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={tr.grade} onValueChange={v => {
                                    const next = [...termResults];
                                    next[idx].grade = v;
                                    setTermResults(next);
                                }}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['A', 'B', 'C', 'D', 'F'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => setTermResults(termResults.filter((_, i) => i !== idx))}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        {termResults.length === 0 && <p className="text-center py-10 text-muted-foreground text-xs italic">No subjects added. Use Excel or add manually.</p>}
                    </div>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Position</TableHead>
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
                                <TableCell className="font-bold">{res.term}</TableCell>
                                <TableCell>{res.year}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {res.subjects?.slice(0, 3).map((s, idx) => (
                                            <Badge key={idx} variant="outline" className="text-[10px]">{s.subject}: {s.grade}</Badge>
                                        ))}
                                        {(res.subjects?.length || 0) > 3 && <span className="text-[10px] text-muted-foreground">+{(res.subjects?.length || 0) - 3} more</span>}
                                    </div>
                                </TableCell>
                                <TableCell>{res.position}</TableCell>
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
