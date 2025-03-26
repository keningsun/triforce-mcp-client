/**
 * MCP Demo - Auth Management
 * 处理服务授权和存储
 */

// 服务授权状态跟踪
class AuthManager {
  constructor() {
    this.services = {
      slack: { connected: false, token: null },
      github: { connected: false, token: null },
      google: { connected: false, token: null },
    }
    this.loadFromStorage()
  }

  // 从本地存储加载授权状态
  loadFromStorage() {
    try {
      const savedAuth = localStorage.getItem("mcp_auth_state")
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth)
        // 合并保存的状态，保留默认结构
        for (const service in parsed) {
          if (this.services[service]) {
            this.services[service] = parsed[service]
          }
        }
      }
    } catch (error) {
      console.error("Failed to load auth state:", error)
      // 出错时重置状态
      this.resetAuth()
    }

    this.updateUI()
  }

  // 保存授权状态到本地存储
  saveToStorage() {
    try {
      localStorage.setItem("mcp_auth_state", JSON.stringify(this.services))
    } catch (error) {
      console.error("Failed to save auth state:", error)
    }
  }

  // 连接服务（模拟OAuth流程）
  connectService(serviceName) {
    return new Promise((resolve, reject) => {
      // 在实际应用中，这里会打开OAuth授权窗口
      // 这里我们模拟授权流程
      setTimeout(() => {
        // 模拟授权成功
        const mockToken = "mock_token_" + Date.now()
        this.services[serviceName] = {
          connected: true,
          token: mockToken,
          expiresAt: Date.now() + 3600000, // 1小时过期
        }

        this.saveToStorage()
        this.updateUI()
        resolve(this.services[serviceName])
      }, 1500) // 添加延迟以模拟网络请求
    })
  }

  // 断开服务连接
  disconnectService(serviceName) {
    if (this.services[serviceName]) {
      this.services[serviceName].connected = false
      this.services[serviceName].token = null
      this.saveToStorage()
      this.updateUI()
    }
  }

  // 检查服务是否已连接
  isConnected(serviceName) {
    return this.services[serviceName] && this.services[serviceName].connected
  }

  // 检查是否所有必需服务都已连接
  areRequiredServicesConnected() {
    // 假设Slack为必需，其他可选（实际应用中根据需求调整）
    return this.isConnected("slack")
  }

  // 获取服务的token（实际应用中用于API调用）
  getToken(serviceName) {
    return this.services[serviceName] && this.services[serviceName].token
  }

  // 重置所有授权状态
  resetAuth() {
    for (const service in this.services) {
      this.services[service] = { connected: false, token: null }
    }
    this.saveToStorage()
    this.updateUI()
  }

  // 更新UI以反映当前授权状态
  updateUI() {
    const authButtons = document.querySelectorAll(".auth-btn")
    authButtons.forEach((btn) => {
      const service = btn.getAttribute("data-service")
      if (this.isConnected(service)) {
        btn.classList.add("connected")
        btn.querySelector("span").textContent = `${service.charAt(0).toUpperCase() + service.slice(1)} Connected`
      } else {
        btn.classList.remove("connected")
        btn.querySelector("span").textContent = `Connect ${service.charAt(0).toUpperCase() + service.slice(1)}`
      }
    })

    // 更新"开始"按钮状态
    const startButton = document.getElementById("start-app")
    if (startButton) {
      startButton.disabled = !this.areRequiredServicesConnected()
    }
  }
}

// 初始化授权管理器
const authManager = new AuthManager()

// 注册授权按钮点击事件处理程序
document.addEventListener("DOMContentLoaded", () => {
  const authButtons = document.querySelectorAll(".auth-btn")
  authButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const service = btn.getAttribute("data-service")
      if (!authManager.isConnected(service)) {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>`
        try {
          await authManager.connectService(service)
          // 授权成功，UI已在 connectService 中更新
        } catch (error) {
          console.error(`Failed to connect ${service}:`, error)
          btn.innerHTML = `<i class="fab fa-${service}"></i><span>Connect ${
            service.charAt(0).toUpperCase() + service.slice(1)
          }</span>`
        }
      } else {
        // 如果已连接，点击则断开连接
        authManager.disconnectService(service)
      }
    })
  })

  // 开始按钮点击事件
  const startButton = document.getElementById("start-app")
  if (startButton) {
    startButton.addEventListener("click", () => {
      // 如果所有需要的服务都已连接，进入主界面
      if (authManager.areRequiredServicesConnected()) {
        document.getElementById("auth-screen").classList.remove("active")
        document.getElementById("dashboard-screen").classList.add("active")
      }
    })
  }

  // 如果所有需要的服务已连接（如从本地存储中恢复），自动启用开始按钮
  authManager.updateUI()
})

