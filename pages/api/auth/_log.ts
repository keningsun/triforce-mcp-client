import { NextApiRequest, NextApiResponse } from "next";

/**
 * 处理NextAuth客户端错误日志的API路由
 * 对所有HTTP方法返回成功响应，确保不会阻断认证流程
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 记录日志信息但不做其他处理
    console.log("[Auth Client Log]", {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    // 所有请求类型都返回200 OK
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("处理客户端日志失败:", error);
    // 即使出错也返回成功响应，避免阻断认证流程
    res.status(200).json({ success: false });
  }
}
