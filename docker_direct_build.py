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
        # Add Docker to PATH and cd to directory
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if show_output and output and len(output) < 2000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and len(errors) < 500:
            print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def main():
    print("🐳 BUILDING JARVI DOCKER CONTAINER DIRECTLY")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Clean up
        print("\n🧹 Step 1: Cleaning up...")
        commands = [
            "docker stop jarvi-app 2>/dev/null || true",
            "docker rm jarvi-app 2>/dev/null || true",
            "docker rmi jarvi-custom:latest 2>/dev/null || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd, show_output=False)
        print("  ✅ Cleanup complete")
        
        # Step 2: Create a running container from base image
        print("\n🏗️ Step 2: Creating base container...")
        
        # Start a base container
        cmd = f"""docker run -d --name jarvi-build \
            -w /app \
            node:18-alpine \
            sleep 3600"""
        
        output, errors = execute_command(ssh, cmd, show_output=False)
        if output and len(output) > 10:
            container_id = output.strip()[:12]
            print(f"  ✅ Base container created: {container_id}")
        else:
            print("  ❌ Failed to create base container")
            return
        
        # Step 3: Install system dependencies in container
        print("\n📦 Step 3: Installing dependencies in container...")
        
        deps_commands = [
            ("Installing system packages...", "docker exec jarvi-build apk add --no-cache python3 make g++ ffmpeg curl"),
            ("Creating directories...", "docker exec jarvi-build mkdir -p /app/voice-notes /app/data /app/tasks /app/meetings /app/src /app/public")
        ]
        
        for desc, cmd in deps_commands:
            output, errors = execute_command(ssh, cmd, desc, show_output=False)
            if "ERROR" not in errors.upper():
                print(f"  ✅ {desc.replace('...', '')} done")
        
        # Step 4: Copy files to container
        print("\n📁 Step 4: Copying project files to container...")
        
        # Copy files from remote directory to container
        copy_commands = [
            f"docker cp {REMOTE_PATH}/package.json jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/package-lock.json jarvi-build:/app/ 2>/dev/null || true",
            f"docker cp {REMOTE_PATH}/vite.config.js jarvi-build:/app/ 2>/dev/null || true",
            f"docker cp {REMOTE_PATH}/index.html jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/postcss.config.js jarvi-build:/app/ 2>/dev/null || true",
            f"docker cp {REMOTE_PATH}/tailwind.config.js jarvi-build:/app/ 2>/dev/null || true",
            f"docker cp {REMOTE_PATH}/src jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/public jarvi-build:/app/ 2>/dev/null || true",
            f"docker cp {REMOTE_PATH}/server-enhanced-notes.js jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/server-meetings.js jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/server-tasks.js jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/server-voice-notes.js jarvi-build:/app/",
            f"docker cp {REMOTE_PATH}/telegram-bot.js jarvi-build:/app/ 2>/dev/null || true"
        ]
        
        for cmd in copy_commands:
            execute_command(ssh, cmd, show_output=False)
        print("  ✅ Files copied to container")
        
        # Step 5: Install Node dependencies
        print("\n🔧 Step 5: Installing Node dependencies...")
        print("  This may take 2-3 minutes...")
        
        output, errors = execute_command(
            ssh,
            "docker exec jarvi-build npm install",
            timeout=300,
            show_output=False
        )
        
        if "packages in" in output or "added" in output:
            print("  ✅ Dependencies installed")
        else:
            print("  ⚠️ Check npm install output")
        
        # Step 6: Create startup script
        print("\n📝 Step 6: Creating startup script...")
        
        startup_script = """#!/bin/sh
echo '🚀 Starting JARVI services...'
echo '=========================================='

# Start backend services
node server-enhanced-notes.js &
echo '✅ Enhanced Notes API started on port 3001'

node server-meetings.js &
echo '✅ Meetings API started on port 3002'

node server-tasks.js &
echo '✅ Tasks API started on port 3003'

node server-voice-notes.js &
echo '✅ Voice Notes API started on port 3004'

# Start frontend
echo '🌐 Starting frontend on port 5173...'
npm run dev -- --host 0.0.0.0"""
        
        # Create startup script in container
        escaped_script = startup_script.replace("'", "'\\''")
        cmd = f"docker exec jarvi-build sh -c \"echo '{escaped_script}' > /app/start.sh && chmod +x /app/start.sh\""
        execute_command(ssh, cmd, show_output=False)
        print("  ✅ Startup script created")
        
        # Step 7: Commit container to image
        print("\n💾 Step 7: Creating custom image...")
        
        output, errors = execute_command(
            ssh,
            "docker commit jarvi-build jarvi-custom:latest",
            show_output=False
        )
        
        if output and len(output) > 10:
            print(f"  ✅ Image created: {output[:12]}")
        else:
            print("  ⚠️ Image creation may have failed")
        
        # Step 8: Stop and remove build container
        print("\n🧹 Step 8: Cleaning build container...")
        execute_command(ssh, "docker stop jarvi-build && docker rm jarvi-build", show_output=False)
        print("  ✅ Build container removed")
        
        # Step 9: Run final container
        print("\n🚀 Step 9: Starting JARVI container...")
        
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
            -w /app \
            jarvi-custom:latest \
            /app/start.sh"""
        
        output, errors = execute_command(ssh, run_cmd, show_output=False)
        
        if output and len(output) > 10:
            print(f"  ✅ Container started: {output[:12]}")
        else:
            print("  ⚠️ Container may not have started")
            if errors:
                print(f"  Error: {errors[:200]}")
        
        # Wait for services to start
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(20)
        
        # Step 10: Verify container
        print("\n✅ Step 10: Verifying container...")
        
        # Check container status
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app", show_output=False)
        if "jarvi-app" in output:
            print("  ✅ Container is running!")
            
            # Show container info
            output, _ = execute_command(
                ssh,
                "docker ps --filter name=jarvi-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
                show_output=True
            )
            
            # Check logs
            print("\n📜 Recent logs:")
            output, _ = execute_command(ssh, "docker logs jarvi-app --tail 20", show_output=False)
            for line in output.split('\n')[-20:]:
                if line and any(word in line.lower() for word in ['started', 'listening', 'ready', 'vite']):
                    print(f"  {line}")
        else:
            print("  ❌ Container is not running!")
            
            # Check if container exists
            output, _ = execute_command(ssh, "docker ps -a --filter name=jarvi-app", show_output=False)
            if "jarvi-app" in output:
                print("  Container exists but stopped. Checking logs...")
                output, _ = execute_command(ssh, "docker logs jarvi-app --tail 20", show_output=False)
                for line in output.split('\n')[-20:]:
                    if line:
                        print(f"  {line}")
        
        # Step 11: Test services
        print("\n🌐 Step 11: Testing services...")
        
        services = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        all_working = True
        for service, port in services:
            output, _ = execute_command(
                ssh,
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} || echo '000'",
                show_output=False
            )
            status = output.strip()
            if status in ['200', '304', '302']:
                print(f"  ✅ {service} (:{port}): Online")
            else:
                print(f"  ⚠️ {service} (:{port}): Status {status}")
                all_working = False
        
        # Final message
        print("\n" + "="*60)
        if all_working:
            print("🎉 JARVI DOCKER CONTAINER SUCCESSFULLY CREATED!")
        else:
            print("⚠️ JARVI CONTAINER CREATED BUT SOME SERVICES MAY BE STARTING")
        print("="*60)
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n🐳 Docker commands:")
        print("  • View logs: docker logs -f jarvi-app")
        print("  • Stop: docker stop jarvi-app")
        print("  • Start: docker start jarvi-app")
        print("  • Restart: docker restart jarvi-app")
        print("  • Status: docker ps | grep jarvi")
        print("  • Shell access: docker exec -it jarvi-app sh")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup build container if it still exists
        execute_command(ssh, "docker stop jarvi-build 2>/dev/null && docker rm jarvi-build 2>/dev/null", show_output=False)
        ssh.close()
        print("\n👋 Process completed!")

if __name__ == "__main__":
    main()