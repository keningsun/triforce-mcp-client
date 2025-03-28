#!/bin/bash

# 打印执行的每一条命令
set -x

# 安装依赖
echo "=== 安装依赖 ==="
npm install

# 生成 Prisma 客户端
echo "=== 生成 Prisma 客户端 ==="
npx prisma generate

# 执行 Next.js 构建
echo "=== 执行 Next.js 构建 ==="
next build
