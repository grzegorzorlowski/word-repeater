# WordRepeater AI

A responsive web application (mobile-first) that enables rapid creation of educational flashcards from pasted text and learning them using a simple spaced repetition algorithm. The MVP provides both automatic (AI) and manual flashcard creation, a basic user account system, and generation limits.

## Description

WordRepeater AI is designed to lower the time barrier to creating high-quality flashcards and increase the adoption of the spaced repetition learning method. The application allows users to:

- Generate flashcards automatically from pasted text (up to 5000 characters) using AI
- Create flashcards manually
- View, edit, and delete flashcards
- Learn flashcards using a spaced repetition algorithm
- Manage their account with authentication and GDPR compliance

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing for better code quality and IDE support
- **Tailwind 4** - Utility-first CSS framework for styling
- **Shadcn/ui** - Component library for React UI elements

### Backend
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - User authentication
  - SDK with multiple language support
  - Open source and self-hostable

### AI Services
- **OpenRouter.ai** - Access to various AI models (OpenAI, Anthropic, Google, etc.)
- Cost optimization and API rate limiting

### CI/CD and Hosting
- **GitHub Actions** - Continuous integration and deployment
- **DigitalOcean** - Hosting via Docker containers

## Getting Started Locally

### Prerequisites
- Node.js 22.14.0 (as specified in `.nvmrc`)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/word-repeater.git
cd word-repeater
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Configure the following environment variables:
- Supabase credentials (URL and API keys)
- OpenRouter API key for AI functionality

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production-ready application
- `npm run preview` - Preview the built application locally
- `npm run lint` - Run ESLint to check for code quality issues
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code using Prettier

## Project Scope

### MVP Features

#### In Scope
- AI-powered flashcard generation from pasted text (up to 5000 characters)
- Manual flashcard creation, viewing, editing, and deletion
- Simple user account system with email/password authentication
- Password reset via email
- Integration with a ready-made spaced repetition algorithm
- One flashcard at a time acceptance flow
- Session authentication with automatic logout
- Basic GDPR compliance (terms acceptance, privacy policy, account deletion)
- Internal analytics (no user-facing statistics panel)

#### Out of Scope (MVP)
- Advanced custom repetition algorithms (full SM-2/Anki/SM-18)
- Importing multiple file formats (PDF/DOCX, etc.) - only copy-paste
- Sharing decks, publications, and collaboration between users
- Integrations with external educational platforms
- Native mobile applications (responsive web only)
- Editing flashcards before acceptance
- User-facing statistics panel

### Success Metrics
- 75% of AI-generated flashcards accepted by users
- 75% of all flashcards created using AI
- Generation time ≤10 seconds (90th percentile)
- Average generation cost ≤0.20 PLN per session
- High learning activity and user retention rates

## Project Status

🚧 **In Development (MVP)** 🚧

This project is currently in the MVP development phase. The current status includes:

- ✅ Project setup and configuration
- ✅ Basic UI structure with Astro and React
- 🔄 Flashcard generation with AI
- 🔄 User authentication system
- 🔄 Spaced repetition algorithm integration
- 🔄 Database schema and API endpoints

## Additional Documentation

For more detailed information about the project:

- [Product Requirements Document](.ai/prd.md) - Complete PRD with functional requirements and user stories
- [Tech Stack Details](.ai/tech-stack.md) - Detailed technology choices and rationale
- [MVP Document](Docs/mvp.md) - Minimum viable product specifications

## License

MIT
