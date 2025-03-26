/**
 * MCP Demo - UI Interactions
 * 处理UI交互、主题切换、视图转换
 */

class UIManager {
  constructor() {
    // 当前视图模式 (default, mobile, tablet)
    this.currentViewMode = "default"

    // 当前活动屏幕（dashboard, chat, insights）
    this.activeScreen = "dashboard"

    // 移动视图的当前活动面板
    this.activeMobileView = "home"

    // 当前主题（light, dark）
    this.currentTheme = localStorage.getItem("mcp_theme") || "light"

    // 初始化UI状态
    this.initTheme()
  }

  // 初始化主题
  initTheme() {
    const app = document.getElementById("app")
    app.className = `theme-${this.currentTheme}`

    // 更新主题图标
    this.updateThemeToggleIcons()
  }

  // 更新主题切换按钮的图标
  updateThemeToggleIcons() {
    const themeToggles = [
      document.getElementById("theme-toggle"),
      document.getElementById("theme-toggle-chat"),
      document.getElementById("theme-toggle-insights"),
    ]

    themeToggles.forEach((toggle) => {
      if (toggle) {
        const icon = toggle.querySelector("i")
        if (icon) {
          icon.className = this.currentTheme === "light" ? "fas fa-moon" : "fas fa-sun"
        }
      }
    })
  }

  // 切换主题
  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light"
    localStorage.setItem("mcp_theme", this.currentTheme)
    this.initTheme()
  }

  // 切换到指定屏幕
  switchScreen(screenId) {
    const screens = document.querySelectorAll(".screen")
    screens.forEach((screen) => {
      screen.classList.remove("active")
    })

    const targetScreen = document.getElementById(`${screenId}-screen`)
    if (targetScreen) {
      targetScreen.classList.add("active")
      this.activeScreen = screenId

      // 更新导航状态
      this.updateNavigation()
    }
  }

  // 更新导航项的活动状态
  updateNavigation() {
    // 更新桌面导航
    const navItems = document.querySelectorAll(".nav-item")
    navItems.forEach((item) => {
      const screen = item.getAttribute("data-screen")
      if (screen === this.activeScreen) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })
  }

  // 切换视图模式（桌面、移动、平板）
  switchViewMode(mode) {
    this.currentViewMode = mode
    const app = document.getElementById("app")

    // 首先移除所有视图相关类
    app.classList.remove("mobile-view", "tablet-view")

    // 应用新视图模式类
    if (mode !== "default") {
      app.classList.add(`${mode}-view`)
    }

    // 更新视图切换按钮的状态
    const viewBtns = document.querySelectorAll(".view-btn")
    viewBtns.forEach((btn) => {
      const btnMode = btn.getAttribute("data-view")
      if (btnMode === mode) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

    // 如果切换到移动视图，显示移动屏幕
    if (mode === "mobile") {
      this.switchScreen("mobile")
    } else {
      // 恢复之前的活动屏幕
      this.switchScreen(this.activeScreen)
    }
  }

  // 切换移动视图中的面板
  switchMobileView(viewId) {
    const mobileViews = document.querySelectorAll(".mobile-view")
    mobileViews.forEach((view) => {
      view.classList.remove("active")
    })

    const targetView = document.getElementById(`mobile-${viewId}`)
    if (targetView) {
      targetView.classList.add("active")
      this.activeMobileView = viewId

      // 更新移动导航状态
      const mobileNavItems = document.querySelectorAll(".mobile-nav-item")
      mobileNavItems.forEach((item) => {
        const view = item.getAttribute("data-mobile-view")
        if (view === viewId) {
          item.classList.add("active")
        } else {
          item.classList.remove("active")
        }
      })
    }
  }

  // 处理聊天输入
  handleChatInput(text) {
    if (!text.trim()) return

    // 添加用户消息
    this.addChatMessage("user", text)

    // 清空输入框
    const chatInput = document.querySelector(".chat-input")
    if (chatInput) {
      chatInput.value = ""
    }

    // 模拟AI助手回复
    this.simulateAIResponse(text)
  }

  // 模拟移动版聊天输入
  handleMobileChatInput(text) {
    if (!text.trim()) return

    // 添加用户消息
    this.addMobileChatMessage("user", text)

    // 清空输入框
    const mobileChatInput = document.querySelector(".mobile-chat-input input")
    if (mobileChatInput) {
      mobileChatInput.value = ""
    }

    // 模拟AI助手回复
    this.simulateMobileAIResponse(text)
  }

  // 添加聊天消息
  addChatMessage(type, content) {
    const chatMessages = document.querySelector(".chat-messages")
    if (!chatMessages) return

    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}`

    if (type === "assistant" && typeof content === "object") {
      // 处理结构化内容（如日历结果）
      const contentDiv = document.createElement("div")
      contentDiv.className = "message-content"

      const textP = document.createElement("p")
      textP.textContent = content.text || ""
      contentDiv.appendChild(textP)

      if (content.card) {
        contentDiv.appendChild(content.card)
      }

      messageDiv.appendChild(contentDiv)
    } else {
      // 简单文本消息
      const p = document.createElement("p")
      p.textContent = content
      messageDiv.appendChild(p)
    }

    chatMessages.appendChild(messageDiv)

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // 添加移动版聊天消息
  addMobileChatMessage(type, content) {
    const mobileMessages = document.querySelector(".mobile-chat-messages")
    if (!mobileMessages) return

    const messageDiv = document.createElement("div")
    messageDiv.className = `mobile-message ${type}`

    const p = document.createElement("p")
    p.textContent = content
    messageDiv.appendChild(p)

    mobileMessages.appendChild(messageDiv)
  }

  // 模拟AI助手响应
  simulateAIResponse(userMessage) {
    // 添加思考中状态
    const chatMessages = document.querySelector(".chat-messages")
    const thinkingDiv = document.createElement("div")
    thinkingDiv.className = "message assistant thinking"
    thinkingDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> AI 思考中...</p>'
    chatMessages.appendChild(thinkingDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    // 简单的关键词匹配响应
    setTimeout(() => {
      // 移除思考中状态
      chatMessages.removeChild(thinkingDiv)

      let response
      const lowerMsg = userMessage.toLowerCase()

      if (lowerMsg.includes("calendar") || lowerMsg.includes("schedule") || lowerMsg.includes("meeting")) {
        // 创建日历卡片
        const card = document.createElement("div")
        card.className = "result-card calendar-result"

        const title = document.createElement("h4")
        title.textContent = "本周日程安排"
        card.appendChild(title)

        const list = document.createElement("ul")
        list.className = "compact-event-list"

        const events = [
          { time: "周一 09:00 - 09:30", title: "团队周会" },
          { time: "周二 14:00 - 15:00", title: "产品规划讨论" },
          { time: "周四 11:00 - 12:00", title: "项目评审" },
          { time: "周五 16:00 - 16:30", title: "周总结" },
        ]

        events.forEach((event) => {
          const li = document.createElement("li")

          const timeSpan = document.createElement("span")
          timeSpan.className = "time"
          timeSpan.textContent = event.time

          const titleSpan = document.createElement("span")
          titleSpan.className = "title"
          titleSpan.textContent = event.title

          li.appendChild(timeSpan)
          li.appendChild(titleSpan)
          list.appendChild(li)
        })

        card.appendChild(list)

        response = {
          text: "以下是您本周的日程安排:",
          card: card,
        }
      } else if (lowerMsg.includes("slack") || lowerMsg.includes("message")) {
        response =
          "您在Slack中有5条未读消息，其中2条来自产品团队讨论频道，3条是直接消息。最重要的一条来自项目经理，询问关于明天演示的状态更新。"
      } else if (lowerMsg.includes("github") || lowerMsg.includes("code") || lowerMsg.includes("pr")) {
        response =
          "您有3个待处理的Pull Requests需要审核，并且昨天有5个新的提交到主分支。团队最活跃的代码仓库本周是frontend-app，有27个提交。"
      } else if (lowerMsg.includes("email") || lowerMsg.includes("gmail")) {
        response =
          '您的收件箱中有8封未读邮件，其中3封被标记为重要。最新的一封来自HR部门，主题是"公司全员会议"，计划在本周五下午3点举行。'
      } else {
        response =
          '我理解您想了解更多关于"' +
          userMessage +
          '"的信息。请问您需要我查询哪个具体的服务（Slack, GitHub, Google Calendar, Gmail）？'
      }

      this.addChatMessage("assistant", response)
    }, 1500)
  }

  // 模拟移动版AI助手响应
  simulateMobileAIResponse(userMessage) {
    // 简单的延迟响应
    setTimeout(() => {
      let response
      const lowerMsg = userMessage.toLowerCase()

      if (lowerMsg.includes("calendar") || lowerMsg.includes("schedule")) {
        response = "今天您有3个会议：9:30团队站会，13:00午餐会议，15:00产品评审。"
      } else if (lowerMsg.includes("slack") || lowerMsg.includes("message")) {
        response = "您有5条未读Slack消息，其中2条需要您的回复。"
      } else if (lowerMsg.includes("summary") || lowerMsg.includes("概览")) {
        response = "今日概览：3个会议，5封邮件，2个GitHub PR需要审核，7条Slack消息。"
      } else {
        response = "我可以帮您查询日程、邮件、代码更新和消息。请告诉我您需要什么信息？"
      }

      this.addMobileChatMessage("assistant", response)
    }, 1000)
  }

  // 处理快速操作按钮点击
  handleQuickAction(action) {
    console.log(`Executing quick action: ${action}`)

    // Switch to chat screen
    this.switchScreen("chat")

    // Get the chat container and chat messages container
    const chatMessagesContainer = document.querySelector(".chat-messages")
    const chatInput = document.querySelector("#chat-input")

    // Clear existing messages
    chatMessagesContainer.innerHTML = ""

    // Add user query message based on action type
    let userQuery = ""
    let botResponse = ""

    switch (action) {
      case "daily-summary":
        userQuery = "Show me my daily summary"
        botResponse = `
          <div class="summary-card">
            <h3>Today's Overview - ${new Date().toLocaleDateString()}</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">3</div>
                <div class="summary-label">Scheduled Meetings</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">12</div>
                <div class="summary-label">Unread Messages</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">2</div>
                <div class="summary-label">Code Reviews</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">5</div>
                <div class="summary-label">Unread Emails</div>
              </div>
            </div>
          </div>
          
          <div class="meeting-section">
            <h3>Today's Schedule</h3>
            <div class="meeting-card">
              <div class="meeting-header">
                <div class="meeting-title">Daily Standup</div>
                <div class="meeting-time">9:00 AM - 9:30 AM</div>
              </div>
              <div class="meeting-details">
                <div>Attendees: Team Alpha</div>
                <div>Location: Google Meet</div>
              </div>
            </div>
            <div class="meeting-card">
              <div class="meeting-header">
                <div class="meeting-title">Product Review</div>
                <div class="meeting-time">11:00 AM - 12:00 PM</div>
              </div>
              <div class="meeting-details">
                <div>Attendees: Product Team, Design Team</div>
                <div>Location: Conference Room A</div>
              </div>
            </div>
            <div class="meeting-card">
              <div class="meeting-header">
                <div class="meeting-title">1:1 with Manager</div>
                <div class="meeting-time">3:00 PM - 3:30 PM</div>
              </div>
              <div class="meeting-details">
                <div>Attendees: You, Sarah Johnson</div>
                <div>Location: Zoom</div>
              </div>
            </div>
          </div>
        `
        break
      case "schedule-meeting":
        userQuery = "Schedule a new meeting"
        botResponse = `
          <div class="calendar-section">
            <h3>Available Time Slots</h3>
            <div class="calendar-day">
              <div class="calendar-date">Today, ${new Date().toLocaleDateString()}</div>
              <div class="meeting-card">
                <div class="meeting-time">2:00 PM - 3:00 PM</div>
                <button class="btn primary-btn">Book This Slot</button>
              </div>
              <div class="meeting-card">
                <div class="meeting-time">4:30 PM - 5:30 PM</div>
                <button class="btn primary-btn">Book This Slot</button>
              </div>
            </div>
            <div class="calendar-day">
              <div class="calendar-date">Tomorrow, ${new Date(
                new Date().getTime() + 24 * 60 * 60 * 1000,
              ).toLocaleDateString()}</div>
              <div class="meeting-card">
                <div class="meeting-time">10:00 AM - 11:00 AM</div>
                <button class="btn primary-btn">Book This Slot</button>
              </div>
              <div class="meeting-card">
                <div class="meeting-time">1:00 PM - 2:00 PM</div>
                <button class="btn primary-btn">Book This Slot</button>
              </div>
              <div class="meeting-card">
                <div class="meeting-time">3:30 PM - 4:30 PM</div>
                <button class="btn primary-btn">Book This Slot</button>
              </div>
            </div>
          </div>
        `
        break
      case "check-messages":
        userQuery = "Show me my important messages"
        botResponse = `
          <div class="tab-navigation">
            <button class="tab-btn active" data-tab="slack-messages">Slack Messages</button>
            <button class="tab-btn" data-tab="email-messages">Email Messages</button>
          </div>
          
          <div class="tab-content active" id="slack-messages">
            <div class="messages-card">
              <div class="messages-list">
                <div class="message-item">
                  <div class="message-meta">
                    <span class="channel">#project-alpha</span>
                    <span class="time">10:45 AM</span>
                  </div>
                  <div class="sender">Alex Kim</div>
                  <div class="content">@username Can you review the latest PR for the authentication module? Need your approval to proceed.</div>
                </div>
                <div class="message-item">
                  <div class="message-meta">
                    <span class="channel">Direct Message</span>
                    <span class="time">9:30 AM</span>
                  </div>
                  <div class="sender">Sarah Johnson</div>
                  <div class="content">Hi there! Are we still meeting at 3:00 PM today to discuss the roadmap?</div>
                </div>
                <div class="message-item">
                  <div class="message-meta">
                    <span class="channel">#announcements</span>
                    <span class="time">9:00 AM</span>
                  </div>
                  <div class="sender">Taylor Moore</div>
                  <div class="content">Important: We'll be deploying a new update tonight at 8:00 PM. Please make sure to commit your changes before 6:00 PM.</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="tab-content" id="email-messages">
            <div class="messages-card">
              <div class="email-list">
                <div class="email-item">
                  <div class="email-meta">
                    <span class="sender">product@company.com</span>
                    <span class="time">11:20 AM</span>
                  </div>
                  <div class="subject">Product Release: Version 2.4.0</div>
                  <div class="preview">The new version includes critical security patches and performance improvements...</div>
                </div>
                <div class="email-item">
                  <div class="email-meta">
                    <span class="sender">michael.wong@partner.com</span>
                    <span class="time">Yesterday</span>
                  </div>
                  <div class="subject">Partnership Opportunity</div>
                  <div class="preview">Following up on our conversation last week, I've attached a proposal for...</div>
                </div>
                <div class="email-item">
                  <div class="email-meta">
                    <span class="sender">hr@company.com</span>
                    <span class="time">Yesterday</span>
                  </div>
                  <div class="subject">Annual Review Scheduled</div>
                  <div class="preview">Your annual performance review has been scheduled for next Monday at 2:00 PM...</div>
                </div>
              </div>
            </div>
          </div>
        `
        break
      case "github-updates":
        userQuery = "Show me GitHub updates"
        botResponse = `
          <div class="tab-navigation">
            <button class="tab-btn active" data-tab="pull-requests">Pull Requests</button>
            <button class="tab-btn" data-tab="recent-commits">Recent Commits</button>
          </div>
          
          <div class="tab-content active" id="pull-requests">
            <div class="github-card">
              <div class="github-list">
                <div class="pr-item">
                  <div class="pr-meta">
                    <span class="repo">frontend/main</span>
                    <span class="time">2 hours ago</span>
                  </div>
                  <div class="pr-title">Fix navbar responsiveness issues</div>
                  <div class="pr-description">PR #123 by Alex Kim - Resolves the navigation collapse issue on mobile devices.</div>
                  <div class="status approved">Approved</div>
                </div>
                <div class="pr-item">
                  <div class="pr-meta">
                    <span class="repo">api/develop</span>
                    <span class="time">5 hours ago</span>
                  </div>
                  <div class="pr-title">Add pagination to user search endpoint</div>
                  <div class="pr-description">PR #87 by Jamie Smith - Implements cursor-based pagination for improved performance.</div>
                  <div class="status pending">Changes Requested</div>
                </div>
                <div class="pr-item">
                  <div class="pr-meta">
                    <span class="repo">auth-service/main</span>
                    <span class="time">Yesterday</span>
                  </div>
                  <div class="pr-title">Update OAuth flow for third-party integrations</div>
                  <div class="pr-description">PR #45 by You - Updates the authentication flow to support the new partner API changes.</div>
                  <div class="status review">Needs Review</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="tab-content" id="recent-commits">
            <div class="github-card">
              <div class="github-list">
                <div class="commit-item">
                  <div class="commit-meta">
                    <span class="repo">frontend/main</span>
                    <span class="time">1 hour ago</span>
                  </div>
                  <div class="commit-hash">a5b7c9d</div>
                  <div class="commit-message">Update button styles for better contrast</div>
                  <div class="author">Committed by Alex Kim</div>
                </div>
                <div class="commit-item">
                  <div class="commit-meta">
                    <span class="repo">api/develop</span>
                    <span class="time">3 hours ago</span>
                  </div>
                  <div class="commit-hash">e2f4g6h</div>
                  <div class="commit-message">Fix rate limiting bug in user authentication</div>
                  <div class="author">Committed by Jamie Smith</div>
                </div>
                <div class="commit-item">
                  <div class="commit-meta">
                    <span class="repo">auth-service/main</span>
                    <span class="time">Yesterday</span>
                  </div>
                  <div class="commit-hash">j8k9l0m</div>
                  <div class="commit-message">Add unit tests for password reset flow</div>
                  <div class="author">Committed by You</div>
                </div>
              </div>
            </div>
          </div>
        `
        break
      default:
        userQuery = "How can I help you today?"
        botResponse = "I'm not sure what you need help with. Please select a specific action."
    }

    // Add user message
    const userMessage = document.createElement("div")
    userMessage.className = "chat-message user-message"
    userMessage.innerHTML = `
      <div class="message-content">
        <p>${userQuery}</p>
      </div>
    `
    chatMessagesContainer.appendChild(userMessage)

    // Add bot response after a short delay
    setTimeout(() => {
      const botMessage = document.createElement("div")
      botMessage.className = "chat-message bot-message"
      botMessage.innerHTML = `
        <div class="message-content">
          ${botResponse}
        </div>
      `
      chatMessagesContainer.appendChild(botMessage)

      // Add event listeners for tabs if present
      botMessage.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const tabId = e.target.dataset.tab
          const tabParent = e.target.closest(".tab-navigation").parentElement

          // Deactivate all tabs and contents
          tabParent.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"))
          tabParent.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"))

          // Activate selected tab and content
          e.target.classList.add("active")
          tabParent.querySelector(`#${tabId}`).classList.add("active")
        })
      })

      // Scroll to bottom of chat
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight
    }, 500)

    // Clear the input
    chatInput.value = ""
  }

  // 处理建议提示点击
  handlePromptClick(promptText) {
    // 添加到聊天输入框
    const chatInput = document.querySelector(".chat-input")
    if (chatInput) {
      chatInput.value = promptText
      chatInput.focus()
    }
  }
}

// 初始化UI管理器
const uiManager = new UIManager()

// 注册UI事件处理程序
document.addEventListener("DOMContentLoaded", () => {
  // 注册主题切换按钮
  const themeToggles = [
    document.getElementById("theme-toggle"),
    document.getElementById("theme-toggle-chat"),
    document.getElementById("theme-toggle-insights"),
  ]

  themeToggles.forEach((toggle) => {
    if (toggle) {
      toggle.addEventListener("click", () => {
        uiManager.toggleTheme()
      })
    }
  })

  // 注册导航点击
  const navItems = document.querySelectorAll(".nav-item")
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const screenId = item.getAttribute("data-screen")
      uiManager.switchScreen(screenId)
    })
  })

  // 注册视图模式切换
  const viewBtns = document.querySelectorAll(".view-btn")
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-view")
      uiManager.switchViewMode(mode)
    })
  })

  // 注册移动导航点击
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item")
  mobileNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const viewId = item.getAttribute("data-mobile-view")
      uiManager.switchMobileView(viewId)
    })
  })

  // 注册聊天发送按钮
  const sendBtn = document.querySelector(".send-btn")
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const chatInput = document.querySelector(".chat-input")
      if (chatInput) {
        uiManager.handleChatInput(chatInput.value)
      }
    })
  }

  // 注册聊天输入框回车键
  const chatInput = document.querySelector(".chat-input")
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        uiManager.handleChatInput(chatInput.value)
      }
    })
  }

  // 注册移动版聊天发送
  const mobileSendBtn = document.querySelector(".mobile-chat-input button")
  if (mobileSendBtn) {
    mobileSendBtn.addEventListener("click", () => {
      const input = document.querySelector(".mobile-chat-input input")
      if (input) {
        uiManager.handleMobileChatInput(input.value)
      }
    })
  }

  // 注册移动版聊天输入框回车
  const mobileChatInput = document.querySelector(".mobile-chat-input input")
  if (mobileChatInput) {
    mobileChatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        uiManager.handleMobileChatInput(mobileChatInput.value)
      }
    })
  }

  // 注册提示点击
  const promptItems = document.querySelectorAll(".prompt-item")
  promptItems.forEach((item) => {
    item.addEventListener("click", () => {
      uiManager.handlePromptClick(item.textContent)
    })
  })

  // 注册快速操作按钮
  const actionBtns = document.querySelectorAll(".action-btn")
  actionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action")
      if (action) {
        uiManager.handleQuickAction(action)
      }
    })
  })
})

