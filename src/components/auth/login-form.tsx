"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/lib/actions/auth";
import type { AppUser } from "@/lib/types";

export function LoginForm({
  demoMode,
  demoUsers,
}: {
  demoMode: boolean;
  demoUsers: AppUser[];
}) {
  const [state, action] = useActionState(loginAction, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Panele giriş yap</CardTitle>
        <CardDescription>
          {demoMode
            ? "Demo modunda kullanıcı seçerek doğrudan giriş yapabilirsin."
            : "Firebase Auth ile e-posta ve parola üzerinden giriş yapılır."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          {demoMode ? (
            <div className="space-y-2">
              <Label htmlFor="email">Demo kullanıcı</Label>
              <Select id="email" name="email" defaultValue={demoUsers[0]?.email}>
                {demoUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} - {user.role.join(", ")}
                  </option>
                ))}
              </Select>
              <input type="hidden" name="password" value="" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" placeholder="ornek@firma.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parola</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </>
          )}

          <FormMessage error={state.error} success={state.success} />
          <SubmitButton className="w-full">Giriş Yap</SubmitButton>
          <Button asChild className="w-full" variant="secondary">
            <a href="#firebase-kurulum">Firebase kurulum bilgisini gör</a>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
