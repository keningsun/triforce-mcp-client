import { PrismaClient } from "@prisma/client/edge";
import { refreshGoogleToken } from "./refresh-google-token";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * 确保用户的OAuth令牌有效（自动刷新过期的令牌）
 * @param userId 用户ID
 * @param provider 提供商名称 ('google', 'slack', 'notion')
 * @returns 有效的访问令牌或错误信息
 */
export async function ensureFreshToken(userId: string, provider: string) {
  try {
    console.log(`确保用户 ${userId} 的 ${provider} 令牌有效...`);

    // 获取OAuth令牌
    const token = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: userId,
        provider,
      },
    });

    if (!token) {
      console.log(`未找到用户的 ${provider} 令牌`);
      return {
        success: false,
        error: `${provider} not connected`,
        errorCode: "NOT_CONNECTED",
      };
    }

    // 检查令牌是否过期
    const isExpired = token.expires_at ? new Date() >= token.expires_at : false;
    console.log(
      `令牌状态: ${isExpired ? "已过期" : "有效"}, 过期时间:`,
      token.expires_at
    );

    // 如果未过期且不是测试，直接返回
    if (!isExpired) {
      return {
        success: true,
        access_token: token.access_token,
        expires_at: token.expires_at,
      };
    }

    // 如果是Google令牌，尝试刷新
    if (provider === "google" && token.refresh_token) {
      console.log("尝试刷新Google令牌...");
      const refreshResult = await refreshGoogleToken(userId);

      if (refreshResult.success) {
        console.log("Google令牌刷新成功");
        return {
          success: true,
          access_token: refreshResult.access_token,
          expires_at: refreshResult.expires_at,
          refreshed: true,
        };
      } else {
        console.log("Google令牌刷新失败:", refreshResult.error);
        return {
          success: false,
          error: "Failed to refresh token",
          details: refreshResult.error,
          errorCode: "REFRESH_FAILED",
        };
      }
    }

    // 如果令牌已过期但不能刷新
    if (isExpired) {
      return {
        success: false,
        error: `${provider} token expired and cannot be refreshed`,
        errorCode: "TOKEN_EXPIRED",
      };
    }

    // 令牌有效
    return {
      success: true,
      access_token: token.access_token,
      expires_at: token.expires_at,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`确保令牌有效时出错:`, {
      message: err.message,
      stack: err.stack,
    });
    return {
      success: false,
      error: "Failed to validate token",
      details: err.message,
      errorCode: "VALIDATION_ERROR",
    };
  }
}
