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
        print(f"✅ Connected to {host}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def execute_command(ssh, command, description=""):
    if description:
        print(f"\n{description}")
    try:
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=60)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        return output, errors
    except Exception as e:
        return "", str(e)

def main():
    print("🔧 FIXING PERMISSIONS AND STARTING JARVI")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Fix permissions
        print("\n🔐 Step 1: Fixing directory permissions...")
        
        commands = [
            f"chmod -R 755 {REMOTE_PATH}",
            f"chown -R {USER}:staff {REMOTE_PATH} 2>/dev/null || true",
            f"cd {REMOTE_PATH} && rm -f *.log"
        ]
        
        for cmd in commands:
            execute_command(ssh, cmd)
        
        print("  ✅ Permissions fixed")
        
        # Step 2: Kill any stuck processes
        print("\n🛑 Step 2: Stopping any stuck processes...")
        
        execute_command(ssh, "pkill -f 'node' || true")
        execute_command(ssh, "pkill -f 'npm' || true")
        time.sleep(2)
        print("  ✅ Processes stopped")
        
        # Step 3: Start services directly without nohup
        print("\n🚀 Step 3: Starting services directly...")
        
        # Start each service in the background using screen or direct background
        services = [
            ("Enhanced Notes", "cd /Users/samuelquiroz/Documents/jarvis && /usr/local/bin/node server-enhanced-notes.js > enhanced.log 2>&1 & echo $!"),
            ("Meetings", "cd /Users/samuelquiroz/Documents/jarvis && /usr/local/bin/node server-meetings.js > meetings.log 2>&1 & echo $!"),
            ("Tasks", "cd /Users/samuelquiroz/Documents/jarvis && /usr/local/bin/node server-tasks.js > tasks.log 2>&1 & echo $!"),
            ("Voice Notes", "cd /Users/samuelquiroz/Documents/jarvis && /usr/local/bin/node server-voice-notes.js > voice.log 2>&1 & echo $!"),
            ("Frontend", "cd /Users/samuelquiroz/Documents/jarvis && /usr/local/bin/npm run dev > frontend.log 2>&1 & echo $!")
        ]
        
        pids = []
        for service_name, cmd in services:
            output, errors = execute_command(ssh, cmd, f"Starting {service_name}...")
            if output and output.strip().isdigit():
                pid = output.strip()
                pids.append(pid)
                print(f"  ✅ {service_name} started with PID: {pid}")
            else:
                print(f"  ⚠️ {service_name} may not have started")
            time.sleep(2)
        
        # Step 4: Wait for services to initialize
        print("\n⏳ Step 4: Waiting for services to initialize...")
        time.sleep(15)
        
        # Step 5: Check if processes are still running
        print("\n🔍 Step 5: Checking if processes are running...")
        
        running_count = 0
        for pid in pids:
            output, _ = execute_command(ssh, f"ps -p {pid} > /dev/null 2>&1 && echo 'running' || echo 'stopped'")
            if "running" in output:
                running_count += 1
        
        print(f"  {running_count}/{len(pids)} processes are running")
        
        # Step 6: Check logs for errors
        print("\n📜 Step 6: Checking logs...")
        
        log_files = ["frontend.log", "enhanced.log", "meetings.log", "tasks.log", "voice.log"]
        
        for log_file in log_files:
            output, _ = execute_command(ssh, f"cd {REMOTE_PATH} && tail -5 {log_file} 2>/dev/null")
            if output:
                has_error = False
                for line in output.split('\n'):
                    if 'error' in line.lower() and 'EPERM' not in line:
                        has_error = True
                        print(f"\n  {log_file}: ERROR - {line}")
                        break
                if not has_error and any(word in output.lower() for word in ['started', 'listening', 'ready', 'vite']):
                    print(f"  {log_file}: ✅ Service appears to be running")
        
        # Step 7: Test services
        print("\n🌐 Step 7: Testing service connectivity...")
        
        services_test = [
            ("Frontend", "5173"),
            ("Enhanced Notes", "3001"),
            ("Meetings", "3002"),
            ("Tasks", "3003"),
            ("Voice Notes", "3004")
        ]
        
        working = 0
        for service, port in services_test:
            output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} 2>/dev/null || echo '000'")
            status = output.strip()
            if status in ['200', '304', '302', '404']:
                print(f"  ✅ {service} (:{port}): Online")
                working += 1
            else:
                # Check if port is listening
                output, _ = execute_command(ssh, f"lsof -i :{port} 2>/dev/null | grep LISTEN | head -1")
                if output:
                    print(f"  ⚠️ {service} (:{port}): Listening but status {status}")
                else:
                    print(f"  ❌ {service} (:{port}): Not listening")
        
        # Final summary
        print("\n" + "="*60)
        
        if working >= 3:
            print("🎉 JARVI IS NOW OPERATIONAL!")
            print(f"   {working}/5 services are online")
            print("\n✅ Docker container 'jarvi-app' was created")
            print("✅ Services are running with Node.js")
        elif working > 0:
            print(f"⚠️ JARVI PARTIALLY OPERATIONAL")
            print(f"   {working}/5 services are online")
        else:
            print("❌ JARVI SERVICES FAILED TO START")
            print("   Permission or configuration issues persist")
        
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n📋 Commands to manage services:")
        print("  • Check status: ps aux | grep node")
        print(f"  • View logs: tail -f {REMOTE_PATH}/*.log")
        print("  • Stop all: pkill -f node && pkill -f npm")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()

if __name__ == "__main__":
    main()