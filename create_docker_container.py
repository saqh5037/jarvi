#!/usr/bin/env python3

import paramiko
from scp import SCPClient
import sys
import time
import os
import tarfile

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
        # Add Docker to PATH
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && cd {REMOTE_PATH} && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if show_output and output and len(output) < 2000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and "warning" not in errors.lower() and len(errors) < 500:
            print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def create_dockerfile_content():
    """Create Dockerfile content as string"""
    return '''FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++ ffmpeg curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all source files
COPY . .

# Create necessary directories
RUN mkdir -p voice-notes data/reminders data/todos data/meetings data/interests tasks/data tasks/audio meetings/recordings

# Expose ports
EXPOSE 5173 3001 3002 3003 3004

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \\
    echo 'echo "🚀 Starting JARVI services..."' >> /app/start.sh && \\
    echo 'node server-enhanced-notes.js &' >> /app/start.sh && \\
    echo 'echo "✅ Enhanced Notes API started on port 3001"' >> /app/start.sh && \\
    echo 'node server-meetings.js &' >> /app/start.sh && \\
    echo 'echo "✅ Meetings API started on port 3002"' >> /app/start.sh && \\
    echo 'node server-tasks.js &' >> /app/start.sh && \\
    echo 'echo "✅ Tasks API started on port 3003"' >> /app/start.sh && \\
    echo 'node server-voice-notes.js &' >> /app/start.sh && \\
    echo 'echo "✅ Voice Notes API started on port 3004"' >> /app/start.sh && \\
    echo 'echo "🌐 Starting frontend..."' >> /app/start.sh && \\
    echo 'npm run dev -- --host 0.0.0.0' >> /app/start.sh && \\
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
'''

def main():
    print("🐳 CREATING JARVI DOCKER CONTAINER")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Stop existing containers
        print("\n🛑 Step 1: Stopping existing containers...")
        commands = [
            "docker stop jarvi-app 2>/dev/null || true",
            "docker rm jarvi-app 2>/dev/null || true",
            "docker rmi jarvi:latest 2>/dev/null || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd, show_output=False)
        print("  ✅ Cleanup complete")
        
        # Step 2: Create Dockerfile directly on remote
        print("\n📝 Step 2: Creating Dockerfile on remote server...")
        dockerfile_content = create_dockerfile_content()
        
        # Escape the content for bash
        escaped_content = dockerfile_content.replace("'", "'\\''")
        cmd = f"cat > Dockerfile << 'DOCKERFILE_END'\n{escaped_content}\nDOCKERFILE_END"
        execute_command(ssh, cmd, show_output=False)
        
        # Verify Dockerfile was created
        output, _ = execute_command(ssh, "ls -la Dockerfile", show_output=False)
        if "Dockerfile" in output:
            print("  ✅ Dockerfile created successfully")
        else:
            print("  ❌ Failed to create Dockerfile")
            return
        
        # Step 3: Copy all necessary files
        print("\n📦 Step 3: Transferring project files...")
        
        # Create tar archive of the project
        tar_path = "/tmp/jarvi_project.tar.gz"
        print("  Creating archive...")
        
        with tarfile.open(tar_path, "w:gz") as tar:
            # Add important files
            files_to_add = [
                "package.json",
                "package-lock.json",
                "vite.config.js",
                "index.html",
                "postcss.config.js",
                "tailwind.config.js",
                ".env",
                "server-enhanced-notes.js",
                "server-meetings.js",
                "server-tasks.js",
                "server-voice-notes.js",
                "telegram-bot.js"
            ]
            
            for file in files_to_add:
                file_path = os.path.join(LOCAL_PATH, file)
                if os.path.exists(file_path):
                    tar.add(file_path, arcname=file)
            
            # Add src directory
            src_path = os.path.join(LOCAL_PATH, "src")
            if os.path.exists(src_path):
                tar.add(src_path, arcname="src")
            
            # Add public directory
            public_path = os.path.join(LOCAL_PATH, "public")
            if os.path.exists(public_path):
                tar.add(public_path, arcname="public")
        
        print("  ✅ Archive created")
        
        # Transfer archive
        print("  Transferring archive...")
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(tar_path, f"{REMOTE_PATH}/project.tar.gz")
        print("  ✅ Archive transferred")
        
        # Extract archive
        print("  Extracting files...")
        execute_command(ssh, "tar -xzf project.tar.gz && rm project.tar.gz", show_output=False)
        print("  ✅ Files extracted")
        
        # Step 4: Build Docker image
        print("\n🔨 Step 4: Building Docker image...")
        print("  This will take 2-3 minutes...")
        
        output, errors = execute_command(
            ssh,
            "docker build -t jarvi:latest .",
            timeout=300,
            show_output=False
        )
        
        if "successfully built" in output.lower() or "writing image" in output.lower():
            print("  ✅ Docker image built successfully!")
        else:
            print(f"  ⚠️ Build output: {output[:500]}")
            if errors:
                print(f"  ⚠️ Build errors: {errors[:500]}")
        
        # Step 5: Run container
        print("\n🚀 Step 5: Starting JARVI container...")
        
        docker_run_cmd = """docker run -d \\
            --name jarvi-app \\
            --restart unless-stopped \\
            -p 5173:5173 \\
            -p 3001:3001 \\
            -p 3002:3002 \\
            -p 3003:3003 \\
            -p 3004:3004 \\
            -e NODE_ENV=development \\
            -e GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw \\
            jarvi:latest"""
        
        output, errors = execute_command(ssh, docker_run_cmd, show_output=False)
        
        if output and len(output) > 10:
            print(f"  ✅ Container started with ID: {output[:12]}")
        else:
            print("  ⚠️ Container start output:", output[:200] if output else "empty")
            if errors:
                print("  ⚠️ Container start errors:", errors[:200])
        
        # Wait for services to start
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(20)
        
        # Step 6: Verify container
        print("\n✅ Step 6: Verifying container...")
        
        # Check if container is running
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app", show_output=False)
        if "jarvi-app" in output:
            print("  ✅ Container is running!")
            
            # Show container details
            output, _ = execute_command(
                ssh,
                "docker ps --filter name=jarvi-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
                show_output=True
            )
            
            # Check logs
            print("\n📜 Container logs:")
            output, _ = execute_command(ssh, "docker logs jarvi-app --tail 30", show_output=False)
            for line in output.split('\n')[-30:]:
                if line and any(word in line.lower() for word in ['started', 'listening', 'ready', 'error', 'failed']):
                    print(f"  {line}")
        else:
            print("  ❌ Container is not running!")
            
            # Check what went wrong
            output, _ = execute_command(ssh, "docker ps -a --filter name=jarvi-app", show_output=False)
            if "jarvi-app" in output:
                print("  Container exists but is not running. Checking logs...")
                output, _ = execute_command(ssh, "docker logs jarvi-app", show_output=False)
                print(f"  Last logs: {output[-500:]}")
        
        # Step 7: Test connectivity
        print("\n🌐 Step 7: Testing services...")
        
        services = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
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
        
        # Final message
        print("\n" + "="*60)
        print("🎉 JARVI DOCKER CONTAINER CREATED!")
        print("="*60)
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n🐳 Docker commands:")
        print("  • View logs: docker logs -f jarvi-app")
        print("  • Stop: docker stop jarvi-app")
        print("  • Start: docker start jarvi-app")
        print("  • Restart: docker restart jarvi-app")
        print("  • Remove: docker stop jarvi-app && docker rm jarvi-app")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Process completed!")

if __name__ == "__main__":
    main()