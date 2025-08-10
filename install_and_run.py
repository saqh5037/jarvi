#!/usr/bin/env python3

import paramiko
import time
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

def execute_command(ssh, command, description="", timeout=300):
    """Execute command and show output"""
    if description:
        print(f"\n{description}")
    
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        
        # Read output
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if output:
            for line in output.strip().split('\n')[:50]:  # Limit output lines
                if line.strip():
                    print(f"  {line}")
        
        if errors and "Warning" not in errors and "npm notice" not in errors:
            print(f"  ⚠️ {errors[:200]}")
        
        return stdout.channel.recv_exit_status() == 0
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🚀 Installing Node.js and starting JARVI on remote Mac...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Check if Homebrew is installed
        print("\n📦 Step 1: Checking Homebrew installation...")
        stdin, stdout, stderr = ssh.exec_command("which brew")
        brew_path = stdout.read().decode().strip()
        
        if not brew_path:
            print("  Installing Homebrew...")
            install_brew = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
            execute_command(ssh, install_brew, timeout=600)
            
            # Add Homebrew to PATH for Apple Silicon Macs
            execute_command(ssh, 'echo "eval $(/opt/homebrew/bin/brew shellenv)" >> ~/.zprofile')
            execute_command(ssh, 'eval "$(/opt/homebrew/bin/brew shellenv)"')
        else:
            print(f"  ✅ Homebrew found at: {brew_path}")
        
        # Step 2: Install Node.js via Homebrew
        print("\n📦 Step 2: Installing Node.js...")
        
        # First check if Node is already installed
        stdin, stdout, stderr = ssh.exec_command("which node")
        node_path = stdout.read().decode().strip()
        
        if not node_path:
            print("  Installing Node.js via Homebrew...")
            # Use full path for brew on Apple Silicon
            if execute_command(ssh, "/opt/homebrew/bin/brew install node || /usr/local/bin/brew install node", timeout=300):
                print("  ✅ Node.js installed successfully")
            else:
                print("  ⚠️ Trying alternative installation method...")
                execute_command(ssh, "curl -fsSL https://fnm.vercel.app/install | bash", timeout=120)
                execute_command(ssh, 'source ~/.zshrc && fnm install --lts && fnm use lts-latest')
        else:
            print(f"  ✅ Node.js already installed at: {node_path}")
        
        # Verify Node installation
        stdin, stdout, stderr = ssh.exec_command("node --version 2>/dev/null || /opt/homebrew/bin/node --version 2>/dev/null || /usr/local/bin/node --version")
        node_version = stdout.read().decode().strip()
        if node_version:
            print(f"  ✅ Node.js version: {node_version}")
        else:
            print("  ⚠️ Node.js might need PATH configuration")
        
        # Step 3: Install npm dependencies
        print("\n📦 Step 3: Installing npm dependencies...")
        print("  This may take several minutes...")
        
        npm_install = f"""
        cd {REMOTE_PATH}
        export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
        which npm
        npm --version
        npm install --verbose
        """
        
        if execute_command(ssh, npm_install, timeout=600):
            print("  ✅ Dependencies installed")
        else:
            print("  ⚠️ Some dependencies might have warnings")
        
        # Step 4: Kill any existing Node processes
        print("\n🔧 Step 4: Cleaning up old processes...")
        execute_command(ssh, "pkill -f node || true")
        execute_command(ssh, "pkill -f npm || true")
        time.sleep(2)
        
        # Step 5: Start services
        print("\n🚀 Step 5: Starting JARVI services...")
        
        # Create a comprehensive startup script
        startup_script = f'''#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd {REMOTE_PATH}

echo "Starting JARVI services with proper PATH..."
echo "Node path: $(which node)"
echo "NPM path: $(which npm)"

# Clean up old processes
pkill -f "npm run dev" || true
pkill -f "node server" || true
sleep 2

# Start frontend with Vite
echo "Starting Vite frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for Vite to initialize
sleep 10

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

# Check if start-bot.sh exists and is executable
if [ -f "./start-bot.sh" ]; then
    echo "Starting Telegram Bot..."
    nohup ./start-bot.sh > telegram-bot.log 2>&1 &
    echo $! > telegram-bot.pid
fi

echo "All services started!"
sleep 5

# Verify services
echo "Verifying services..."
ps aux | grep -E "node|npm" | grep -v grep | head -5
'''
        
        # Write and execute the startup script
        write_script = f'cd {REMOTE_PATH} && cat > start_services.sh << \'SCRIPT_END\'\n{startup_script}\nSCRIPT_END'
        execute_command(ssh, write_script)
        execute_command(ssh, f'cd {REMOTE_PATH} && chmod +x start_services.sh')
        
        # Execute the startup script
        execute_command(ssh, f'cd {REMOTE_PATH} && ./start_services.sh')
        
        # Step 6: Wait and verify
        print("\n⏳ Step 6: Waiting for services to initialize (20 seconds)...")
        time.sleep(20)
        
        # Step 7: Verify services are running
        print("\n✅ Step 7: Verifying services...")
        
        # Check running processes
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep -E 'node|npm' | grep -v grep | wc -l")
        process_count = stdout.read().decode().strip()
        print(f"  📊 {process_count} Node/NPM processes running")
        
        # Check specific services
        services = [
            ("npm run dev", "Vite Frontend"),
            ("server-enhanced-notes", "Enhanced Notes API"),
            ("server-meetings", "Meetings API"),
            ("server-tasks", "Tasks API"),
            ("server-voice-notes", "Voice Notes API")
        ]
        
        for process_name, service_name in services:
            stdin, stdout, stderr = ssh.exec_command(f"ps aux | grep '{process_name}' | grep -v grep | wc -l")
            count = stdout.read().decode().strip()
            if count != "0":
                print(f"  ✅ {service_name} is running")
            else:
                print(f"  ⚠️ {service_name} not detected")
        
        # Check if ports are listening
        print("\n🔌 Checking ports:")
        ports = {
            5173: "Frontend",
            3001: "Enhanced Notes API",
            3002: "Meetings API", 
            3003: "Tasks API",
            3004: "Voice Notes API"
        }
        
        for port, service in ports.items():
            stdin, stdout, stderr = ssh.exec_command(f"lsof -i :{port} 2>/dev/null | grep LISTEN | wc -l")
            is_listening = stdout.read().decode().strip()
            if is_listening != "0":
                print(f"  ✅ Port {port} ({service}) is listening")
            else:
                print(f"  ⚠️ Port {port} ({service}) not ready yet")
        
        # Final test
        print("\n🌐 Testing frontend access...")
        stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5173 2>/dev/null | head -5")
        output = stdout.read().decode()
        if "<!doctype html>" in output.lower() or "<!DOCTYPE html>" in output:
            print("  ✅ Frontend is responding!")
        else:
            print("  ⚠️ Frontend may need more time to compile")
            print("  Check logs at: /Users/samuelquiroz/Documents/jarvis/frontend.log")
        
        # Show success message
        print("\n" + "="*60)
        print("🎉 JARVI INSTALLATION COMPLETE!")
        print("="*60)
        print("\n📍 Access JARVI:")
        print(f"  From your browser: http://192.168.1.141:5173")
        print(f"  Telegram Bot: @JarviSamu_bot")
        print("\n🔧 Useful commands:")
        print(f"  Check status: ssh {USER}@{HOST} 'cd {REMOTE_PATH} && ps aux | grep node'")
        print(f"  View logs: ssh {USER}@{HOST} 'cd {REMOTE_PATH} && tail -f *.log'")
        print(f"  Restart: ssh {USER}@{HOST} 'cd {REMOTE_PATH} && ./start_services.sh'")
        print(f"  Stop all: ssh {USER}@{HOST} 'pkill -f node'")
        
    except Exception as e:
        print(f"\n❌ Error during installation: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Installation script completed")

if __name__ == "__main__":
    main()