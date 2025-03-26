"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { TriforceIcon } from "@/components/triforce-icon";
// @ts-ignore - 不用担心类型错误，我们只是引入它
import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // 使用Passkey登录
  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // 1. 获取挑战
      console.log("正在获取登录挑战...");
      const challengeResponse = await fetch(
        "/api/auth/webauthn/generate-challenge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "authenticate" }),
        }
      );

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(
          errorData.error || "Failed to get authentication challenge"
        );
      }

      const options = await challengeResponse.json();
      console.log("接收到登录挑战", options);

      // 2. 使用浏览器的WebAuthn API创建认证响应
      const credential = await SimpleWebAuthnBrowser.startAuthentication(
        options
      );
      console.log("创建的认证响应:", credential);

      // 3. 验证凭据
      console.log("正在验证凭据...");
      const verificationResponse = await fetch(
        "/api/auth/webauthn/verify-credential",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential,
            action: "authenticate",
          }),
        }
      );

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const verification = await verificationResponse.json();
      console.log("凭据验证结果:", verification);

      // 4. 使用NextAuth的signIn方法登录
      // 此处我们传递从验证API获得的用户信息
      if (verification.verified) {
        const result = await signIn("passkey", {
          id: verification.user.id,
          email: verification.user.email,
          name: verification.user.name,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          throw new Error(result?.error || "Login failed");
        }
      }
    } catch (error) {
      console.error("Passkey login failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 注册新用户
  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // 1. 获取注册挑战
      console.log("正在获取注册挑战...");
      const challengeResponse = await fetch(
        "/api/auth/webauthn/generate-challenge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, action: "register" }),
        }
      );

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(
          errorData.error || "Failed to get registration challenge"
        );
      }

      const options = await challengeResponse.json();
      console.log("接收到注册挑战", options);

      // 2. 使用浏览器的WebAuthn API创建注册响应
      const credential = await SimpleWebAuthnBrowser.startRegistration(options);
      console.log("创建的注册响应:", credential);

      // 3. 验证注册
      console.log("正在验证注册...");
      const verificationResponse = await fetch(
        "/api/auth/webauthn/verify-credential",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential,
            email,
            action: "register",
          }),
        }
      );

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const verification = await verificationResponse.json();
      console.log("注册验证结果:", verification);

      // 4. 使用NextAuth的signIn方法登录新注册的用户
      if (verification.verified) {
        const result = await signIn("passkey", {
          id: verification.user.id,
          email: verification.user.email,
          name: verification.user.name,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          throw new Error(result?.error || "Login after registration failed");
        }
      }
    } catch (error) {
      console.error("Passkey registration failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <TriforceIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Triforce
          </CardTitle>
          <CardDescription>
            Sign in using your passkey or create a new account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={handlePasskeyLogin}
              disabled={isLoading}
            >
              <Fingerprint className="h-5 w-5" />
              {isLoading ? "Authenticating..." : "Sign in with Passkey"}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or register with email
              </span>
            </div>
          </div>
          <form onSubmit={handleRegisterPasskey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? "Registering..." : "Register new account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}
