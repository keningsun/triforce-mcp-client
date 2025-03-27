import { PrismaClient } from "@prisma/client";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Google OAuth配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * 刷新Google OAuth令牌
 * @param userId 用户ID
 * @returns 刷新结果
 */
export async function refreshGoogleToken(userId: string) {
  try {
    console.log(`开始为用户 ${userId} 刷新Google OAuth令牌`);

    // 获取Google令牌
    const googleToken = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: userId,
        provider: "google",
      },
    });

    if (!googleToken) {
      console.log("未找到Google OAuth令牌");
      return {
        success: false,
        error: "Google OAuth token not found",
      };
    }

    // 检查是否有刷新令牌
    if (!googleToken.refresh_token) {
      console.log("缺少刷新令牌，无法刷新访问令牌");
      return {
        success: false,
        error: "Refresh token not available",
      };
    }

    console.log("令牌ID:", googleToken.id, "过期时间:", googleToken.expires_at);

    // 如果令牌没有过期，不需要刷新
    if (googleToken.expires_at && new Date() < googleToken.expires_at) {
      console.log("访问令牌尚未过期，无需刷新");
      return {
        success: true,
        refreshed: false,
        expires_at: googleToken.expires_at,
        access_token: googleToken.access_token,
      };
    }

    // 使用刷新令牌获取新的访问令牌
    console.log("开始刷新访问令牌...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: googleToken.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("刷新令牌响应:", {
      success: !!tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      error: tokenData.error,
      error_description: tokenData.error_description,
    });

    if (!tokenData.access_token) {
      console.error("刷新访问令牌失败:", tokenData);
      return {
        success: false,
        error: "Failed to refresh access token",
        details:
          tokenData.error_description || tokenData.error || "Unknown error",
      };
    }

    // 更新数据库中的访问令牌
    const updateData = {
      access_token: tokenData.access_token,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      updated_at: new Date(),
    };

    console.log("更新令牌数据:", {
      expires_at: updateData.expires_at
        ? updateData.expires_at.toISOString()
        : null,
    });

    await prisma.oauth_tokens.update({
      where: {
        id: googleToken.id,
      },
      data: updateData,
    });

    console.log("访问令牌刷新成功");

    return {
      success: true,
      refreshed: true,
      expires_at: updateData.expires_at,
      access_token: updateData.access_token,
    };
  } catch (error) {
    const err = error as Error;
    console.error("Google OAuth令牌刷新错误:", {
      message: err.message,
      stack: err.stack,
    });
    return {
      success: false,
      error: "Failed to refresh Google OAuth token",
      details: err.message,
    };
  }
}
