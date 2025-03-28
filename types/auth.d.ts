import { DefaultSession } from "next-auth";

// 扩展 NextAuth 类型，使其支持用户 ID
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

// 扩展 JWT 类型
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
  }
}
