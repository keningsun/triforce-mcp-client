import { NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dynamic RP ID based on environment
// For Vercel: get the deployment domain from environment or request
// For localhost: use 'localhost'
function getDynamicRpId(requestUrl: string) {
  // If WEBAUTHN_RP_ID is explicitly set in env vars, use it
  if (
    process.env.WEBAUTHN_RP_ID &&
    process.env.WEBAUTHN_RP_ID !== "localhost"
  ) {
    return process.env.WEBAUTHN_RP_ID;
  }

  // Extract hostname from request URL for production
  try {
    const url = new URL(requestUrl);
    const hostname = url.hostname;

    // If we're on localhost, return 'localhost'
    if (hostname === "localhost" || hostname.includes("127.0.0.1")) {
      return "localhost";
    }

    // Otherwise return the hostname (e.g., 'triforce-mcp-client.vercel.app')
    return hostname;
  } catch (error) {
    // Fallback
    return process.env.WEBAUTHN_RP_ID || "localhost";
  }
}

// WebAuthn登录注册中使用的RP名称
const rpName = "Triforce App";
// 确保使用环境变量作为主要来源，本地URL作为后备
const expectedOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    // Get dynamic RP ID based on request
    const rpID = getDynamicRpId(req.url);
    console.log("Using WebAuthn RP ID:", rpID);

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("请求体解析错误:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, action = "authenticate" } = body || {};
    console.log("收到挑战请求:", { action, email });

    // 注册新用户的挑战
    if (action === "register") {
      if (!email) {
        return NextResponse.json(
          { error: "Email is required for registration" },
          { status: 400 }
        );
      }

      try {
        // 检查用户是否存在
        let user = await prisma.users.findUnique({
          where: { email },
        });

        console.log("查找用户结果:", { userExists: !!user, email });

        // 如果用户不存在，创建新用户
        if (!user) {
          user = await prisma.users.create({
            data: {
              id: crypto.randomUUID(),
              email,
              name: email.split("@")[0], // 简单提取用户名
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          console.log("创建新用户:", user.id);
        }

        // 生成注册选项
        const options = await generateRegistrationOptions({
          rpName,
          rpID,
          userID: user.id,
          userName: user.name || user.email,
          attestationType: "none",
          excludeCredentials: [], // 这里可以添加已存在的凭证以防重复注册
          authenticatorSelection: {
            residentKey: "required",
            userVerification: "discouraged",
          },
        });

        console.log("生成的注册挑战:", {
          challenge: options.challenge,
          userId: user.id,
        });

        // 保存挑战到会话中
        await prisma.verification_tokens.create({
          data: {
            identifier: user.id,
            token: options.challenge,
            expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
          },
        });

        return NextResponse.json(options);
      } catch (error) {
        console.error("注册选项生成错误:", error);
        return NextResponse.json(
          { error: "Failed to generate registration options" },
          { status: 500 }
        );
      }
    }

    // 用户登录的挑战
    if (action === "authenticate") {
      try {
        // 生成认证选项
        const options = await generateAuthenticationOptions({
          rpID,
          allowCredentials: [], // 空数组表示允许任何我们已注册的凭证
          userVerification: "discouraged",
        });

        console.log("生成的认证挑战:", options.challenge);

        // 保存挑战到验证表
        await prisma.verification_tokens.create({
          data: {
            identifier: "authentication", // 使用固定值作为登录挑战的标识符
            token: options.challenge,
            expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
          },
        });

        return NextResponse.json(options);
      } catch (error) {
        console.error("认证选项生成错误:", error);
        return NextResponse.json(
          { error: "Failed to generate authentication options" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Challenge generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
