#!/bin/bash

# Update all localhost references to use dynamic URLs

echo "🔧 Updating all components to use dynamic URLs..."

# List of files to update
FILES=(
  "src/components/TodoModuleFixed.jsx"
  "src/components/VoiceNotesDashboard.jsx"
  "src/components/VoiceNotesModuleFinal.jsx"
  "src/components/EnhancedVoiceNotesModule.jsx"
  "src/components/TasksModuleNew.jsx"
  "src/components/TodoModule.jsx"
  "src/components/VoiceNotesModule.jsx"
  "src/components/JarviChat.jsx"
  "src/components/VoiceNotesProcessor.jsx"
  "src/components/RemindersModule.jsx"
  "src/components/VoiceNotesModuleEnhanced.jsx"
  "src/components/TasksModule.jsx"
  "src/components/EnhancedMeetingsModule.jsx"
  "src/components/MeetingsModule.jsx"
  "src/components/CleanModernDashboard.jsx"
  "src/components/VoiceNotesModuleDynamic.jsx"
  "src/components/InterestsModule.jsx"
)

# Function to get base URL dynamically
GET_BASE_URL='const getBaseUrl = () => window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost" : `http://${window.location.hostname}`;'

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "  Updating $FILE..."
    
    # Create backup
    cp "$FILE" "$FILE.bak"
    
    # Add getBaseUrl function if not present and replace localhost URLs
    cat > "$FILE.tmp" << 'EOF'
// Dynamic URL configuration
const getBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost';
  }
  return `http://${window.location.hostname}`;
};
const BASE_URL = getBaseUrl();

EOF
    
    # Replace all localhost references
    sed -e "s|'http://localhost:\([0-9]*\)'|BASE_URL + ':\1'|g" \
        -e 's|"http://localhost:\([0-9]*\)"|BASE_URL + ":\1"|g' \
        -e "s|\`http://localhost:\([0-9]*\)|\`\${BASE_URL}:\1|g" \
        "$FILE" >> "$FILE.tmp"
    
    # Replace the original file
    mv "$FILE.tmp" "$FILE"
  fi
done

echo "✅ All components updated!"
echo "🔄 Restarting Vite to apply changes..."

# Kill and restart Vite
pkill -f "vite" || true
sleep 2

echo "✅ Update complete! Please restart npm run dev manually"