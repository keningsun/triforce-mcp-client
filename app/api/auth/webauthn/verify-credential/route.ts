import { NextResponse } from "next/server";
import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { PrismaClient } from "@prisma/client";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/typescript-types";

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

// 获取预期的Origin
function getDynamicOrigin(requestUrl: string) {
  // For production Vercel deployment, force HTTPS protocol
  if (process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // For Vercel deployments, always use HTTPS origin
  try {
    const url = new URL(requestUrl);
    // Check if this is a Vercel deployment
    if (url.hostname.includes("vercel.app")) {
      return `https://${url.hostname}`;
    }

    // For other environments, use the protocol from the request
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    console.error("Error parsing URL:", error);
    // Fallback for local development
    return process.env.NEXTAUTH_URL || "http://localhost:3000";
  }
}

export async function POST(req: Request) {
  try {
    // Get dynamic values based on request
    const rpID = getDynamicRpId(req.url);
    const expectedOrigin = getDynamicOrigin(req.url);

    console.log("WebAuthn Verification:", {
      rpID,
      expectedOrigin,
    });

    const { credential, action = "authenticate", email } = await req.json();

    console.log("接收到的验证请求:", {
      action,
      email,
      credentialId: credential?.id,
    });

    // 验证注册响应
    if (action === "register") {
      if (!email || !credential) {
        return NextResponse.json(
          { error: "Email and credential are required" },
          { status: 400 }
        );
      }

      // 查找用户
      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // 获取之前存储的挑战
      const storedChallenge = await prisma.verification_tokens.findFirst({
        where: {
          identifier: user.id,
          expires: { gt: new Date() }, // 确保挑战未过期
        },
        orderBy: { expires: "desc" },
      });

      if (!storedChallenge) {
        return NextResponse.json(
          { error: "Challenge not found or expired" },
          { status: 400 }
        );
      }

      try {
        // 验证注册响应
        const verification = await verifyRegistrationResponse({
          response: credential as RegistrationResponseJSON,
          expectedChallenge: storedChallenge.token,
          expectedOrigin: [
            expectedOrigin,
            "https://triforce-mcp-client.vercel.app",
          ],
          expectedRPID: rpID,
          requireUserVerification: false,
        });

        if (!verification.verified) {
          console.error("验证失败，详细信息:", {
            credential,
            expectedOrigin,
            expectedRPID: rpID,
            challenge: storedChallenge.token.substring(0, 10) + "...", // 只打印部分挑战以免泄露信息
          });
          return NextResponse.json(
            { error: "Verification failed" },
            { status: 400 }
          );
        }

        console.log("注册验证成功!", {
          origin: expectedOrigin,
          rpID,
        });

        // 将验证的凭据保存到数据库
        // @ts-ignore 忽略类型检查，SimpleWebAuthn v9 中 registrationInfo 结构有变化
        const { credentialID, credentialPublicKey, counter } =
          verification.registrationInfo;

        console.log("注册的凭据ID原始数据:", credentialID);

        // 从 Uint8Array 提取原始 ID - 这是客户端将用于登录的内容
        // 注意: SimpleWebAuthn在客户端使用base64url格式
        const credentialIdRaw = Buffer.from(credentialID).toString("base64url");
        const publicKeyBase64 =
          Buffer.from(credentialPublicKey).toString("base64");

        console.log("注册的凭据ID (base64url格式):", credentialIdRaw);

        try {
          await prisma.authenticators.create({
            data: {
              credential_id: credentialIdRaw,
              user_id: user.id,
              provider_account_id: user.id,
              credential_public_key: publicKeyBase64,
              counter: counter,
              credential_device_type: "platform",
              credential_backed_up: false,
            },
          });
          console.log("成功创建认证器记录!");
        } catch (dbError) {
          console.error("数据库错误:", dbError);
          return NextResponse.json(
            { error: "Failed to save authenticator" },
            { status: 500 }
          );
        }

        // 删除使用过的挑战
        try {
          await prisma.verification_tokens.deleteMany({
            where: {
              identifier: user.id,
              token: storedChallenge.token,
            },
          });
        } catch (error) {
          console.error("无法删除验证令牌:", error);
          // 继续处理，不中断流程
        }

        return NextResponse.json({
          verified: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
      } catch (error) {
        console.error("注册验证错误:", error);
        return NextResponse.json(
          { error: "Failed to verify registration" },
          { status: 500 }
        );
      }
    }

    // 验证登录响应
    if (action === "authenticate") {
      if (!credential) {
        return NextResponse.json(
          { error: "Credential is required" },
          { status: 400 }
        );
      }

      // 获取之前存储的挑战
      const storedChallenge = await prisma.verification_tokens.findFirst({
        where: {
          identifier: "authentication",
          expires: { gt: new Date() }, // 确保挑战未过期
        },
        orderBy: { expires: "desc" },
      });

      if (!storedChallenge) {
        return NextResponse.json(
          { error: "Challenge not found or expired" },
          { status: 400 }
        );
      }

      try {
        // 从客户端接收的凭据ID，通常是 base64url 格式
        const credentialId = credential.id;
        console.log("认证凭据ID:", credentialId);

        // 查找用户的认证器 - 尝试多种可能的ID格式
        console.log("寻找凭据ID:", credentialId);

        // 先尝试直接查找
        let authenticator;
        try {
          authenticator = await prisma.authenticators.findFirst({
            where: { credential_id: credentialId },
            include: { users: true },
          });

          if (!authenticator) {
            console.log("直接查找失败，尝试其他格式匹配...");
            // 尝试所有其他可能的格式匹配
            authenticator = await prisma.authenticators.findFirst({
              where: {
                OR: [
                  // 直接使用base64url编码的ID查找
                  { credential_id: credentialId },
                  // 尝试转换为其他格式
                  {
                    credential_id: Buffer.from(credentialId, "base64").toString(
                      "base64url"
                    ),
                  },
                  {
                    credential_id: Buffer.from(
                      credentialId,
                      "base64url"
                    ).toString("base64"),
                  },
                ],
              },
              include: { users: true },
            });
          }
        } catch (dbError) {
          console.error("数据库查询错误:", dbError);
          return NextResponse.json(
            { error: "Database query failed" },
            { status: 500 }
          );
        }

        if (!authenticator) {
          // 列出所有认证器以进行调试
          try {
            const allAuthenticators = await prisma.authenticators.findMany({
              take: 5,
              select: { credential_id: true, user_id: true },
            });
            console.error(
              "找不到认证器。数据库中的认证器:",
              JSON.stringify(allAuthenticators, null, 2)
            );
          } catch (e) {
            console.error("无法列出认证器:", e);
          }

          return NextResponse.json(
            { error: "Authenticator not found" },
            { status: 404 }
          );
        }

        console.log("找到认证器:", {
          id: authenticator.credential_id,
          userId: authenticator.user_id,
        });

        // 验证认证响应
        const verification = await verifyAuthenticationResponse({
          response: credential as AuthenticationResponseJSON,
          expectedChallenge: storedChallenge.token,
          expectedOrigin: [
            expectedOrigin,
            "https://triforce-mcp-client.vercel.app",
          ],
          expectedRPID: rpID,
          requireUserVerification: false,
          authenticator: {
            credentialID: new Uint8Array(
              Buffer.from(authenticator.credential_id, "base64url")
            ),
            credentialPublicKey: new Uint8Array(
              Buffer.from(authenticator.credential_public_key, "base64")
            ),
            counter: authenticator.counter,
          },
        });

        console.log("认证验证结果:", {
          verified: verification.verified,
          newCounter: verification.authenticationInfo.newCounter,
          expectedOrigin,
          rpID,
          challenge: storedChallenge.token.substring(0, 10) + "...",
        });

        if (!verification.verified) {
          return NextResponse.json(
            { error: "Authentication failed" },
            { status: 400 }
          );
        }

        // 更新计数器
        try {
          await prisma.authenticators.update({
            where: { credential_id: authenticator.credential_id },
            data: { counter: verification.authenticationInfo.newCounter },
          });
          console.log(
            "更新计数器成功:",
            verification.authenticationInfo.newCounter
          );
        } catch (updateError) {
          console.error("更新计数器失败:", updateError);
          // 继续处理，不中断流程，因为这不是致命错误
        }

        // 删除使用过的挑战
        try {
          await prisma.verification_tokens.deleteMany({
            where: {
              identifier: "authentication",
              token: storedChallenge.token,
            },
          });
        } catch (error) {
          console.error("无法删除验证令牌:", error);
          // 继续处理，不中断流程
        }

        // 返回用户信息
        return NextResponse.json({
          verified: true,
          user: {
            id: authenticator.users.id,
            email: authenticator.users.email,
            name: authenticator.users.name,
          },
        });
      } catch (error) {
        console.error("认证验证错误:", error);
        return NextResponse.json(
          { error: "Failed to verify authentication" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify credential" },
      { status: 500 }
    );
  }
}
