#!/usr/bin/env node

/**
 * 此脚本用于确保所有API路由都设置了force-dynamic标志
 * 运行: node scripts/fix-api-routes.js
 */

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const API_DIR = path.join(process.cwd(), "app", "api");
const DYNAMIC_FLAG = 'export const dynamic = "force-dynamic";';

// 查找所有API路由文件
async function findApiRouteFiles(dir) {
  const files = [];

  // 读取目录内容
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // 递归遍历子目录
      files.push(...(await findApiRouteFiles(fullPath)));
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      // 找到API路由文件
      files.push(fullPath);
    }
  }

  return files;
}

// 检查并更新文件
async function ensureDynamicFlag(filePath) {
  const content = await readFile(filePath, "utf8");

  // 检查文件是否已经包含dynamic标志
  if (content.includes("dynamic") && content.includes("force-dynamic")) {
    console.log(`✓ ${filePath} 已经配置了dynamic标志`);
    return;
  }

  // 添加dynamic标志
  const newContent = `${content.trim()}\n\n// 添加导出配置，明确标记为动态路由\n${DYNAMIC_FLAG}\n`;
  await writeFile(filePath, newContent, "utf8");
  console.log(`✓ ${filePath} 添加了dynamic标志`);
}

// 主函数
async function main() {
  try {
    console.log("查找API路由文件...");
    const routeFiles = await findApiRouteFiles(API_DIR);
    console.log(`找到 ${routeFiles.length} 个API路由文件`);

    // 更新所有文件
    for (const file of routeFiles) {
      await ensureDynamicFlag(file);
    }

    console.log("所有API路由已更新完成！");
  } catch (error) {
    console.error("出错了:", error);
    process.exit(1);
  }
}

main();
