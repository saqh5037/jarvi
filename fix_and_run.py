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

def execute_and_show(ssh, command, description=""):
    """Execute command and show output"""
    if description:
        print(f"\n{description}")
    
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    errors = stderr.read().decode()
    
    if output:
        for line in output.strip().split('\n')[:20]:
            if line.strip():
                print(f"  {line}")
    
    if errors and "Warning" not in errors:
        for line in errors.strip().split('\n')[:10]:
            if line.strip():
                print(f"  ⚠️ {line}")
    
    return output, errors

def main():
    print("🔧 Fixing permissions and starting JARVI...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        return
    
    try:
        # Step 1: Fix permissions
        print("\n🔐 Step 1: Fixing permissions...")
        execute_and_show(ssh, f"sudo chown -R {USER}:staff {REMOTE_PATH}")
        execute_and_show(ssh, f"chmod -R 755 {REMOTE_PATH}")
        print("  ✅ Permissions fixed")
        
        # Step 2: Check and fix npm
        print("\n📦 Step 2: Checking npm installation...")
        output, _ = execute_and_show(ssh, "which npm")
        npm_path = output.strip()
        
        if npm_path:
            print(f"  ✅ NPM found at: {npm_path}")
            
            # Try to run npm in the correct directory
            print("\n📦 Installing dependencies properly...")
            
            # Use a different approach - create a script and run it
            install_script = f'''#!/bin/bash
cd {REMOTE_PATH}
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# Clean npm cache
npm cache clean --force 2>/dev/null || true

# Remove old node_modules and package-lock
rm -rf node_modules package-lock.json

# Install dependencies
npm install --no-audit --no-fund

echo "Dependencies installed!"
'''
            
            # Write and execute install script
            execute_and_show(ssh, f"cd {REMOTE_PATH} && cat > install_deps.sh << 'EOF'\n{install_script}\nEOF")
            execute_and_show(ssh, f"cd {REMOTE_PATH} && chmod +x install_deps.sh")
            
            print("  Installing dependencies (this will take a few minutes)...")
            stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && ./install_deps.sh", timeout=300)
            
            # Show progress
            for line in stdout:
                line = line.strip()
                if line and not line.startswith('npm'):
                    print(f"    {line[:80]}")
            
            print("  ✅ Dependencies installation attempted")
        
        # Step 3: Start services using a simpler approach
        print("\n🚀 Step 3: Starting services with simple commands...")
        
        # Kill old processes
        execute_and_show(ssh, "pkill -f node || true")
        execute_and_show(ssh, "pkill -f npm || true")
        time.sleep(2)
        
        # Start each service individually
        services = [
            ("npm run dev", "frontend.log", "Frontend"),
            ("node server-enhanced-notes.js", "enhanced.log", "Enhanced Notes"),
            ("node server-meetings.js", "meetings.log", "Meetings"),
            ("node server-tasks.js", "tasks.log", "Tasks"),
            ("node server-voice-notes.js", "voice.log", "Voice Notes")
        ]
        
        for cmd, logfile, name in services:
            print(f"  Starting {name}...")
            full_cmd = f"cd {REMOTE_PATH} && nohup {cmd} > {logfile} 2>&1 & echo $!"
            output, _ = execute_and_show(ssh, full_cmd)
            if output.strip().isdigit():
                print(f"    ✅ {name} started with PID {output.strip()}")
            else:
                print(f"    ⚠️ {name} may have issues starting")
        
        # Wait for services to initialize
        print("\n⏳ Waiting 15 seconds for services to start...")
        time.sleep(15)
        
        # Step 4: Check status
        print("\n✅ Step 4: Checking service status...")
        
        # Check processes
        output, _ = execute_and_show(ssh, "ps aux | grep -E 'node|npm' | grep -v grep | wc -l")
        count = output.strip()
        print(f"  📊 {count} Node/NPM processes running")
        
        # Show running processes
        print("\n  Running processes:")
        output, _ = execute_and_show(ssh, "ps aux | grep -E 'node|npm' | grep -v grep | awk '{print $11, $12, $13}' | head -10")
        
        # Check logs for errors
        print("\n📝 Checking logs for errors...")
        output, _ = execute_and_show(ssh, f"cd {REMOTE_PATH} && tail -n 5 *.log 2>/dev/null | grep -E 'Error|error|ERROR' | head -10")
        
        if not output.strip():
            print("  ✅ No errors found in logs")
        
        # Test frontend
        print("\n🌐 Testing frontend...")
        output, _ = execute_and_show(ssh, "curl -I -s http://localhost:5173 | head -1")
        if "200" in output or "404" in output or "302" in output:
            print("  ✅ Frontend server is responding!")
        else:
            print("  ⚠️ Frontend not responding yet")
            print("  Checking frontend log...")
            output, _ = execute_and_show(ssh, f"cd {REMOTE_PATH} && tail -5 frontend.log 2>/dev/null")
        
        # Final message
        print("\n" + "="*60)
        print("🎉 JARVI SETUP COMPLETE!")
        print("="*60)
        print(f"\n📍 Try accessing JARVI at:")
        print(f"  http://192.168.1.141:5173")
        print(f"\n🔍 To check full status, run:")
        print(f"  ssh {USER}@{HOST}")
        print(f"  cd {REMOTE_PATH}")
        print(f"  tail -f frontend.log")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()

if __name__ == "__main__":
    main()