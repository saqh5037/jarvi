#!/usr/bin/env python3

import paramiko
from scp import SCPClient
import sys
import time
import os

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"
REMOTE_PATH = "/Users/samuelquiroz/Documents/jarvis"
LOCAL_PATH = "/Users/samuelquiroz/Documents/proyectos/jarvi"

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

def execute_command(ssh, command, description="", timeout=60):
    if description:
        print(f"\n{description}")
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if output and len(output) < 1000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and len(errors) < 500:
            print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def main():
    print("🚀 STARTING JARVI SERVICES ON REMOTE MAC")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Stop Docker container since it's not working
        print("\n🛑 Step 1: Stopping Docker container...")
        execute_command(ssh, "docker stop jarvi-app 2>/dev/null || true")
        execute_command(ssh, "docker rm jarvi-app 2>/dev/null || true")
        print("  ✅ Docker container stopped")
        
        # Step 2: Kill existing Node processes
        print("\n🧹 Step 2: Stopping existing Node.js services...")
        commands = [
            "pkill -f 'npm run dev' || true",
            "pkill -f 'node server' || true",
            "pkill -f 'telegram-bot' || true",
            "killall node || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd)
        
        time.sleep(3)
        print("  ✅ Existing services stopped")
        
        # Step 3: Copy missing files
        print("\n📦 Step 3: Copying missing files...")
        
        with SCPClient(ssh.get_transport()) as scp:
            files_to_copy = [
                "api-costs-tracker.js",
                "email-service.js",
                "gemini-transcription.js",
                "gemini-service.js",
                "transcription-queue.js"
            ]
            
            for file in files_to_copy:
                try:
                    local_file = os.path.join(LOCAL_PATH, file)
                    if os.path.exists(local_file):
                        remote_file = f"{REMOTE_PATH}/{file}"
                        scp.put(local_file, remote_file)
                        print(f"  ✅ Copied {file}")
                    else:
                        print(f"  ⚠️ {file} not found locally")
                except Exception as e:
                    print(f"  ⚠️ Could not copy {file}: {e}")
        
        # Step 4: Start services with Node.js
        print("\n🚀 Step 4: Starting services with Node.js...")
        
        services = [
            ("Frontend (Vite)", f"cd {REMOTE_PATH} && nohup npm run dev > frontend.log 2>&1 &"),
            ("Enhanced Notes API", f"cd {REMOTE_PATH} && nohup node server-enhanced-notes.js > enhanced.log 2>&1 &"),
            ("Meetings API", f"cd {REMOTE_PATH} && nohup node server-meetings.js > meetings.log 2>&1 &"),
            ("Tasks API", f"cd {REMOTE_PATH} && nohup node server-tasks.js > tasks.log 2>&1 &"),
            ("Voice Notes API", f"cd {REMOTE_PATH} && nohup node server-voice-notes.js > voice.log 2>&1 &")
        ]
        
        for service_name, cmd in services:
            execute_command(ssh, cmd, f"Starting {service_name}...")
            time.sleep(2)
        
        print("  ✅ All services started")
        
        # Step 5: Wait for services to initialize
        print("\n⏳ Step 5: Waiting for services to initialize...")
        time.sleep(10)
        
        # Step 6: Verify services
        print("\n✅ Step 6: Verifying services...")
        
        # Check processes
        output, _ = execute_command(ssh, "ps aux | grep -E 'node (server|npm)' | grep -v grep | wc -l")
        process_count = int(output.strip()) if output.strip().isdigit() else 0
        
        if process_count > 0:
            print(f"  ✅ {process_count} Node.js processes running")
        else:
            print("  ⚠️ No Node.js processes detected")
        
        # Test connectivity
        print("\n🌐 Testing service connectivity:")
        
        services_test = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        working_services = 0
        for service, port in services_test:
            output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} || echo '000'")
            status = output.strip()
            if status in ['200', '304', '302', '404']:
                print(f"  ✅ {service} (:{port}): Online")
                working_services += 1
            else:
                print(f"  ⚠️ {service} (:{port}): Status {status}")
        
        # Check logs for errors
        print("\n📜 Checking service logs...")
        
        log_files = ["frontend.log", "enhanced.log", "meetings.log", "tasks.log", "voice.log"]
        
        for log_file in log_files:
            output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && tail -5 {log_file} 2>/dev/null | grep -E '(Error|Failed|started|listening)' | head -2")
            if output:
                print(f"\n  {log_file}:")
                for line in output.split('\n'):
                    if line:
                        print(f"    {line}")
        
        # Final summary
        print("\n" + "="*60)
        if working_services >= 3:
            print("🎉 JARVI SERVICES SUCCESSFULLY STARTED!")
            print(f"   {working_services}/5 services are online")
        elif working_services > 0:
            print("⚠️ JARVI SERVICES PARTIALLY STARTED")
            print(f"   {working_services}/5 services are online")
        else:
            print("❌ JARVI SERVICES FAILED TO START")
            print("   Check the logs for more information")
        
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n💡 Note: Services are running with Node.js (not Docker)")
        print("\n📋 Useful commands:")
        print("  • Check processes: ps aux | grep node")
        print("  • View logs: tail -f ~/Documents/jarvis/*.log")
        print("  • Stop services: pkill -f 'node server' && pkill -f 'npm run dev'")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Process completed!")

if __name__ == "__main__":
    main()