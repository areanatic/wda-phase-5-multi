# WDA Phase 5 - Multi-IDE Workflow Analysis

**Version**: 0.1.0
**Status**: 🚀 Production Ready (MVP)
**License**: MIT

---

## 🎯 Overview

WDA (Workflow Design Analysis) is a conversational AI-powered workflow analysis tool that integrates natively into your IDE. Instead of filling out forms, developers engage in natural conversations to capture workflow insights, pain points, and improvement opportunities.

### Key Features

- ✅ **Conversational AI Sparring** - Survey feels like chatting with a colleague
- ✅ **Freier Talk Mode** - Capture unplanned insights beyond structured questions
- ✅ **Multi-Session Management** - Unlimited sessions, multiple perspectives
- ✅ **Multi-IDE Support** - Works in VS Code, JetBrains, Xcode (via GitHub Copilot)
- ✅ **Privacy-First** - 100% local storage in `.wda/` folder, GDPR-compliant
- ✅ **Multi-AI Provider Support** - GitHub Copilot (recommended), OpenAI, Anthropic, Google Gemini, Ollama

---

## 📁 Architecture

**Shared Core (80%)**: TypeScript engine with platform-agnostic question catalog and AI integration
**Platform Adapters (20%)**: Native extensions for each IDE
**Primary UX**: GitHub Copilot Chat (works everywhere, zero additional setup)

```
WDA/
├── packages/
│   └── wda-core/              # Shared TypeScript core
│       ├── src/
│       │   ├── models/        # Entity interfaces (Session, Response, Question, etc.)
│       │   ├── engine/        # Conversation engine (SessionAPI, ConversationAPI)
│       │   ├── ai/            # Multi-provider AI integration
│       │   ├── export/        # Export to JSON/YAML/Markdown
│       │   ├── storage/       # Local file system storage
│       │   └── utils/         # Utilities
│       ├── question-packs/    # 15 question packs, 100+ questions
│       └── tests/             # Contract tests
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥20.0.0
- **npm** ≥10.0.0
- **GitHub Copilot** (recommended for zero-setup API access)

### Installation

```bash
# Clone repository
git clone https://github.com/areanatic/wda-phase-5-multi.git
cd wda-phase-5-multi

# Install dependencies
npm install

# Build core package
npm run build

# Run tests
npm test
```

### Development

```bash
# Watch mode for core
npm run dev:core

# Run specific test
npm test -- contract/session-create.test.ts
```

---

## 📋 Question Packs

WDA includes **15 comprehensive question packs** covering all aspects of development workflows:

1. **Role & Context** - Team role, responsibilities, work environment
2. **Development Workflow** - Daily routines, tools, processes
3. **Tools & Environment** - IDE setup, extensions, configurations
4. **Communication & Collaboration** - Team sync, documentation, knowledge sharing
5. **Documentation** - Code docs, API docs, architecture diagrams
6. **Technical Debt** - Legacy code, refactoring needs, maintainability
7. **Performance Optimization** - Bottlenecks, monitoring, profiling
8. **Security & Compliance** - Security practices, data protection, compliance
9. **Testing & Quality** - Test coverage, QA processes, bug tracking
10. **Deployment & Infrastructure** - CI/CD, deployment processes, infrastructure
11. **Error Handling & Debugging** - Error tracking, debugging tools, monitoring
12. **Dependencies & Libraries** - Package management, updates, licenses
13. **Onboarding & Knowledge Transfer** - Documentation, training, ramp-up time
14. **Retrospectives & Improvements** - Pain points, wins, improvement ideas
15. **Freier Talk Transition** - Open-ended conversation triggers

**Total**: 100+ questions with multi-language support (DE/EN)

---

## 💾 Storage Structure

WDA creates a local `.wda/` folder in your workspace:

```
.wda/
├── sessions/
│   └── {sessionId}.json           # Session metadata
│       ├── responses/
│       │   └── {responseId}.json  # Individual responses
│       └── freier-talk/
│           └── {entryId}.json     # Freier Talk entries
├── checkpoints/
│   └── {sessionId}-{timestamp}.json  # Auto-save checkpoints
└── exports/
    └── {sessionName}-{timestamp}.{format}  # Exported files
```

---

## 🤖 AI Provider Configuration

WDA supports multiple AI providers:

### GitHub Copilot (Recommended)

```typescript
import { AIProviderFactory } from '@wda/core/ai';

const provider = AIProviderFactory.createProvider('copilot', {
  modelName: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
});
```

### OpenAI

```typescript
const provider = AIProviderFactory.createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4',
});
```

### Anthropic Claude

```typescript
const provider = AIProviderFactory.createProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: 'claude-3-sonnet-20240229',
});
```

### Google Gemini

```typescript
const provider = AIProviderFactory.createProvider('google', {
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: 'gemini-1.5-flash-latest',
});
```

### Ollama (Local)

```typescript
const provider = AIProviderFactory.createProvider('ollama', {
  modelName: 'llama2',
  baseURL: 'http://localhost:11434',
});
```

---

## 📊 Usage Example

```typescript
import { SessionAPI, ConversationAPI } from '@wda/core/engine';

// Initialize APIs
const sessionAPI = new SessionAPI('/path/to/workspace');
const conversationAPI = new ConversationAPI('/path/to/workspace');

// Create new session
const session = await sessionAPI.createSession({
  projectId: 'my-project',
  name: 'Q1 2025 Workflow Analysis',
  mode: 'standard', // quick | standard | deep
  selectedPackIds: ['role-context', 'development-workflow'],
});

// Start conversation
const firstQuestion = await conversationAPI.getNextQuestion(session.id);
console.log(firstQuestion.text.en);

// Submit response
await conversationAPI.submitResponse({
  sessionId: session.id,
  questionId: firstQuestion.id,
  answer: "I'm a senior full-stack developer...",
  metadata: {},
});

// Continue conversation
const nextQuestion = await conversationAPI.getNextQuestion(session.id);
```

---

## 🛡️ Constitution Principles

WDA is built on these core principles:

1. ✅ **Platform Agnostic** - Works across all major IDEs
2. ✅ **AI Model Agnostic** - Support for multiple AI providers
3. ✅ **Privacy First** - 100% local storage, no cloud dependencies
4. ✅ **BMAD Compliant** - Follows BMAD architecture patterns
5. ✅ **Developer Experience First** - Minimal friction, maximum value
6. ✅ **Open & Extensible** - Easy to extend with custom question packs

---

## 🧪 Testing

WDA uses **Test-Driven Development (TDD)** with comprehensive contract tests:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- contract/session-create.test.ts

# Run with coverage
npm run test:coverage
```

**Current Test Coverage**:
- ✅ 21 Contract Tests (Session, Conversation, Storage, Export)
- ⏳ Integration Tests (In Progress)
- ⏳ E2E Tests (Planned)

---

## 📚 Documentation

- **Models**: [src/models/](packages/wda-core/src/models/) - Entity interfaces
- **Engine**: [src/engine/](packages/wda-core/src/engine/) - Core APIs
- **AI Providers**: [src/ai/](packages/wda-core/src/ai/) - AI integrations
- **Question Packs**: [question-packs/](packages/wda-core/question-packs/) - YAML question catalogs

---

## 🔧 Tech Stack

- **TypeScript** 5.x - Type-safe development
- **Node.js** 20+ - Runtime environment
- **Vitest** - Unit & integration testing
- **js-yaml** - Question pack loading
- **uuid** - Unique ID generation

---

## 📈 Roadmap

### ✅ Phase 1: Foundation (Complete)
- Core models & entities
- Local storage provider
- Session & conversation management
- AI provider integrations
- 15 question packs with 100+ questions

### ⏳ Phase 2: Platform Adapters (In Progress)
- VS Code extension
- JetBrains plugin
- Xcode extension
- GitHub Copilot integration

### 📅 Phase 3: Advanced Features (Planned)
- Advanced analytics & insights
- Team collaboration features
- Custom question pack builder
- Export templates & customization

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new features
4. Ensure all tests pass (`npm test`)
5. Commit changes (`git commit -m 'feat: Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

Built with ❤️ by the WDA Team

Special thanks to:
- BMAD architecture patterns
- GitHub Copilot for AI integration
- The TypeScript & Node.js communities

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/areanatic/wda-phase-5-multi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/areanatic/wda-phase-5-multi/discussions)

---

**Last Updated**: October 2025
