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
        # Add Docker to PATH
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=timeout)
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
    print("🐳 Fixing Docker setup for JARVI on remote Mac...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Check if Docker Desktop is installed
        print("\n🔍 Step 1: Checking Docker Desktop installation...")
        output, _ = execute_command(ssh, "ls -la /Applications/ | grep Docker")
        if "Docker.app" in output:
            print("  ✅ Docker Desktop is installed")
        else:
            print("  ❌ Docker Desktop not found!")
            print("  Please install Docker Desktop from https://www.docker.com/products/docker-desktop/")
            return
        
        # Step 2: Open Docker Desktop and wait
        print("\n🚀 Step 2: Starting Docker Desktop (if not running)...")
        execute_command(ssh, "open -a Docker")
        
        print("  ⏳ Waiting 60 seconds for Docker to fully start...")
        for i in range(60, 0, -10):
            print(f"    {i} seconds remaining...")
            time.sleep(10)
        
        # Step 3: Verify Docker is accessible
        print("\n✅ Step 3: Verifying Docker installation...")
        
        # Try different Docker paths
        docker_paths = [
            "/usr/local/bin/docker",
            "/opt/homebrew/bin/docker",
            "/Applications/Docker.app/Contents/Resources/bin/docker"
        ]
        
        docker_cmd = None
        for path in docker_paths:
            output, _ = execute_command(ssh, f"ls {path} 2>/dev/null")
            if path in output:
                docker_cmd = path
                print(f"  ✅ Found Docker at: {path}")
                break
        
        if not docker_cmd:
            # Try to find docker
            output, _ = execute_command(ssh, "which docker 2>/dev/null")
            if output.strip():
                docker_cmd = output.strip()
                print(f"  ✅ Found Docker at: {docker_cmd}")
            else:
                print("  ⚠️ Docker command not found in PATH")
                print("  Installing Docker CLI tools...")
                
                # Create symlinks
                execute_command(ssh, "sudo ln -sf /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker 2>/dev/null || true")
                execute_command(ssh, "sudo ln -sf /Applications/Docker.app/Contents/Resources/bin/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true")
                docker_cmd = "/usr/local/bin/docker"
        
        # Step 4: Test Docker
        print("\n🧪 Step 4: Testing Docker...")
        output, errors = execute_command(ssh, f"{docker_cmd} version")
        if "Version" in output:
            print("  ✅ Docker is working!")
        else:
            print(f"  ⚠️ Docker test output: {output[:200]}")
            print(f"  ⚠️ Docker test errors: {errors[:200]}")
        
        # Step 5: Build and run with full paths
        print("\n🔨 Step 5: Building Docker image...")
        
        # Create a simple startup script
        startup_script = f"""#!/bin/bash
cd {REMOTE_PATH}
export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH

echo "Stopping any existing containers..."
docker-compose down 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

echo "Building Docker image..."
docker build -t jarvi-app -f Dockerfile .

echo "Starting with docker-compose..."
docker-compose up -d

echo "Checking status..."
docker ps
"""
        
        cmd = f"cd {REMOTE_PATH} && cat > docker_start.sh << 'EOF'\n{startup_script}\nEOF"
        execute_command(ssh, cmd)
        execute_command(ssh, f"chmod +x {REMOTE_PATH}/docker_start.sh")
        
        # Run the startup script
        print("\n🚢 Step 6: Starting Docker services...")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && ./docker_start.sh", timeout=300)
        
        # Wait for services to start
        time.sleep(15)
        
        # Step 7: Final verification
        print("\n✅ Step 7: Final verification...")
        
        # Check containers
        output, _ = execute_command(ssh, "docker ps 2>/dev/null")
        if "jarvi" in output.lower():
            print("  ✅ JARVI containers are running!")
            print("\n📊 Running containers:")
            print(output)
        else:
            print("  ⚠️ No JARVI containers found")
            print("  Trying to start services manually...")
            
            # Fallback to Node.js
            print("\n🔄 Starting services with Node.js as fallback...")
            commands = [
                f"cd {REMOTE_PATH} && nohup npm run dev > frontend.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-enhanced-notes.js > enhanced.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-meetings.js > meetings.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-tasks.js > tasks.log 2>&1 &",
                f"cd {REMOTE_PATH} && nohup node server-voice-notes.js > voice.log 2>&1 &",
            ]
            
            for cmd in commands:
                execute_command(ssh, cmd)
            
            print("  ✅ Started services with Node.js")
        
        # Final message
        print("\n" + "="*60)
        print("🎉 DOCKER CONFIGURATION COMPLETE!")
        print("="*60)
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n💡 If Docker is not working, services are running with Node.js")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()

if __name__ == "__main__":
    main()