#!/bin/bash

# Start all JARVI services
echo "Starting JARVI services..."

# Start frontend dev server in background
npm run dev &

# Start all backend services
node server-enhanced-notes.js &
node server-meetings.js &
node server-tasks.js &
node server-voice-notes.js &

# Start Telegram bot
./start-bot.sh &

echo "All services started!"
echo "Frontend: http://localhost:5173"
echo "APIs running on ports 3001-3004"

# Keep script running
wait