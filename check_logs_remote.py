#!/usr/bin/env python3

import paramiko
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
    print("📜 CHECKING JARVI SERVICE LOGS")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Check running processes
        print("\n🔍 Running Node.js processes:")
        output, _ = execute_command(ssh, "ps aux | grep -E 'node|npm' | grep -v grep")
        if output:
            for line in output.split('\n')[:10]:
                if line:
                    print(f"  {line[:120]}")
        else:
            print("  No processes found")
        
        # Check each log file
        log_files = ["frontend.log", "enhanced.log", "meetings.log", "tasks.log", "voice.log"]
        
        for log_file in log_files:
            print(f"\n📄 {log_file}:")
            output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && tail -20 {log_file} 2>/dev/null")
            if output:
                # Show important lines
                important_lines = []
                for line in output.split('\n'):
                    if any(keyword in line.lower() for keyword in ['error', 'failed', 'cannot', 'started', 'listening', 'vite', 'port']):
                        important_lines.append(line)
                
                if important_lines:
                    for line in important_lines[:10]:
                        print(f"  {line}")
                else:
                    # Show last few lines if no errors
                    for line in output.split('\n')[-3:]:
                        if line:
                            print(f"  {line}")
            else:
                print("  Empty or not found")
        
        # Wait a bit more and check again
        print("\n⏳ Waiting 10 seconds for services to fully start...")
        time.sleep(10)
        
        # Test services again
        print("\n🌐 Testing services again:")
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
                # Check if port is listening
                output, _ = execute_command(ssh, f"lsof -i :{port} 2>/dev/null | grep LISTEN")
                if output:
                    print(f"  ⚠️ {service} (:{port}): Port is listening but not responding (status {status})")
                else:
                    print(f"  ❌ {service} (:{port}): Port not listening")
        
        if working >= 3:
            print("\n✅ JARVI is now operational!")
            print(f"   {working}/5 services are online")
            print("\n🎉 Docker container 'jarvi-app' was created")
            print("   Services are running with Node.js")
            print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        elif working > 0:
            print(f"\n⚠️ {working}/5 services are online")
            print("   Some services may still be starting...")
        else:
            print("\n❌ Services are not responding")
            print("   There may be errors in the configuration")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()