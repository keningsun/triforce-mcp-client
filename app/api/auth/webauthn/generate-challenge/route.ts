import { NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// WebAuthn登录注册中使用的RP ID和名称
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const rpName = "Triforce App";
// 确保使用硬编码URL作为后备，而不是依赖可能过时的环境变量
const expectedOrigin = "http://localhost:3000";

export async function POST(req: Request) {
  try {
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
