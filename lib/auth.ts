import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { Session, User } from "next-auth";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 使用NextAuth v4 API创建认证处理器
export default NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // 使用JWT而不是数据库会话，更可靠
  },
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
});
