# Triforce

Triforce is a powerful AI assistant application that connects to your work tools, enhancing productivity through intelligent integration and automation.

## Features

- **AI Assistant**: Chat with an intelligent assistant powered by OpenAI's GPT models
- **Multi-Tool Integration**: Connect and use various external services:
  - Google Workspace (Gmail, Calendar)
  - Slack
  - Notion
- **Authentication**:
  - WebAuthn support for passwordless authentication
  - OAuth integration with third-party services
- **Responsive UI**: Modern, responsive interface with resizable panels
- **Real-time Processing**: Stream-based AI responses for immediate feedback

## Architecture

- **Frontend**: Next.js 14 with App Router, React, and Tailwind CSS
- **Authentication**: NextAuth.js with WebAuthn support
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Vercel AI SDK with OpenAI integration
- **Tool Integration**: MCP (Model Context Protocol) for external service connections

## Setup and Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OAuth application credentials for:
  - Google
  - Slack
  - Notion

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd triforce
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file with the following variables:

   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/triforce"

   # Authentication
   AUTH_SECRET="your-secure-auth-secret"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth Credentials
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   SLACK_CLIENT_ID="your-slack-client-id"
   SLACK_CLIENT_SECRET="your-slack-client-secret"
   NOTION_CLIENT_ID="your-notion-client-id"
   NOTION_CLIENT_SECRET="your-notion-client-secret"

   # MCP Server
   MCP_SERVER_BASE_URL="https://your-mcp-server.com/sse"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. Initialize the database

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Usage

1. **Authentication**: Register or log in using WebAuthn or traditional methods
2. **Service Connection**: Connect your work accounts (Google, Slack, Notion)
3. **Chat Interface**: Interact with the AI assistant through the chat panel
4. **Tool Integration**: The assistant can use connected services to perform tasks on your behalf

## Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Import the project in Vercel dashboard
3. Set the required environment variables
4. Deploy with the following settings:

   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. Make sure to include a `vercel.json` file at the root of your project:

```json
{
  "version": 2,
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/" }],
  "framework": "nextjs"
}
```

## Troubleshooting

### Common Issues

1. **MCP Connection Issues**: Ensure the MCP server is running and accessible, and the user ID is correctly passed
2. **OAuth Integration Errors**: Verify redirect URIs are correctly configured in provider dashboards
3. **404 Errors on Deployment**: Ensure vercel.json is properly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
