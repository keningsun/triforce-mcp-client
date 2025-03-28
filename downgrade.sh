#!/bin/bash

# 降级Next.js版本脚本

echo "开始降级Next.js..."

# 安装指定版本的Next.js
npm install next@13.2.4

# 清理缓存
rm -rf .next
npm cache clean --force

# 重新安装依赖
npm install

# 重新构建项目
npm run build

echo "Next.js降级完成！现在使用的是13.2.4版本。"
echo "如果需要，请手动部署到Vercel。" 