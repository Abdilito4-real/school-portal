'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(values.email);
      setIsSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-medium">Request Sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account with that email exists, we've sent instructions to reset your password.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
            </Button>
             <Button asChild variant="ghost" className="w-full">
                <Link href="/login">Cancel</Link>
            </Button>
        </div>
      </form>
    </Form>
  );
}
