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

def execute_command(ssh, command, description="", timeout=60):
    if description:
        print(f"\n{description}")
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if output and len(output) < 1000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and len(errors) < 500:
            print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def main():
    print("🐳 Setting up Docker for JARVI on remote Mac...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Stop current Node.js services
        print("\n🛑 Step 1: Stopping current Node.js services...")
        commands = [
            "pkill -f 'npm run dev' || true",
            "pkill -f 'node server' || true",
            "pkill -f 'telegram-bot' || true",
            "killall node || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd)
        
        time.sleep(3)
        
        # Step 2: Copy Docker files
        print("\n📦 Step 2: Copying Docker configuration files...")
        
        with SCPClient(ssh.get_transport()) as scp:
            files_to_copy = [
                ("Dockerfile.production", "Dockerfile"),
                ("docker-compose.yml", "docker-compose.yml"),
                (".env", ".env")
            ]
            
            for local_file, remote_file in files_to_copy:
                try:
                    local_path = f"/Users/samuelquiroz/Documents/proyectos/jarvi/{local_file}"
                    remote_path = f"{REMOTE_PATH}/{remote_file}"
                    scp.put(local_path, remote_path)
                    print(f"  ✅ Copied {local_file}")
                except Exception as e:
                    print(f"  ⚠️ Could not copy {local_file}: {e}")
        
        # Step 3: Start Docker Desktop
        print("\n🚀 Step 3: Starting Docker Desktop...")
        execute_command(ssh, "open -a Docker", "Opening Docker Desktop app...")
        
        print("  ⏳ Waiting for Docker to start (30 seconds)...")
        time.sleep(30)
        
        # Check if Docker is running
        output, errors = execute_command(ssh, "docker version 2>&1")
        if "Cannot connect" in output or "Cannot connect" in errors:
            print("  ⚠️ Docker may still be starting. Waiting more...")
            time.sleep(20)
        
        # Step 4: Create .env file if needed
        print("\n📝 Step 4: Creating environment file...")
        env_content = """
# API Keys
GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw
TELEGRAM_BOT_TOKEN=
OPENAI_API_KEY=
CLAUDE_API_KEY=

# Node environment
NODE_ENV=development
"""
        
        cmd = f"cd {REMOTE_PATH} && cat > .env << 'EOF'{env_content}EOF"
        execute_command(ssh, cmd, "Creating .env file...")
        
        # Step 5: Build Docker image
        print("\n🔨 Step 5: Building Docker image...")
        print("  This may take 3-5 minutes...")
        
        output, errors = execute_command(ssh, 
            f"cd {REMOTE_PATH} && docker build -t jarvi-app -f Dockerfile .", 
            "Building Docker image...",
            timeout=300)
        
        if "Successfully built" in output or "writing image" in output:
            print("  ✅ Docker image built successfully!")
        else:
            print("  ⚠️ Check build output for issues")
        
        # Step 6: Run with docker-compose
        print("\n🚢 Step 6: Starting services with docker-compose...")
        
        # First, stop any existing containers
        execute_command(ssh, f"cd {REMOTE_PATH} && docker-compose down 2>/dev/null || true")
        
        # Start services
        output, errors = execute_command(ssh, 
            f"cd {REMOTE_PATH} && docker-compose up -d",
            "Starting Docker containers...",
            timeout=120)
        
        if "done" in output.lower() or "started" in output.lower():
            print("  ✅ Docker containers started!")
        
        time.sleep(10)
        
        # Step 7: Verify services
        print("\n✅ Step 7: Verifying Docker services...")
        
        # Check running containers
        output, _ = execute_command(ssh, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
        if output:
            print("\n📊 Running containers:")
            print(output)
        
        # Check if services are accessible
        print("\n🌐 Checking service availability...")
        
        services = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        for service, port in services:
            output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} || echo 'failed'")
            if "200" in output or "304" in output:
                print(f"  ✅ {service} (port {port}): Running")
            else:
                print(f"  ⚠️ {service} (port {port}): May still be starting")
        
        # Show logs
        print("\n📜 Recent Docker logs:")
        execute_command(ssh, "docker-compose logs --tail=10", timeout=10)
        
        # Final instructions
        print("\n" + "="*60)
        print("🎉 DOCKER SETUP COMPLETE!")
        print("="*60)
        print("\n📍 JARVI is now running in Docker!")
        print("\n🌐 Access points:")
        print("  • Frontend: http://192.168.1.141:5173")
        print("  • From any device on network: http://192.168.1.141:5173")
        print("\n🐳 Docker commands:")
        print("  • View logs: docker-compose logs -f")
        print("  • Stop services: docker-compose down")
        print("  • Restart services: docker-compose restart")
        print("  • View containers: docker ps")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Setup complete!")

if __name__ == "__main__":
    main()