import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
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
export default NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // 使用JWT而不是数据库会话，更可靠
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
          console.error("Missing credentials");
          return null;
        }

        try {
          // 查找用户
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
          });

          // 如果找到用户，返回用户信息
          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }

          console.log("User not found:", credentials.email);
          return null;
        } catch (error) {
          console.error("Error in Passkey authorize:", error);
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
    async jwt({ token, user }) {
      // 首次登录时，将数据库用户信息保存到JWT中
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // 从JWT中获取用户ID，而不是从数据库
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, ...message) {
      console.error(`[next-auth][error][${code}]`, ...message);
    },
    warn(code, ...message) {
      console.warn(`[next-auth][warn][${code}]`, ...message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[next-auth][debug][${code}]`, ...message);
      }
    },
  },
});
