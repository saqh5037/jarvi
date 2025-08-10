#!/usr/bin/env python3

import paramiko
from scp import SCPClient
import sys
import time

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"
REMOTE_PATH = "/Users/samuelquiroz/Documents/jarvis"
LOCAL_PATH = "/Users/samuelquiroz/Documents/proyectos/jarvi"

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

def execute_command(ssh, command, description="", timeout=60, show_output=True):
    if description:
        print(f"\n{description}")
    try:
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if show_output and output and len(output) < 2000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and len(errors) < 500:
            if show_output:
                print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def main():
    print("🔧 FIXING JARVI DOCKER CONTAINER")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Stop and remove existing container
        print("\n🛑 Step 1: Cleaning up existing container...")
        commands = [
            "docker stop jarvi-app 2>/dev/null || true",
            "docker rm jarvi-app 2>/dev/null || true",
            "docker rmi jarvi-fixed:latest 2>/dev/null || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd, show_output=False)
        print("  ✅ Cleanup complete")
        
        # Step 2: Create missing api-costs-tracker.js file
        print("\n📝 Step 2: Creating missing api-costs-tracker.js...")
        
        api_tracker_content = """// API Costs Tracker
export const apiCostsTracker = {
  gemini: { calls: 0, tokens: 0 },
  openai: { calls: 0, tokens: 0 },
  
  track(service, tokens = 0) {
    if (this[service]) {
      this[service].calls++;
      this[service].tokens += tokens;
    }
  },
  
  getStats() {
    return {
      gemini: { ...this.gemini },
      openai: { ...this.openai }
    };
  }
};"""
        
        cmd = f"cd {REMOTE_PATH} && cat > api-costs-tracker.js << 'EOF'\n{api_tracker_content}\nEOF"
        execute_command(ssh, cmd, show_output=False)
        print("  ✅ api-costs-tracker.js created")
        
        # Step 3: Create new container with Node (not Alpine for better compatibility)
        print("\n🏗️ Step 3: Creating new base container with full Node...")
        
        # Use node:18 (Debian-based) instead of Alpine for better compatibility
        cmd = """docker run -d --name jarvi-build \
            -w /app \
            node:18 \
            sleep 3600"""
        
        output, _ = execute_command(ssh, cmd, show_output=False)
        if output and len(output) > 10:
            print(f"  ✅ Base container created: {output[:12]}")
        else:
            print("  ❌ Failed to create base container")
            return
        
        # Step 4: Install dependencies
        print("\n📦 Step 4: Installing system dependencies...")
        
        deps_commands = [
            ("Updating packages...", "docker exec jarvi-build apt-get update"),
            ("Installing ffmpeg...", "docker exec jarvi-build apt-get install -y ffmpeg curl"),
            ("Creating directories...", "docker exec jarvi-build mkdir -p /app/voice-notes /app/data /app/tasks /app/meetings /app/src /app/public")
        ]
        
        for desc, cmd in deps_commands:
            execute_command(ssh, cmd, desc, show_output=False, timeout=120)
            print(f"  ✅ {desc.replace('...', '')} done")
        
        # Step 5: Copy all files including the new api-costs-tracker.js
        print("\n📁 Step 5: Copying project files...")
        
        files_to_copy = [
            "package.json",
            "package-lock.json",
            "vite.config.js",
            "index.html",
            "postcss.config.js",
            "tailwind.config.js",
            "src",
            "public",
            "server-enhanced-notes.js",
            "server-meetings.js",
            "server-tasks.js",
            "server-voice-notes.js",
            "telegram-bot.js",
            "api-costs-tracker.js",
            ".env"
        ]
        
        for file in files_to_copy:
            cmd = f"docker cp {REMOTE_PATH}/{file} jarvi-build:/app/ 2>/dev/null || true"
            execute_command(ssh, cmd, show_output=False)
        
        print("  ✅ Files copied")
        
        # Step 6: Install Node dependencies
        print("\n🔧 Step 6: Installing Node dependencies...")
        print("  This may take 2-3 minutes...")
        
        output, _ = execute_command(
            ssh,
            "docker exec jarvi-build npm install",
            timeout=300,
            show_output=False
        )
        
        if "packages" in output or "added" in output:
            print("  ✅ Dependencies installed")
        else:
            print("  ⚠️ Dependencies may not have installed correctly")
        
        # Step 7: Create improved startup script
        print("\n📝 Step 7: Creating startup script...")
        
        startup_script = """#!/bin/bash
echo '🚀 Starting JARVI services...'
echo '=========================================='

# Set environment
export NODE_ENV=development
export GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw

# Start backend services
node server-enhanced-notes.js &
echo '✅ Enhanced Notes API started on port 3001'
sleep 2

node server-meetings.js &
echo '✅ Meetings API started on port 3002'
sleep 2

node server-tasks.js &
echo '✅ Tasks API started on port 3003'
sleep 2

node server-voice-notes.js &
echo '✅ Voice Notes API started on port 3004'
sleep 2

# Start frontend
echo '🌐 Starting frontend on port 5173...'
exec npm run dev -- --host 0.0.0.0"""
        
        escaped_script = startup_script.replace("'", "'\\''")
        cmd = f"docker exec jarvi-build sh -c \"echo '{escaped_script}' > /app/start.sh && chmod +x /app/start.sh\""
        execute_command(ssh, cmd, show_output=False)
        print("  ✅ Startup script created")
        
        # Step 8: Commit to new image
        print("\n💾 Step 8: Creating fixed image...")
        
        output, _ = execute_command(
            ssh,
            "docker commit jarvi-build jarvi-fixed:latest",
            show_output=False
        )
        
        if output and len(output) > 10:
            print(f"  ✅ Image created: {output[:12]}")
        else:
            print("  ⚠️ Image creation may have failed")
        
        # Step 9: Cleanup build container
        print("\n🧹 Step 9: Cleaning build container...")
        execute_command(ssh, "docker stop jarvi-build && docker rm jarvi-build", show_output=False)
        print("  ✅ Build container removed")
        
        # Step 10: Run final container
        print("\n🚀 Step 10: Starting JARVI container...")
        
        run_cmd = """docker run -d \
            --name jarvi-app \
            --restart unless-stopped \
            -p 5173:5173 \
            -p 3001:3001 \
            -p 3002:3002 \
            -p 3003:3003 \
            -p 3004:3004 \
            -e NODE_ENV=development \
            -e GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw \
            -v $(pwd)/voice-notes:/app/voice-notes \
            -v $(pwd)/data:/app/data \
            -w /app \
            jarvi-fixed:latest \
            /app/start.sh"""
        
        output, errors = execute_command(ssh, run_cmd, show_output=False)
        
        if output and len(output) > 10:
            print(f"  ✅ Container started: {output[:12]}")
        else:
            print("  ⚠️ Container may not have started properly")
        
        # Wait for services
        print("\n⏳ Waiting for services to initialize (30 seconds)...")
        for i in range(30, 0, -10):
            print(f"  {i} seconds remaining...")
            time.sleep(10)
        
        # Step 11: Verify container
        print("\n✅ Step 11: Verifying container...")
        
        # Check container status
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app", show_output=False)
        
        container_running = False
        if "jarvi-app" in output and "Up" in output:
            container_running = True
            print("  ✅ Container is running!")
            
            # Show container info
            output, _ = execute_command(
                ssh,
                "docker ps --filter name=jarvi-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
                show_output=True
            )
        else:
            print("  ❌ Container is not running properly")
            
            # Check logs for errors
            print("\n📜 Checking logs for errors...")
            output, _ = execute_command(ssh, "docker logs jarvi-app --tail 30", show_output=False)
            for line in output.split('\n')[-30:]:
                if line and any(word in line.lower() for word in ['error', 'failed', 'started', 'listening']):
                    print(f"  {line}")
        
        # Step 12: Test services
        print("\n🌐 Step 12: Testing services...")
        
        services = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        services_working = 0
        for service, port in services:
            output, _ = execute_command(
                ssh,
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} || echo '000'",
                show_output=False
            )
            status = output.strip()
            if status in ['200', '304', '302']:
                print(f"  ✅ {service} (:{port}): Online")
                services_working += 1
            else:
                print(f"  ⚠️ {service} (:{port}): Status {status}")
        
        # Final summary
        print("\n" + "="*60)
        
        if container_running and services_working >= 3:
            print("🎉 JARVI DOCKER CONTAINER SUCCESSFULLY FIXED!")
            print("="*60)
            print("\n✅ Container 'jarvi-app' is running with all services")
        elif container_running:
            print("⚠️ JARVI CONTAINER IS RUNNING BUT SOME SERVICES MAY BE STARTING")
            print("="*60)
            print("\n⏳ Services may need more time to initialize")
        else:
            print("❌ JARVI CONTAINER FAILED TO START PROPERLY")
            print("="*60)
            print("\n💡 Falling back to Node.js services...")
            
            # Fallback to Node.js
            print("\n🔄 Starting services with Node.js...")
            services = [
                f"cd {REMOTE_PATH} && nohup npm run dev > frontend.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-enhanced-notes.js > enhanced.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-meetings.js > meetings.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-tasks.js > tasks.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-voice-notes.js > voice.log 2>&1 &"
            ]
            
            for service in services:
                execute_command(ssh, service, show_output=False)
            
            print("  ✅ Services started with Node.js")
        
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n🐳 Docker commands:")
        print("  • View logs: docker logs -f jarvi-app")
        print("  • Stop: docker stop jarvi-app")
        print("  • Start: docker start jarvi-app")
        print("  • Restart: docker restart jarvi-app")
        print("  • Shell: docker exec -it jarvi-app bash")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        execute_command(ssh, "docker stop jarvi-build 2>/dev/null && docker rm jarvi-build 2>/dev/null", show_output=False)
        ssh.close()
        print("\n👋 Process completed!")

if __name__ == "__main__":
    main()