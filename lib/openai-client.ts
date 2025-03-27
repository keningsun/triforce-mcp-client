import OpenAI from "openai";

// 创建预配置的OpenAI客户端实例，确保使用正确的API密钥
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 导出函数用于检查API密钥配置
export function checkOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  // 检查密钥格式
  if (!apiKey.startsWith("sk-")) {
    throw new Error(
      "OpenAI API key appears to be invalid (should start with sk-)"
    );
  }

  return {
    isConfigured: true,
    keyLength: apiKey.length,
  };
}
