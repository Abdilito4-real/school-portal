import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
