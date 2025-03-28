let userConfig = undefined;
try {
  userConfig = await import("./v0-user-next.config");
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 简化实验性特性，减少潜在问题
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@mui/material",
      "react-icons",
    ],
  },
  env: {
    MCP_SERVER_BASE_URL: process.env.MCP_SERVER_BASE_URL,
  },
  // 确保正确解析组件目录
  transpilePackages: ["@/components", "@/lib"],
  // 清除缓存
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // 修复API路由的静态生成问题
  serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  // 确保API路由可以正确处理会话
  async headers() {
    return [
      {
        // 为所有API路由添加特殊头部
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        // 专门为认证API添加头部
        source: "/api/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
  // 优化认证路由的缓存行为
  async rewrites() {
    return {
      beforeFiles: [
        // 确保session API始终从服务器获取
        {
          source: "/api/auth/session",
          destination: "/api/auth/session",
          has: [
            {
              type: "header",
              key: "cookie",
            },
          ],
        },
      ],
    };
  },
};

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === "object" &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

mergeConfig(nextConfig, userConfig);

export default nextConfig;
