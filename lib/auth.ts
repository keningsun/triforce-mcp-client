import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 检查和记录关键环境变量
console.log("Auth Configuration:", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
});

// 使用NextAuth v4 API创建认证处理器
const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const, // 使用JWT而不是数据库会话，更可靠
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.AUTH_SECRET, // 确保设置了密钥
  providers: [
    CredentialsProvider({
      id: "passkey",
      name: "Passkey",
      credentials: {
        id: { label: "ID", type: "text" },
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          console.error("Missing credentials in authorize function");
          return null;
        }

        try {
          console.log("授权流程开始:", credentials.email);

          // 查找用户
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
          });

          // 如果找到用户，返回用户信息
          if (user) {
            console.log("已找到用户，返回用户数据:", user.email);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }

          console.log("用户不存在:", credentials.email);
          return null;
        } catch (error) {
          console.error("Passkey授权错误:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error", // 添加自定义错误页面路径
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      try {
        // 首次登录时，将数据库用户信息保存到JWT中
        if (user) {
          console.log("JWT回调: 用户首次登录, 设置token.id = user.id");
          token.id = user.id;
        } else {
          console.log("JWT回调: 使用现有token");
        }
        return token;
      } catch (error) {
        console.error("JWT回调错误:", error);
        return token;
      }
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      try {
        // 从JWT中获取用户ID，而不是从数据库
        if (session?.user && token) {
          console.log("会话回调: 设置session.user.id");
          session.user.id = token.id as string;
        } else {
          console.log("会话回调: session或token不完整", {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasToken: !!token,
          });
        }
        return session;
      } catch (error) {
        console.error("会话回调错误:", error);
        return session;
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code: string, ...message: any[]) {
      console.error(`[next-auth][error][${code}]`, ...message);
    },
    warn(code: string, ...message: any[]) {
      console.warn(`[next-auth][warn][${code}]`, ...message);
    },
    debug(code: string, ...message: any[]) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[next-auth][debug][${code}]`, ...message);
      }
    },
  },
  events: {
    async signIn(message) {
      console.log("登录事件:", {
        user: message.user.email,
        isNewUser: message.isNewUser,
      });
    },
    async signOut(message) {
      console.log("登出事件:", {
        session: message.session ? "存在" : "不存在",
      });
    },
    async createUser(message) {
      console.log("创建用户事件:", {
        id: message.user.id,
        email: message.user.email,
      });
    },
    async linkAccount(message) {
      console.log("账号关联事件:", message);
    },
    async session(message) {
      // 会话更新事件
      console.log("会话更新事件");
    },
    async updateUser(message) {
      console.log("用户更新事件:", {
        id: message.user.id,
        email: message.user.email,
      });
    },
  },
};

// 导出 authOptions
export default authOptions;
