#!/usr/bin/env python3

import paramiko
import sys

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"

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
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=30)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        return output, errors
    except Exception as e:
        return "", str(e)

def main():
    print("🔍 CHECKING JARVI DOCKER CONTAINER STATUS")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Check container status
        print("\n📊 Container Status:")
        output, _ = execute_command(ssh, "docker ps -a --filter name=jarvi-app --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'")
        print(output)
        
        # Get detailed logs
        print("\n📜 Container Logs (last 50 lines):")
        output, _ = execute_command(ssh, "docker logs jarvi-app --tail 50 2>&1")
        print(output)
        
        # Check if container is restarting
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app --format '{{.Status}}'")
        if "Restarting" in output:
            print("\n⚠️ Container is in restart loop. Checking why...")
            
            # Stop container to prevent restart loop
            print("\n🛑 Stopping container to prevent restart loop...")
            execute_command(ssh, "docker stop jarvi-app")
            
            # Try running interactively to see the error
            print("\n🔧 Running container interactively to debug...")
            output, errors = execute_command(ssh, "docker run --rm -it jarvi-custom:latest sh -c 'ls -la /app && echo \"---\" && cat /app/start.sh'")
            print("Directory contents and startup script:")
            print(output)
            if errors:
                print(f"Errors: {errors}")
        
        # Check if we should restart with Node directly
        print("\n💡 Attempting to fix and restart container...")
        
        # Remove the broken container
        execute_command(ssh, "docker rm -f jarvi-app 2>/dev/null")
        
        # Start container with direct Node commands instead of script
        print("\n🚀 Starting container with direct commands...")
        run_cmd = """docker run -d \
            --name jarvi-app \
            --restart unless-stopped \
            -p 5173:5173 \
            -p 3001:3001 \
            -p 3002:3002 \
            -p 3003:3003 \
            -p 3004:3004 \
            -e NODE_ENV=development \
            -e GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw \
            -w /app \
            jarvi-custom:latest \
            sh -c 'node server-enhanced-notes.js & node server-meetings.js & node server-tasks.js & node server-voice-notes.js & npm run dev -- --host 0.0.0.0'"""
        
        output, errors = execute_command(ssh, run_cmd)
        if output and len(output) > 10:
            print(f"  ✅ Container restarted: {output[:12]}")
        else:
            print(f"  ⚠️ Container start output: {output}")
            print(f"  ⚠️ Errors: {errors}")
        
        # Final status check
        import time
        time.sleep(10)
        
        print("\n✅ Final Status Check:")
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app")
        if "jarvi-app" in output:
            print("  ✅ Container is running!")
            
            # Check services
            print("\n🌐 Service Status:")
            services = [("Frontend", "5173"), ("Enhanced", "3001"), ("Meetings", "3002"), ("Tasks", "3003"), ("Voice", "3004")]
            
            for service, port in services:
                output, _ = execute_command(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} || echo '000'")
                status = output.strip()
                if status in ['200', '304', '302']:
                    print(f"  ✅ {service} (:{port}): Online")
                else:
                    print(f"  ⚠️ {service} (:{port}): Status {status}")
        else:
            print("  ❌ Container is not running")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()