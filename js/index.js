/**
 * MCP Demo - 入口文件
 * 整合所有模块并初始化应用
 */

// 在DOM加载完成后执行初始化
document.addEventListener("DOMContentLoaded", async () => {
  // 初始化授权管理器
  window.authManager = new AuthManager()

  // 初始化UI管理器
  window.uiManager = new UIManager()

  // 初始化MCP管理器
  window.mcpManager = new MCPManager()

  // 注册DOM事件
  registerEventListeners()

  // 在DOM准备就绪后显示UI
  setTimeout(() => {
    document.body.classList.add("app-ready")
  }, 100)

  console.log("MCP演示应用初始化完成")
})

// 注册所有事件监听器
function registerEventListeners() {
  // 授权相关事件
  document.querySelectorAll(".auth-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const service = e.currentTarget.getAttribute("data-service")
      window.authManager.connectService(service)
    })
  })

  // 开始按钮
  const getStartedButton = document.getElementById("start-app")
  if (getStartedButton) {
    getStartedButton.addEventListener("click", () => {
      window.uiManager.switchScreen("dashboard-screen")
    })
  }

  // 导航链接
  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const targetScreen = e.currentTarget.getAttribute("data-screen")
      if (targetScreen) {
        window.uiManager.switchScreen(targetScreen)
      }
    })
  })

  // 主题切换按钮
  document.querySelectorAll("#theme-toggle, #theme-toggle-chat, #theme-toggle-insights").forEach((button) => {
    button.addEventListener("click", () => {
      window.uiManager.toggleTheme()
    })
  })

  // 快速操作按钮
  document.querySelectorAll(".action-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const action = e.currentTarget.getAttribute("data-action")
      if (action) {
        window.uiManager.handleQuickAction(action)
      }
    })
  })

  // 建议提示点击
  document.querySelectorAll(".prompt-item").forEach((prompt) => {
    prompt.addEventListener("click", (e) => {
      const promptText = e.currentTarget.textContent.trim()
      window.uiManager.handlePromptClick(promptText)
    })
  })

  // 聊天输入框提交
  const chatForm = document.querySelector(".chat-main form")
  const chatInput = document.querySelector(".chat-input")

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const text = chatInput.value.trim()
      if (text) {
        window.uiManager.handleChatInput(text)
        chatInput.value = ""
      }
    })
  }
}

