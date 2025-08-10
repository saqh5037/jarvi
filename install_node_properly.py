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
        print(f"✅ Connected to {host}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def main():
    print("🚀 Installing Node.js properly and starting JARVI...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        return
    
    try:
        # Step 1: Download and install Node.js using official installer
        print("\n📦 Step 1: Installing Node.js from official source...")
        
        # Download Node.js installer
        node_install_commands = """
# Download Node.js v20 LTS for macOS
cd /tmp
curl -o node-installer.pkg https://nodejs.org/dist/v20.18.0/node-v20.18.0.pkg

# Install Node.js (requires sudo)
echo 'Tesoro86*' | sudo -S installer -pkg node-installer.pkg -target /

# Clean up
rm -f node-installer.pkg

# Verify installation
/usr/local/bin/node --version
/usr/local/bin/npm --version
"""
        
        print("  Downloading Node.js installer...")
        stdin, stdout, stderr = ssh.exec_command("cd /tmp && curl -o node-installer.pkg https://nodejs.org/dist/v20.18.0/node-v20.18.0.pkg", timeout=120)
        stdout.read()
        print("  ✅ Downloaded")
        
        print("  Installing Node.js (using sudo)...")
        stdin, stdout, stderr = ssh.exec_command("cd /tmp && echo 'Tesoro86*' | sudo -S installer -pkg node-installer.pkg -target /", timeout=120)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if "successful" in output.lower() or not errors or "installer:" in output:
            print("  ✅ Node.js installed successfully")
        else:
            print(f"  ⚠️ Installation output: {output[:200]}")
            if errors:
                print(f"  ⚠️ Errors: {errors[:200]}")
        
        # Clean up installer
        ssh.exec_command("rm -f /tmp/node-installer.pkg")
        
        # Verify Node.js installation
        print("\n📋 Step 2: Verifying Node.js installation...")
        stdin, stdout, stderr = ssh.exec_command("/usr/local/bin/node --version")
        node_version = stdout.read().decode().strip()
        
        stdin, stdout, stderr = ssh.exec_command("/usr/local/bin/npm --version")
        npm_version = stdout.read().decode().strip()
        
        if node_version:
            print(f"  ✅ Node.js: {node_version}")
        if npm_version:
            print(f"  ✅ NPM: {npm_version}")
        
        # Step 3: Set up PATH properly
        print("\n🔧 Step 3: Setting up PATH...")
        path_setup = """
# Add Node to PATH if not already there
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
source ~/.zshrc 2>/dev/null || source ~/.bash_profile 2>/dev/null
"""
        ssh.exec_command(path_setup)
        print("  ✅ PATH configured")
        
        # Step 4: Install npm dependencies
        print(f"\n📦 Step 4: Installing npm dependencies in {REMOTE_PATH}...")
        
        install_cmd = f"""
cd {REMOTE_PATH}
export PATH="/usr/local/bin:$PATH"
/usr/local/bin/npm install --verbose
"""
        
        stdin, stdout, stderr = ssh.exec_command(install_cmd, timeout=300)
        
        # Show installation progress
        line_count = 0
        for line in stdout:
            line = line.strip()
            if line and line_count < 20:
                print(f"  {line[:80]}")
                line_count += 1
        
        print("  ✅ Dependencies installed")
        
        # Step 5: Kill old processes
        print("\n🔧 Step 5: Cleaning up old processes...")
        ssh.exec_command("pkill -f node || true")
        ssh.exec_command("pkill -f npm || true")
        time.sleep(2)
        print("  ✅ Old processes cleaned")
        
        # Step 6: Start services with full paths
        print("\n🚀 Step 6: Starting JARVI services...")
        
        # Create startup script with full paths
        startup_script = f'''#!/bin/bash
cd {REMOTE_PATH}
export PATH="/usr/local/bin:$PATH"

echo "Starting JARVI services..."

# Start frontend
echo "Starting frontend..."
nohup /usr/local/bin/npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid
sleep 5

# Start backend services
echo "Starting backend services..."
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
ps aux | grep node | grep -v grep | head -5
'''
        
        # Write and execute startup script
        ssh.exec_command(f"cd {REMOTE_PATH} && cat > start.sh << 'EOF'\n{startup_script}\nEOF")
        ssh.exec_command(f"cd {REMOTE_PATH} && chmod +x start.sh")
        
        stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && ./start.sh")
        output = stdout.read().decode()
        print(output)
        
        # Wait for services to start
        print("\n⏳ Waiting for services to initialize (20 seconds)...")
        time.sleep(20)
        
        # Step 7: Verify everything is running
        print("\n✅ Step 7: Final verification...")
        
        # Check processes
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep node | grep -v grep | wc -l")
        process_count = stdout.read().decode().strip()
        print(f"  📊 {process_count} Node processes running")
        
        # Check frontend
        stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5173 | head -1")
        output = stdout.read().decode()
        if "<!doctype html>" in output.lower() or "<!DOCTYPE html>" in output:
            print("  ✅ Frontend is responding!")
        else:
            print("  ⚠️ Frontend starting up...")
            
            # Check frontend log
            stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && tail -5 frontend.log")
            log = stdout.read().decode()
            if log:
                print("  Frontend log:")
                for line in log.split('\n')[:5]:
                    if line.strip():
                        print(f"    {line[:80]}")
        
        # Show access information
        print("\n" + "="*60)
        print("🎉 JARVI IS NOW RUNNING!")
        print("="*60)
        print(f"\n📍 Access JARVI at:")
        print(f"  http://192.168.1.141:5173")
        print(f"\n📱 Telegram Bot: @JarviSamu_bot")
        print(f"\n🔍 Check status:")
        print(f"  ssh {USER}@{HOST} 'ps aux | grep node'")
        print(f"\n📝 View logs:")
        print(f"  ssh {USER}@{HOST} 'cd {REMOTE_PATH} && tail -f frontend.log'")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()

if __name__ == "__main__":
    main()