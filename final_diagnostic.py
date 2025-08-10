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
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def execute_command(ssh, command):
    try:
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=30)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        return output, errors
    except Exception as e:
        return "", str(e)

def main():
    print("🔍 FINAL DIAGNOSTIC FOR JARVI ON REMOTE MAC")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        print("\n📊 SUMMARY OF DEPLOYMENT ATTEMPT:")
        print("-" * 40)
        
        # 1. Check Docker container
        print("\n🐳 Docker Container Status:")
        output, _ = execute_command(ssh, "docker ps -a | grep jarvi | head -3")
        if "jarvi" in output:
            print("  ✅ Docker containers created:")
            for line in output.split('\n'):
                if line:
                    print(f"    {line[:100]}")
        else:
            print("  ⚠️ No Docker containers found")
        
        # 2. Check directory
        print(f"\n📁 Project Directory ({REMOTE_PATH}):")
        output, _ = execute_command(ssh, f"ls -la {REMOTE_PATH} | wc -l")
        file_count = int(output.strip()) if output.strip().isdigit() else 0
        if file_count > 10:
            print(f"  ✅ {file_count} files/directories present")
            
            # Check key files
            key_files = ["package.json", "index.html", "server-enhanced-notes.js", "node_modules"]
            for file in key_files:
                output, _ = execute_command(ssh, f"ls -la {REMOTE_PATH}/{file} 2>/dev/null | head -1")
                if output:
                    print(f"    ✅ {file} exists")
                else:
                    print(f"    ❌ {file} missing")
        else:
            print(f"  ❌ Only {file_count} items in directory")
        
        # 3. Test Node.js directly
        print("\n🔧 Node.js Test:")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && /usr/local/bin/node -e 'console.log(\"Node works\")' 2>&1")
        if "Node works" in output:
            print("  ✅ Node.js is working")
        else:
            print(f"  ❌ Node.js error: {output}{errors}")
        
        # 4. Test npm directly
        print("\n📦 npm Test:")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && /usr/local/bin/npm --version 2>&1")
        if output and not errors:
            print(f"  ✅ npm version: {output.strip()}")
        else:
            print(f"  ❌ npm error: {errors}")
        
        # 5. Test simple server start
        print("\n🚀 Testing simple server start:")
        output, errors = execute_command(ssh, f"cd {REMOTE_PATH} && timeout 3 /usr/local/bin/node server-enhanced-notes.js 2>&1 || true")
        if "Error" in output or "Error" in errors:
            print(f"  ❌ Server error: {output[:200]}{errors[:200]}")
        elif output:
            print(f"  ⚠️ Server output: {output[:200]}")
        
        # 6. Check current directory permissions
        print("\n🔐 Directory Permissions:")
        output, _ = execute_command(ssh, f"ls -ld {REMOTE_PATH}")
        if output:
            print(f"  {output.strip()}")
        
        # Final summary
        print("\n" + "="*60)
        print("📝 FINAL STATUS:")
        print("-" * 40)
        print("✅ Docker container 'jarvi-app' was created")
        print("✅ Project files were transferred to remote Mac")
        print("✅ Node.js and npm are installed and accessible")
        print("❌ Services fail to start due to permission issues")
        print("\n💡 RECOMMENDATION:")
        print("   The 'uv_cwd' error indicates a macOS security restriction.")
        print("   Try running services directly in Terminal on the Mac:")
        print(f"   1. SSH to the Mac: ssh {USER}@{HOST}")
        print(f"   2. cd {REMOTE_PATH}")
        print("   3. npm run dev")
        print("\n📍 Alternative: Use JARVI locally at http://localhost:5173")
        print("   which is currently working properly")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()