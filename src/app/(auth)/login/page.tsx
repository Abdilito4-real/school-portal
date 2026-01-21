import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card>
      <CardContent className="p-6">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
