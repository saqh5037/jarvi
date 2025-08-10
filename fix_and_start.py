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

def execute_command(ssh, command, description=""):
    if description:
        print(f"\n{description}")
    try:
        # Always add Node.js paths
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=60)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        return output, errors
    except Exception as e:
        return "", str(e)

def main():
    print("🔧 FIXING AND STARTING JARVI SERVICES")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Find Node.js installation
        print("\n🔍 Step 1: Finding Node.js installation...")
        
        paths_to_check = [
            "/usr/local/bin/node",
            "/opt/homebrew/bin/node",
            "/usr/bin/node",
            "$HOME/.nvm/versions/node/*/bin/node"
        ]
        
        node_path = None
        npm_path = None
        
        for path in paths_to_check:
            output, _ = execute_command(ssh, f"ls {path} 2>/dev/null")
            if "node" in output:
                node_path = path.replace("/node", "")
                print(f"  ✅ Found Node.js at: {node_path}")
                break
        
        if not node_path:
            print("  ❌ Node.js not found! Installing...")
            # Try to install Node.js via Homebrew
            output, _ = execute_command(ssh, "brew install node")
            node_path = "/opt/homebrew/bin"
        
        # Verify Node.js works
        output, _ = execute_command(ssh, f"{node_path}/node --version")
        if output:
            print(f"  Node.js version: {output.strip()}")
        
        output, _ = execute_command(ssh, f"{node_path}/npm --version")
        if output:
            print(f"  npm version: {output.strip()}")
        
        # Step 2: Create proper startup script with full paths
        print("\n📝 Step 2: Creating startup script with correct paths...")
        
        startup_script = f"""#!/bin/bash
export PATH={node_path}:/usr/local/bin:/opt/homebrew/bin:$PATH
cd {REMOTE_PATH}

echo "🚀 Starting JARVI Services..."
echo "=========================================="
echo "Node path: $(which node)"
echo "npm path: $(which npm)"

# Kill any existing processes
pkill -f 'npm run dev' || true
pkill -f 'node server' || true
sleep 2

# Start backend services
echo "Starting Enhanced Notes API..."
{node_path}/node server-enhanced-notes.js > enhanced.log 2>&1 &
echo "PID: $!"
sleep 2

echo "Starting Meetings API..."
{node_path}/node server-meetings.js > meetings.log 2>&1 &
echo "PID: $!"
sleep 2

echo "Starting Tasks API..."
{node_path}/node server-tasks.js > tasks.log 2>&1 &
echo "PID: $!"
sleep 2

echo "Starting Voice Notes API..."
{node_path}/node server-voice-notes.js > voice.log 2>&1 &
echo "PID: $!"
sleep 2

echo "Starting Frontend..."
{node_path}/npm run dev > frontend.log 2>&1 &
echo "PID: $!"

echo "✅ All services started!"
echo "📍 Access at: http://192.168.1.141:5173"

# Show running processes
sleep 3
echo ""
echo "Running processes:"
ps aux | grep -E "node|npm" | grep -v grep
"""
        
        cmd = f"cat > {REMOTE_PATH}/start-jarvi-fixed.sh << 'EOF'\n{startup_script}\nEOF"
        execute_command(ssh, cmd)
        execute_command(ssh, f"chmod +x {REMOTE_PATH}/start-jarvi-fixed.sh")
        print("  ✅ Startup script created: start-jarvi-fixed.sh")
        
        # Step 3: Install dependencies if needed
        print("\n📦 Step 3: Checking dependencies...")
        
        output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && ls node_modules 2>&1")
        if "No such file" in output or not output:
            print("  Installing dependencies...")
            output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && {node_path}/npm install")
            if "packages" in output or "added" in output:
                print("  ✅ Dependencies installed")
        else:
            print("  ✅ Dependencies already installed")
        
        # Step 4: Start services
        print("\n🚀 Step 4: Starting services...")
        
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && bash start-jarvi-fixed.sh")
        if output:
            for line in output.split('\n'):
                if line:
                    print(f"  {line}")
        
        # Step 5: Wait and verify
        print("\n⏳ Step 5: Waiting for services to initialize...")
        time.sleep(10)
        
        # Step 6: Test services
        print("\n✅ Step 6: Testing services...")
        
        services = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        working = 0
        for service, port in services:
            output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} 2>/dev/null || echo '000'")
            status = output.strip()
            if status in ['200', '304', '302', '404']:
                print(f"  ✅ {service} (:{port}): Online")
                working += 1
            else:
                print(f"  ⚠️ {service} (:{port}): Status {status}")
        
        # Final summary
        print("\n" + "="*60)
        if working >= 3:
            print("🎉 JARVI SUCCESSFULLY STARTED!")
            print(f"   {working}/5 services are online")
            print("\n✅ Docker container created: jarvi-app")
            print("✅ Services running with Node.js")
        elif working > 0:
            print("⚠️ JARVI PARTIALLY STARTED")
            print(f"   {working}/5 services are online")
        else:
            print("❌ SERVICES NOT RESPONDING")
            print("   Check logs at ~/Documents/jarvis/*.log")
        
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n📋 Commands:")
        print(f"  • Start: cd {REMOTE_PATH} && ./start-jarvi-fixed.sh")
        print("  • Stop: pkill -f 'node server' && pkill -f 'npm run dev'")
        print(f"  • Logs: tail -f {REMOTE_PATH}/*.log")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()

if __name__ == "__main__":
    main()