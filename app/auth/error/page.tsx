"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // 从URL参数中获取错误信息
    const error = searchParams.get("error");

    // 根据错误类型设置用户友好的错误消息
    if (error === "Configuration") {
      setErrorMessage("服务端配置错误，请联系管理员。");
    } else if (error === "AccessDenied") {
      setErrorMessage("您没有访问权限。");
    } else if (error === "Verification") {
      setErrorMessage("验证失败，请重新尝试。");
    } else if (
      error === "OAuthSignin" ||
      error === "OAuthCallback" ||
      error === "OAuthCreateAccount" ||
      error === "EmailCreateAccount" ||
      error === "Callback"
    ) {
      setErrorMessage("登录过程中发生错误，请重新尝试。");
    } else if (error === "OAuthAccountNotLinked") {
      setErrorMessage("此账号未关联现有账户。");
    } else if (error === "SessionRequired") {
      setErrorMessage("需要登录后才能访问该页面。");
    } else if (error) {
      setErrorMessage(`认证错误: ${error}`);
    } else {
      setErrorMessage("发生未知错误，请重新尝试登录。");
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">认证错误</CardTitle>
          <CardDescription>登录过程中发生了错误</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            返回
          </Button>
          <Button onClick={() => router.push("/login")}>返回登录页</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
