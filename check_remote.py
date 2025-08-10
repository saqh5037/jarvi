#!/usr/bin/env python3

import paramiko

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
    print("🔍 Checking JARVI status on remote Mac...")
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        return
    
    try:
        # Check running Node processes
        print("\n📊 Running Node processes:")
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep node | grep -v grep")
        output = stdout.read().decode()
        if output:
            for line in output.strip().split('\n'):
                if 'node' in line:
                    # Extract just the command part
                    parts = line.split()
                    if len(parts) > 10:
                        cmd = ' '.join(parts[10:])[:60]
                        print(f"  ✅ {cmd}")
        else:
            print("  ⚠️ No Node processes found")
        
        # Check if ports are listening
        print("\n🔌 Checking ports:")
        ports = [5173, 3001, 3002, 3003, 3004]
        for port in ports:
            stdin, stdout, stderr = ssh.exec_command(f"lsof -i :{port} | grep LISTEN | head -1")
            output = stdout.read().decode()
            if output:
                print(f"  ✅ Port {port} is listening")
            else:
                print(f"  ❌ Port {port} is NOT listening")
        
        # Check log files
        print("\n📝 Recent log entries:")
        stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && tail -n 2 *.log 2>/dev/null | head -20")
        output = stdout.read().decode()
        if output:
            for line in output.strip().split('\n')[:10]:
                if line and not line.startswith('==>'):
                    print(f"  {line[:80]}")
        
        # Try to access frontend
        print("\n🌐 Testing frontend access:")
        stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:5173 | head -1")
        output = stdout.read().decode()
        if "<!doctype html>" in output.lower() or "<!DOCTYPE html>" in output:
            print("  ✅ Frontend is responding on localhost")
        else:
            print(f"  ⚠️ Frontend response: {output[:50]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()