/**
 * MCP Demo - Main
 * 处理MCP工具集成的模拟和初始化
 */

// 模拟MCP API调用管理器
class MCPManager {
  constructor(authManager) {
    this.authManager = authManager
    this.isReady = false

    // 保存上一次的查询结果用于演示
    this.cachedResults = {
      slack: {
        messages: [
          {
            sender: "Alex Chen",
            text: "UI设计稿已上传，请查看",
            time: "1小时前",
            channel: "设计讨论",
          },
          {
            sender: "Sarah Wong",
            text: "今天下午3点有团队会议，请准时参加",
            time: "2小时前",
            channel: "团队通知",
          },
          {
            sender: "Michael Zhang",
            text: "服务器更新已完成，所有系统正常运行",
            time: "昨天",
            channel: "技术支持",
          },
        ],
        channels: ["设计讨论", "团队通知", "技术支持", "随便聊聊", "产品开发"],
      },
      github: {
        repositories: ["frontend-app", "backend-api", "design-system", "mobile-app"],
        pullRequests: [
          {
            title: "添加新的数据可视化组件",
            repo: "frontend-app",
            author: "Lisa Wang",
            status: "等待审核",
          },
          {
            title: "API性能优化",
            repo: "backend-api",
            author: "David Chen",
            status: "变更请求",
          },
          {
            title: "修复移动端布局问题",
            repo: "mobile-app",
            author: "John Smith",
            status: "等待审核",
          },
        ],
        commits: [
          {
            message: "更新README文档",
            repo: "design-system",
            author: "You",
            time: "今天上午10:23",
          },
          {
            message: "修复导航栏响应式问题",
            repo: "frontend-app",
            author: "Lisa Wang",
            time: "昨天",
          },
          {
            message: "添加用户认证单元测试",
            repo: "backend-api",
            author: "David Chen",
            time: "昨天",
          },
        ],
      },
      googleCalendar: {
        events: [
          {
            title: "团队周会",
            start: "2023-09-18T09:00:00",
            end: "2023-09-18T09:30:00",
            attendees: 12,
          },
          {
            title: "产品规划",
            start: "2023-09-19T14:00:00",
            end: "2023-09-19T15:00:00",
            attendees: 5,
          },
          {
            title: "UI评审",
            start: "2023-09-20T11:00:00",
            end: "2023-09-20T12:00:00",
            attendees: 3,
          },
          {
            title: "代码审核",
            start: "2023-09-21T15:30:00",
            end: "2023-09-21T16:30:00",
            attendees: 2,
          },
          {
            title: "周总结",
            start: "2023-09-22T16:00:00",
            end: "2023-09-22T16:30:00",
            attendees: 12,
          },
        ],
      },
      gmail: {
        emails: [
          {
            subject: "公司全员会议通知",
            sender: "HR部门",
            time: "1小时前",
            read: false,
          },
          {
            subject: "本月项目进度报告",
            sender: "项目管理办公室",
            time: "3小时前",
            read: false,
          },
          {
            subject: "新员工入职欢迎",
            sender: "HR部门",
            time: "昨天",
            read: true,
          },
          {
            subject: "系统维护通知",
            sender: "IT部门",
            time: "昨天",
            read: true,
          },
          {
            subject: "客户反馈总结",
            sender: "客户服务团队",
            time: "2天前",
            read: true,
          },
        ],
      },
    }
  }

  // 初始化MCP服务连接
  initialize() {
    return new Promise((resolve, reject) => {
      console.log("初始化MCP服务连接...")

      // 检查授权状态
      const slackConnected = this.authManager.isConnected("slack")
      const githubConnected = this.authManager.isConnected("github")
      const googleConnected = this.authManager.isConnected("google")

      if (!slackConnected && !githubConnected && !googleConnected) {
        console.warn("没有连接任何服务，功能将受限")
      }

      // 模拟初始化过程
      setTimeout(() => {
        this.isReady = true
        console.log("MCP服务连接初始化完成")
        resolve()
      }, 1000)
    })
  }

  // 查询Slack消息
  async querySlackMessages(options = {}) {
    this.checkServiceConnection("slack")

    // 模拟API调用延迟
    await this.simulateApiDelay()

    // 返回缓存的演示数据
    return this.cachedResults.slack.messages
  }

  // 查询Slack频道
  async getSlackChannels() {
    this.checkServiceConnection("slack")

    await this.simulateApiDelay()

    return this.cachedResults.slack.channels
  }

  // 查询GitHub仓库
  async getGitHubRepositories() {
    this.checkServiceConnection("github")

    await this.simulateApiDelay()

    return this.cachedResults.github.repositories
  }

  // 查询GitHub PR
  async getGitHubPullRequests(options = {}) {
    this.checkServiceConnection("github")

    await this.simulateApiDelay()

    return this.cachedResults.github.pullRequests
  }

  // 查询GitHub提交
  async getGitHubCommits(options = {}) {
    this.checkServiceConnection("github")

    await this.simulateApiDelay()

    return this.cachedResults.github.commits
  }

  // 查询Google日历事件
  async getCalendarEvents(options = {}) {
    this.checkServiceConnection("google")

    await this.simulateApiDelay()

    return this.cachedResults.googleCalendar.events
  }

  // 查询Gmail邮件
  async getEmails(options = {}) {
    this.checkServiceConnection("google")

    await this.simulateApiDelay()

    return this.cachedResults.gmail.emails
  }

  // 生成工作总结
  async generateWorkSummary() {
    await this.simulateApiDelay()

    // 模拟基于各种数据的工作总结
    const summary = {
      meetings: {
        today: 2,
        upcoming: 3,
        totalTime: "3小时15分钟",
      },
      messages: {
        unread: 5,
        important: 2,
        teams: ["设计", "开发", "产品"],
      },
      code: {
        pullRequests: 3,
        pendingReview: 2,
        commits: 5,
      },
      emails: {
        unread: 2,
        important: 1,
      },
      insights: {
        mostActiveProject: "frontend-app",
        topCollaborator: "Lisa Wang",
        productivityScore: 7.8,
      },
    }

    return summary
  }

  // 模拟API调用延迟
  simulateApiDelay() {
    const delay = Math.floor(Math.random() * 500) + 300 // 300-800ms随机延迟
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  // 检查服务是否已连接
  checkServiceConnection(service) {
    if (!this.isReady) {
      throw new Error("MCP服务尚未初始化")
    }

    if (!this.authManager.isConnected(service)) {
      throw new Error(`${service}服务未连接，请先完成授权`)
    }
  }
}

// 在页面加载完成后初始化MCP服务
document.addEventListener("DOMContentLoaded", async () => {
  // 获取之前定义的auth管理器
  const mcpManager = new MCPManager(window.authManager)

  try {
    await mcpManager.initialize()
    // 将MCP管理器暴露为全局变量，便于调试和示例
    window.mcpManager = mcpManager

    console.log("MCP Demo应用初始化完成")
  } catch (error) {
    console.error("MCP初始化失败:", error)
  }

  // 如果有任何一个服务已连接，尝试预加载一些数据
  if (authManager.isConnected("slack") || authManager.isConnected("github") || authManager.isConnected("google")) {
    try {
      // 预加载工作总结数据
      mcpManager.generateWorkSummary().then((summary) => {
        console.log("加载工作总结数据成功")
      })
    } catch (error) {
      console.log("预加载数据失败:", error)
    }
  }
})

