'use client';

import { useState, useMemo } from 'react';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, ArrowLeft, Edit, Trash2, BookOpen, CreditCard, Download, FileSpreadsheet, Info, CheckCircle2 } from 'lucide-react';
import type { Student, FeeRecord, Class } from '@/lib/types';
import { useDoc } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { deleteStudent as deleteStudentFlow } from '@/ai/flows/delete-student-flow';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import StudentForm from './student-form';
import FeeManagementDialog from './fee-management-dialog';
import ResultManagementDialog from './result-management-dialog';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function StudentManagement({ classId }: { classId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isStudentFormOpen, setStudentFormOpen] = useState(false);
  
  const [feeStudent, setFeeStudent] = useState<Student | null>(null);
  const [resultStudent, setResultStudent] = useState<Student | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkResultModalOpen, setIsBulkResultModalOpen] = useState(false);

  const classDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'classes', classId) : null, [firestore, classId]);
  const { data: classData } = useDoc<Class>(classDocRef);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'students'), where('classId', '==', classId));
  }, [firestore, classId, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const feesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'fees');
  }, [firestore, user]);
  const { data: allFees } = useCollection<FeeRecord>(feesQuery);

  const feesByStudentId = useMemo(() => {
    const map = new Map<string, FeeRecord>();
    allFees?.forEach(fee => map.set(fee.studentId, fee));
    return map;
  }, [allFees]);

  const filteredStudents = useMemo(() => 
    students?.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(filter.toLowerCase())) ?? [], 
    [students, filter]
  );

  const downloadClassListTemplate = () => {
    if (!students || students.length === 0) return;
    
    const subjects = (classData?.subjects && classData.subjects.length > 0)
        ? classData.subjects
        : ['Mathematics', 'English', 'Civic Education', 'Physics', 'Biology', 'Chemistry', 'Religious Stuc'];

    const templateData: any[] = students.map(s => {
        const row: any = {
            'studentId': s.id,
            'firstName': s.firstName,
            'lastName': s.lastName,
            'email': s.email || '',
        };

        // Add subject columns
        subjects.forEach(subject => {
            row[subject] = '';
        });

        row['position'] = '';
        row['comments'] = '';
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ClassResults");
    XLSX.writeFile(wb, `Class_List_Results_Template.xlsx`);
    
    toast({
        title: "Template Downloaded",
        description: "Fill this sheet to upload results for all students in this class."
    });
  };

interface BulkResultUploadDialogProps {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    firestore: any;
    setIsUploading: (uploading: boolean) => void;
    isUploading: boolean;
}

const BulkResultUploadDialog = ({ isOpen, setOpen, firestore, setIsUploading, isUploading }: BulkResultUploadDialogProps) => {
    const [selectedTerm, setSelectedTerm] = useState('1st');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !firestore) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                
                let count = 0;
                const nonSubjectKeys = ['studentId', 'firstName', 'lastName', 'email', 'position', 'comments', 'Student ID', 'First Name', 'Last Name', 'Email', 'Position', 'Comments'];

                for (const row of data as any[]) {
                    const studentId = row['studentId'] || row['Student ID'];
                    if (!studentId) continue;

                    // Extract subjects - anything that's not in nonSubjectKeys
                    const subjectsInRow = Object.keys(row).filter(key => !nonSubjectKeys.includes(key));

                    for (const subject of subjectsInRow) {
                        const grade = row[subject];
                        if (grade === undefined || grade === null || grade === '') continue;

                        const resultId = `res_bulk_${Math.random().toString(36).substr(2, 9)}`;
                        const payload = {
                            className: subject,
                            grade: grade.toString().toUpperCase(),
                            term: selectedTerm,
                            year: Number(selectedYear),
                            comments: (row['comments'] || row['Comments'] || '').toString(),
                            position: (row['position'] || row['Position'] || '').toString(),
                            studentId,
                            createdAt: serverTimestamp(),
                        };

                        await setDoc(doc(firestore, 'users', studentId, 'academicResults', resultId), payload);
                        await setDoc(doc(firestore, 'academicResults', resultId), payload);
                        count++;
                    }
                }
                toast({ title: 'Upload Successful', description: `Uploaded ${count} results.` });
                setOpen(false);
            } catch (err) {
                console.error(err);
                toast({ title: 'Upload Failed', variant: 'destructive' });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Bulk Upload Class Results</DialogTitle>
                <DialogDescription>
                    Upload an Excel file containing results for all students in this class.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm border">
                    <h4 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Instructions</h4>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>Download and use the <strong>Class Template</strong> provided on the management page.</li>
                        <li>Ensure the <strong>Student ID</strong> column is not modified.</li>
                        <li>The <strong>Term</strong> and <strong>Year</strong> you select below will override any values in the sheet.</li>
                        <li>Supported formats: .xlsx, .xls, .csv</li>
                    </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Target Term</Label>
                        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1st">1st Term</SelectItem>
                                <SelectItem value="2nd">2nd Term</SelectItem>
                                <SelectItem value="3rd">3rd Term</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Target Year</Label>
                        <Input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Select File</Label>
                    <div className="flex items-center gap-2">
                         <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="cursor-pointer" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!file || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Start Upload
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

  const performDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
        const res = await deleteStudentFlow({ uid: studentToDelete.id });
        if (res.success) toast({ title: 'Student Deleted' });
        else throw new Error(res.error);
    } catch (e: any) {
        toast({ title: 'Deletion Failed', variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/classes"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
            <Button variant="outline" onClick={downloadClassListTemplate} disabled={isLoadingStudents || filteredStudents.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download Class Template
            </Button>
            <Button variant="outline" onClick={() => setIsBulkResultModalOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Bulk Upload Class Results
            </Button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Input placeholder="Search students..." value={filter} onChange={e => setFilter(e.target.value)} className="w-40 sm:w-64" />
          <Button onClick={() => { setSelectedStudent(null); setStudentFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Create Student</Button>
        </div>
      </div>

      <TooltipProvider>
        <Card>
          <CardContent className="p-0">
              <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Fee Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                  {isLoadingStudents ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                  ) : filteredStudents.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No students found in this class.</TableCell></TableRow>
                  ) : filteredStudents.map(student => {
                      const feeRecord = feesByStudentId.get(student.id);
                      const feeStatus = feeRecord?.status;
                      const badgeVariant = feeStatus === 'Paid' ? 'success' : feeStatus === 'Partial' ? 'warning' : feeStatus === 'Pending' ? 'destructive' : 'outline';
                      
                      return (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                            <TableCell><Badge variant={badgeVariant}>{feeStatus || 'Not Set'}</Badge></TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setFeeStudent(student)}><CreditCard className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Manage Fees</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setResultStudent(student)}><BookOpen className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Manage Results</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setStudentFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit Profile</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setStudentToDelete(student)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete Student</TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                      );
                  })}
              </TableBody>
              </Table>
          </CardContent>
        </Card>
      </TooltipProvider>

      <Dialog open={isStudentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent>
            {isStudentFormOpen && <StudentForm setOpen={setStudentFormOpen} student={selectedStudent || undefined} preselectedClassId={classId} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!feeStudent} onOpenChange={(open) => !open && setFeeStudent(null)}>
        <DialogContent className="max-w-2xl">
            {feeStudent && <FeeManagementDialog student={feeStudent} onClose={() => setFeeStudent(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultStudent} onOpenChange={(open) => !open && setResultStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {resultStudent && <ResultManagementDialog student={resultStudent} onClose={() => setResultStudent(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkResultModalOpen} onOpenChange={setIsBulkResultModalOpen}>
        <BulkResultUploadDialog
            isOpen={isBulkResultModalOpen}
            setOpen={setIsBulkResultModalOpen}
            firestore={firestore}
            setIsUploading={setIsUploading}
            isUploading={isUploading}
        />
      </Dialog>
      
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
                This action is permanent. It will delete the student's profile, authentication account, all academic results, and fee records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDeleteStudent} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
