#!/usr/bin/env python3

import paramiko
import sys
import time

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"

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
    print("🔍 VERIFYING JARVI DOCKER STATUS")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Check container status
        print("\n📊 Docker Container Status:")
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi")
        if "jarvi-app" in output:
            print("✅ Container 'jarvi-app' is running!")
            lines = output.strip().split('\n')
            for line in lines:
                print(f"  {line}")
        else:
            print("❌ No JARVI container found running")
            
            # Check all containers
            output, _ = execute_command(ssh, "docker ps -a --filter name=jarvi")
            if "jarvi" in output:
                print("\n⚠️ JARVI container exists but is not running:")
                print(output)
        
        # Check logs
        print("\n📜 Latest Container Logs:")
        output, errors = execute_command(ssh, "docker logs jarvi-app --tail 50 2>&1")
        
        # Look for important messages
        important_lines = []
        for line in output.split('\n'):
            if any(keyword in line.lower() for keyword in ['error', 'failed', 'started', 'listening', 'vite', '✅', '🚀', '🌐']):
                important_lines.append(line)
        
        if important_lines:
            for line in important_lines[-20:]:
                print(f"  {line}")
        else:
            print("  No significant log entries found")
        
        # Test services
        print("\n🌐 Testing Service Connectivity:")
        
        services = [
            ("Frontend (Vite)", "5173", "/"),
            ("Enhanced Notes API", "3001", "/health"),
            ("Meetings API", "3002", "/health"),
            ("Tasks API", "3003", "/health"),
            ("Voice Notes API", "3004", "/health")
        ]
        
        working_services = 0
        for service, port, endpoint in services:
            # Try multiple times as services may be starting
            for attempt in range(3):
                output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port}{endpoint} 2>/dev/null || echo '000'")
                status = output.strip()
                
                if status in ['200', '304', '302', '404']:  # 404 means server is responding
                    print(f"  ✅ {service} on port {port}: Online (status {status})")
                    working_services += 1
                    break
                elif attempt == 2:
                    print(f"  ⚠️ {service} on port {port}: Not responding")
                else:
                    time.sleep(2)  # Wait before retry
        
        # Summary
        print("\n" + "="*60)
        if working_services >= 3:
            print("✅ JARVI DOCKER CONTAINER IS OPERATIONAL!")
            print(f"   {working_services}/5 services are responding")
        elif working_services > 0:
            print("⚠️ JARVI CONTAINER IS PARTIALLY OPERATIONAL")
            print(f"   {working_services}/5 services are responding")
            print("   Services may still be initializing...")
        else:
            print("❌ JARVI CONTAINER SERVICES ARE NOT RESPONDING")
            print("   Container may need more time or there may be an issue")
        
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        
        # If no services are working, check if Node.js services are running
        if working_services == 0:
            print("\n🔍 Checking for Node.js fallback services...")
            output, _ = execute_command(ssh, "ps aux | grep -E 'node (server|npm)' | grep -v grep")
            if "server-" in output or "npm run dev" in output:
                print("✅ Node.js services are running as fallback")
            else:
                print("⚠️ No Node.js services detected either")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()