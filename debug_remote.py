#!/usr/bin/env python3

import paramiko
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

def execute_command(ssh, command):
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        return output, errors
    except Exception as e:
        return "", str(e)

def main():
    print("🔍 DEBUGGING JARVI SERVICES")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Check Node.js version
        print("\n📦 Node.js version:")
        output, _ = execute_command(ssh, "node --version")
        print(f"  {output.strip()}")
        
        # Check npm version
        print("\n📦 npm version:")
        output, _ = execute_command(ssh, "npm --version")
        print(f"  {output.strip()}")
        
        # Check if project directory exists
        print(f"\n📁 Checking {REMOTE_PATH}:")
        output, _ = execute_command(ssh, f"ls -la {REMOTE_PATH} | head -5")
        print(output)
        
        # Check package.json
        print("\n📋 package.json scripts:")
        output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && cat package.json | grep -A 5 scripts")
        print(output)
        
        # Try starting frontend manually
        print("\n🚀 Starting frontend manually:")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && timeout 5 npm run dev 2>&1")
        if output:
            print("Output:", output[:500])
        if errors:
            print("Errors:", errors[:500])
        
        # Try starting a backend service manually
        print("\n🚀 Starting server-enhanced-notes.js manually:")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && timeout 5 node server-enhanced-notes.js 2>&1")
        if output:
            print("Output:", output[:500])
        if errors:
            print("Errors:", errors[:500])
        
        # Check for missing dependencies
        print("\n🔍 Checking for missing modules:")
        output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && ls node_modules 2>&1 | head -5")
        if "No such file" in output:
            print("  ❌ node_modules not found! Running npm install...")
            
            # Run npm install
            print("\n📦 Installing dependencies:")
            output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && npm install 2>&1 | tail -10")
            print(output)
            if errors:
                print("Errors:", errors)
        else:
            print("  ✅ node_modules exists")
        
        # Check running processes
        print("\n🔍 Checking running Node processes:")
        output, _ = execute_command(ssh, "ps aux | grep node | grep -v grep")
        if output:
            print(output)
        else:
            print("  No Node.js processes running")
        
        # Check log files
        print("\n📜 Checking log files:")
        output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && ls -la *.log 2>&1")
        if "No such file" not in output:
            print(output)
            
            # Show last lines of each log
            log_files = ["frontend.log", "enhanced.log", "meetings.log", "tasks.log", "voice.log"]
            for log in log_files:
                output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && tail -5 {log} 2>/dev/null")
                if output:
                    print(f"\n{log}:")
                    print(output)
        else:
            print("  No log files found")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()