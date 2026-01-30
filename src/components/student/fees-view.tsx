'use client';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { FeeRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const getStatusBadgeVariant = (status: 'Paid' | 'Pending' | 'Partial') => {
  switch (status) {
    case 'Paid':
      return 'success';
    case 'Pending':
      return 'destructive';
    case 'Partial':
      return 'warning';
    default:
      return 'default';
  }
};

export default function FeesView() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const feesQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'users', user.uid, 'fees')) : null),
    [firestore, user]
  );
  const { data: studentFees, isLoading } = useCollection<FeeRecord>(feesQuery);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentFee = studentFees?.[0];
  const feeHistory = studentFees?.slice(1) || [];

  return (
    <div className="space-y-6">
      {currentFee && (
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Current Fee Status</CardTitle>
            <CardDescription>
                {`For ${currentFee.term} Term, ${currentFee.session} Session`}
                <br />
                Due by {format(new Date(currentFee.dueDate), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-stretch justify-between gap-4 text-center">
             <div className="p-4 rounded-lg bg-background/50 flex-1">
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-3xl font-bold">₦{currentFee.amount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 flex-1">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-3xl font-bold text-green-600">₦{(currentFee.amountPaid || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 flex-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={cn(
                    "text-3xl font-bold",
                    (currentFee.balanceRemaining ?? currentFee.amount) > 0 ? "text-destructive" : "text-green-600"
                )}>
                    ₦{(currentFee.balanceRemaining ?? currentFee.amount).toLocaleString()}
                </p>
            </div>
          </CardContent>
           <CardFooter className="justify-end">
                <Badge className="px-4 py-2 text-base" variant={getStatusBadgeVariant(currentFee.status)}>
                    {currentFee.status}
                </Badge>
            </CardFooter>
        </Card>
      )}

      {!currentFee && !isLoading && (
        <Card>
            <CardHeader>
                <CardTitle>No Fee Information</CardTitle>
            </CardHeader>
            <CardContent>
                <p>There is no fee information available for you at this time.</p>
            </CardContent>
        </Card>
      )}

      {feeHistory.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {feeHistory.map(fee => (
                        <TableRow key={fee.id}>
                            <TableCell>{fee.term}</TableCell>
                            <TableCell>{fee.session}</TableCell>
                            <TableCell className="font-medium">₦{fee.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">₦{(fee.amountPaid || 0).toLocaleString()}</TableCell>
                             <TableCell className={cn((fee.balanceRemaining ?? fee.amount) > 0 ? "text-destructive" : "text-green-600")}>
                                ₦{(fee.balanceRemaining ?? fee.amount).toLocaleString()}
                             </TableCell>
                            <TableCell><Badge variant={getStatusBadgeVariant(fee.status)}>{fee.status}</Badge></TableCell>
                            <TableCell>{format(new Date(fee.dueDate), 'PP')}</TableCell>
                            <TableCell>{fee.paidDate ? format(new Date(fee.paidDate), 'PP') : 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add custom variants to BadgeProps if they don't exist
declare module "@/components/ui/badge" {
    interface BadgeProps {
      variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    }
}
