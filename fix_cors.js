// Add CORS headers to all servers
const fs = require('fs');
const files = ['server-enhanced-notes.js', 'server-meetings.js', 'server-tasks.js', 'server-voice-notes.js'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if CORS is already properly configured
    if (\!content.includes("origin: true")) {
      // Replace existing CORS config with permissive one
      content = content.replace(
        /cors\(\{[^}]*\}\)/g,
        "cors({ origin: true, credentials: true })"
      );
      
      // If no CORS config found, add it after express()
      if (\!content.includes('cors(')) {
        content = content.replace(
          "const app = express();",
          "const app = express();\napp.use(cors({ origin: true, credentials: true }));"
        );
      }
      
      fs.writeFileSync(file, content);
      console.log(`✅ Updated CORS in ${file}`);
    } else {
      console.log(`✓ ${file} already has proper CORS`);
    }
  }
});
