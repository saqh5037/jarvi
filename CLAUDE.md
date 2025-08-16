# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JARVI is a multi-service AI assistant application built with React (Vite) frontend and multiple Node.js backend services. It integrates with Telegram, Notion, and various AI services (OpenAI, Claude, Gemini) to provide voice transcription, task management, meeting notes, and intelligent assistance features.

## Development Commands

### Primary Development
```bash
# Start all services (frontend + all backends + Telegram bot)
sh start-network.sh

# Start frontend only
npm run dev

# Start main backend server
npm run server
# or
node server.js

# Build for production
npm run build

# Lint code
npm run lint
```

### Individual Backend Services
```bash
node server-enhanced-notes.js   # Port 3001 - Enhanced notes service
node server-meetings.js         # Port 3002 - Meeting management
node server-tasks.js            # Port 3003 - Task management
node server-voice-notes.js      # Port 3004 - Voice notes processing
node server-ai-classifier.js    # Port 3005 - AI classification
node server-edge-tts.js         # Port 3007 - Edge TTS service
node telegram-bot.js            # Telegram bot integration
```

## Architecture

### Frontend Structure
- **Main App**: `src/App.jsx` - Router between different dashboard views
- **Components**: `src/components/` - Modular React components
  - Dashboard modules: `MainDashboard`, `ModernDashboard`, `CleanModernDashboard`
  - Feature modules: `TasksModule`, `VoiceNotesModule`, `MeetingsModule`, `RemindersModule`
  - Voice/Reading systems: `VoiceReadingSystem`, `KaraokeReadingMode`, `CollaborativeReadingMode`
- **Context**: `src/context/JarviContext.jsx` - Global state management
- **Hooks**: Custom hooks for API integration and TTS functionality

### Backend Services Architecture
The application uses a microservices architecture with separate Node.js servers:

1. **Main Server** (`server.js`) - WebSocket communication and JARVI command processing
2. **Enhanced Notes** (`server-enhanced-notes.js`) - Advanced note management with AI classification
3. **Meetings** (`server-meetings.js`) - Meeting minutes and audio transcription
4. **Tasks** (`server-tasks.js`) - Task and todo management with archiving
5. **Voice Notes** (`server-voice-notes.js`) - Voice note processing and transcription
6. **AI Classifier** (`server-ai-classifier.js`) - Prompt classification and AI routing
7. **Edge TTS** (`server-edge-tts.js`) - Text-to-speech with premium voices

### External Integrations
- **Telegram Bot**: Handles voice messages, commands, and integrates with all backend services
- **Notion API**: Syncs data to Notion databases for persistence
- **AI Services**: Supports OpenAI Whisper, Google Gemini, and Claude APIs for transcription and processing

## API Configuration

Environment variables are stored in `.env`:
- `TELEGRAM_BOT_TOKEN` - Telegram bot authentication
- `OPENAI_API_KEY` - OpenAI API for Whisper transcription
- `GEMINI_API_KEY` - Google Gemini for free transcription
- `CLAUDE_API_KEY` - Claude API integration
- `NOTION_TOKEN` - Notion API authentication

## Key Features

1. **Voice Processing Pipeline**: Audio → Transcription (Gemini/OpenAI/Local) → AI Processing → Storage
2. **Multi-modal Input**: Web interface, Telegram bot, voice commands
3. **Real-time Updates**: WebSocket connections for live data synchronization
4. **Archive System**: SQLite-based archiving for tasks and notes
5. **AI Classification**: Intelligent routing of prompts to appropriate AI models

## Testing

```bash
# Run individual test files
node test-tasks.js
node test-telegram-bot.js
node test-modifications.js

# Test HTML interfaces
# Open in browser: test-tasks.html, test-voice-notes.html, test-upload.html
```

## Network Access

The application supports multiple access modes:
- **Local**: `http://localhost:5173`
- **LAN**: `http://192.168.1.125:5173`
- **External**: Configure port forwarding (1745 → 5173)

## Important Notes

- All backend services must be running for full functionality
- Voice files are stored in `voice-notes/` and `tasks/audio/` directories
- Database files are in `tasks/data/` (SQLite for archives, JSON for active data)
- The Telegram bot requires proper token configuration in `.env`
- Frontend uses Vite for fast HMR development
- Uses ES6 modules throughout (type: "module" in package.json)