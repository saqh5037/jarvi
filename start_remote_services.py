#!/usr/bin/env python3

import paramiko
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
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def main():
    print("🚀 Starting JARVI services on remote Mac...")
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        return
    
    try:
        # First, kill any existing Node processes
        print("\n🔧 Cleaning up old processes...")
        stdin, stdout, stderr = ssh.exec_command("pkill -f node || true")
        stdout.read()
        time.sleep(2)
        
        # Check Node.js installation
        print("\n📦 Checking Node.js installation...")
        stdin, stdout, stderr = ssh.exec_command("node --version")
        node_version = stdout.read().decode().strip()
        if node_version:
            print(f"  ✅ Node.js {node_version} is installed")
        else:
            print("  ❌ Node.js not found. Installing...")
            stdin, stdout, stderr = ssh.exec_command("brew install node")
            stdout.read()
        
        # Create startup script
        print("\n📝 Creating startup script...")
        startup_script = f'''#!/bin/bash
cd {REMOTE_PATH}

echo "Starting JARVI services..."

# Start frontend
echo "Starting frontend..."
nohup npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

# Wait for frontend to initialize
sleep 5

# Start backend services
echo "Starting Enhanced Notes API..."
nohup node server-enhanced-notes.js > enhanced-notes.log 2>&1 &
echo $! > enhanced-notes.pid

echo "Starting Meetings API..."
nohup node server-meetings.js > meetings.log 2>&1 &
echo $! > meetings.pid

echo "Starting Tasks API..."
nohup node server-tasks.js > tasks.log 2>&1 &
echo $! > tasks.pid

echo "Starting Voice Notes API..."
nohup node server-voice-notes.js > voice-notes.log 2>&1 &
echo $! > voice-notes.pid

echo "Starting Telegram Bot..."
nohup ./start-bot.sh > telegram-bot.log 2>&1 &
echo $! > telegram-bot.pid

echo "All services started!"
echo "PIDs saved to *.pid files"
'''
        
        # Write and execute startup script
        cmd = f"cd {REMOTE_PATH} && cat > start_jarvi.sh << 'EOF'\n{startup_script}\nEOF"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.read()
        
        stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && chmod +x start_jarvi.sh")
        stdout.read()
        
        print("\n🚀 Starting all services...")
        stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && ./start_jarvi.sh")
        output = stdout.read().decode()
        print(output)
        
        # Wait for services to start
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(10)
        
        # Verify services
        print("\n✅ Verifying services:")
        
        # Check processes
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep -E 'node|npm' | grep -v grep | wc -l")
        process_count = stdout.read().decode().strip()
        print(f"  📊 {process_count} Node processes running")
        
        # Check each port
        ports = {
            5173: "Frontend",
            3001: "Enhanced Notes API",
            3002: "Meetings API",
            3003: "Tasks API",
            3004: "Voice Notes API"
        }
        
        for port, service in ports.items():
            stdin, stdout, stderr = ssh.exec_command(f"lsof -i :{port} | grep LISTEN | wc -l")
            is_listening = stdout.read().decode().strip()
            if is_listening != "0":
                print(f"  ✅ {service} on port {port}")
            else:
                print(f"  ⚠️ {service} on port {port} not yet ready")
        
        # Test frontend
        print("\n🌐 Testing frontend...")
        stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5173 | grep -c JARVI")
        output = stdout.read().decode().strip()
        if output != "0":
            print("  ✅ Frontend is responding with JARVI content")
        else:
            print("  ⚠️ Frontend may need more time to compile")
        
        print("\n" + "="*60)
        print("🎉 JARVI DEPLOYMENT COMPLETE!")
        print("="*60)
        print(f"\n📍 Access JARVI at:")
        print(f"  From your computer: http://192.168.1.141:5173")
        print(f"  On remote Mac: http://localhost:5173")
        print(f"\n🔧 To check status:")
        print(f"  ssh {USER}@{HOST}")
        print(f"  cd {REMOTE_PATH}")
        print(f"  tail -f *.log")
        print(f"\n🛑 To stop all services:")
        print(f"  ssh {USER}@{HOST}")
        print(f"  cd {REMOTE_PATH}")
        print(f"  pkill -f node")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()