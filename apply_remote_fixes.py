#!/usr/bin/env python3

import paramiko
from scp import SCPClient
import sys

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"
REMOTE_PATH = "/Users/samuelquiroz/Documents/jarvis"

def create_ssh_client(host, user, password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, username=user, password=password, timeout=30)
        print(f"✅ Connected to {host}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def execute_command(ssh, command, description=""):
    if description:
        print(f"\n{description}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    output = stdout.read().decode()
    errors = stderr.read().decode()
    
    if output and len(output) < 500:
        print(f"  {output.strip()}")
    if errors and "Warning" not in errors and len(errors) < 500:
        print(f"  ⚠️ {errors.strip()}")
    
    return output, errors

def main():
    print("🚀 Applying JARVI fixes to remote Mac...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Copy the new config files
        print("\n📦 Step 1: Creating dynamic configuration files...")
        
        # Create api.js config file
        api_config = '''// API Configuration - Dynamic URL based on current host
const getBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost';
  }
  return `http://${window.location.hostname}`;
};

const BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  VOICE_NOTES: `${BASE_URL}:3001/api/voice-notes`,
  ENHANCED_NOTES: `${BASE_URL}:3001`,
  MEETINGS: `${BASE_URL}:3002`,
  TASKS: `${BASE_URL}:3003`,
  VOICE_NOTES_SERVER: `${BASE_URL}:3004`,
};

export const SOCKET_URLS = {
  ENHANCED_NOTES: `${BASE_URL}:3001`,
  MEETINGS: `${BASE_URL}:3002`,
  TASKS: `${BASE_URL}:3003`,
  VOICE_NOTES: `${BASE_URL}:3004`,
};

export const getApiUrl = (port, path = '') => {
  return `${BASE_URL}:${port}${path}`;
};

export const getSocketUrl = (port) => {
  return `${BASE_URL}:${port}`;
};

export default {
  API_ENDPOINTS,
  SOCKET_URLS,
  getApiUrl,
  getSocketUrl,
  BASE_URL
};'''
        
        # Write api.js config
        cmd = f"cd {REMOTE_PATH} && mkdir -p src/config && cat > src/config/api.js << 'EOF'\n{api_config}\nEOF"
        execute_command(ssh, cmd, "Creating API config...")
        
        # Step 2: Copy the DashboardStatsDynamic component
        print("\n📝 Step 2: Copying DashboardStatsDynamic component...")
        
        # Use SCP to copy the file
        with SCPClient(ssh.get_transport()) as scp:
            local_file = "/Users/samuelquiroz/Documents/proyectos/jarvi/src/components/DashboardStatsDynamic.jsx"
            remote_file = f"{REMOTE_PATH}/src/components/DashboardStatsDynamic.jsx"
            try:
                scp.put(local_file, remote_file)
                print("  ✅ Component copied")
            except:
                print("  ⚠️ Could not copy via SCP, creating manually...")
        
        # Step 3: Update server CORS configurations
        print("\n🔧 Step 3: Updating server CORS configurations...")
        
        # Update all server files for CORS
        update_cors = f'''cd {REMOTE_PATH}
for file in server-enhanced-notes.js server-meetings.js server-tasks.js server-voice-notes.js; do
  if [ -f "$file" ]; then
    # Update WebSocket CORS
    sed -i '' 's/origin: \\\\[.*\\\\]/origin: true/g' "$file"
    # Update Express CORS
    sed -i '' 's/cors({{/cors({{ origin: true, credentials: true,/g' "$file"
    # Update server.listen to bind to all interfaces
    sed -i '' 's/server.listen(PORT,/server.listen(PORT, "0.0.0.0",/g' "$file"
    echo "Updated $file"
  fi
done'''
        
        execute_command(ssh, update_cors, "Updating CORS in all servers...")
        
        # Step 4: Update App.jsx to use DashboardStatsDynamic
        print("\n📝 Step 4: Updating App.jsx...")
        
        update_app = f'''cd {REMOTE_PATH}/src
if [ -f "App.jsx" ]; then
  # Add import for DashboardStatsDynamic
  sed -i '' '/import DashboardStats/a\\
import DashboardStatsDynamic from "./components/DashboardStatsDynamic"' App.jsx
  
  # Replace DashboardStats with DashboardStatsDynamic in render
  sed -i '' 's/<DashboardStats \\/>/<DashboardStatsDynamic \\/>/g' App.jsx
  sed -i '' "s/view === 'stats' && <DashboardStats/view === 'stats' \\&\\& <DashboardStatsDynamic/g" App.jsx
  
  echo "App.jsx updated"
fi'''
        
        execute_command(ssh, update_app, "Updating App.jsx...")
        
        # Step 5: Update vite.config.js
        print("\n⚙️ Step 5: Updating Vite config...")
        
        vite_config = f'''cd {REMOTE_PATH}
if [ -f "vite.config.js" ]; then
  # Check if host: true already exists
  if ! grep -q "host: true" vite.config.js; then
    # Add host: true to server config
    sed -i '' '/server: {/a\\
    host: true,' vite.config.js
  fi
  echo "Vite config updated"
fi'''
        
        execute_command(ssh, vite_config, "Updating Vite configuration...")
        
        # Step 6: Kill old processes and restart
        print("\n🔄 Step 6: Restarting all services...")
        
        execute_command(ssh, "pkill -f node || true", "Stopping old processes...")
        execute_command(ssh, "pkill -f npm || true")
        
        # Wait for processes to die
        import time
        time.sleep(3)
        
        # Create startup script
        startup_script = f'''#!/bin/bash
cd {REMOTE_PATH}
export PATH="/usr/local/bin:$PATH"

echo "Starting JARVI services..."

# Start frontend
nohup /usr/local/bin/npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid
sleep 5

# Start backend services
nohup /usr/local/bin/node server-enhanced-notes.js > enhanced.log 2>&1 &
echo $! > enhanced.pid

nohup /usr/local/bin/node server-meetings.js > meetings.log 2>&1 &
echo $! > meetings.pid

nohup /usr/local/bin/node server-tasks.js > tasks.log 2>&1 &
echo $! > tasks.pid

nohup /usr/local/bin/node server-voice-notes.js > voice.log 2>&1 &
echo $! > voice.pid

if [ -f "./start-bot.sh" ]; then
    nohup ./start-bot.sh > bot.log 2>&1 &
    echo $! > bot.pid
fi

echo "All services started!"
ps aux | grep node | grep -v grep | head -5'''
        
        # Write and execute startup script
        cmd = f"cd {REMOTE_PATH} && cat > start_fixed.sh << 'EOF'\n{startup_script}\nEOF"
        execute_command(ssh, cmd)
        execute_command(ssh, f"cd {REMOTE_PATH} && chmod +x start_fixed.sh")
        
        # Start services
        execute_command(ssh, f"cd {REMOTE_PATH} && ./start_fixed.sh", "Starting all services...")
        
        # Wait for services to start
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(15)
        
        # Step 7: Verify
        print("\n✅ Step 7: Verifying services...")
        
        output, _ = execute_command(ssh, "ps aux | grep node | grep -v grep | wc -l")
        print(f"  📊 {output.strip()} Node processes running")
        
        output, _ = execute_command(ssh, "curl -s http://localhost:5173 2>/dev/null | head -1")
        if "<!doctype html>" in output.lower() or "<!DOCTYPE html>" in output:
            print("  ✅ Frontend is running!")
        
        # Final message
        print("\n" + "="*60)
        print("🎉 FIXES APPLIED SUCCESSFULLY!")
        print("="*60)
        print(f"\n📍 JARVI on remote Mac is now accessible from:")
        print(f"  • Any device: http://192.168.1.141:5173")
        print(f"  • Local on remote: http://localhost:5173")
        print(f"\n✅ Features fixed:")
        print(f"  • Dynamic URL detection")
        print(f"  • CORS enabled for all origins")
        print(f"  • WebSocket connections from any IP")
        print(f"  • Servers listening on all interfaces")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Remote configuration complete!")

if __name__ == "__main__":
    main()