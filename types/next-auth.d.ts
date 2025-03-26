import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * 扩展默认的Session类型
   */
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
