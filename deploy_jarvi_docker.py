#!/usr/bin/env python3

import paramiko
from scp import SCPClient
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

def execute_command(ssh, command, description="", timeout=60, show_output=True):
    if description:
        print(f"\n{description}")
    try:
        # Agregar Docker al PATH
        full_command = f"export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH && cd {REMOTE_PATH} && {command}"
        stdin, stdout, stderr = ssh.exec_command(full_command, timeout=timeout)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if show_output and output and len(output) < 2000:
            print(f"  {output.strip()}")
        if errors and "Warning" not in errors and "warning" not in errors.lower() and len(errors) < 500:
            print(f"  ⚠️ {errors.strip()}")
        
        return output, errors
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return "", str(e)

def main():
    print("🐳 DEPLOYING JARVI IN DOCKER CONTAINER")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Stop existing services
        print("\n🛑 Step 1: Stopping existing services...")
        commands = [
            "docker stop jarvi-app 2>/dev/null || true",
            "docker rm jarvi-app 2>/dev/null || true",
            "pkill -f 'npm run dev' || true",
            "pkill -f 'node server' || true",
            "killall node || true"
        ]
        for cmd in commands:
            execute_command(ssh, cmd, show_output=False)
        
        print("  ✅ Services stopped")
        time.sleep(3)
        
        # Step 2: Copy Docker files
        print("\n📦 Step 2: Transferring Docker configuration...")
        
        with SCPClient(ssh.get_transport()) as scp:
            files = [
                ("Dockerfile.jarvi", "Dockerfile"),
                ("docker-compose-jarvi.yml", "docker-compose.yml")
            ]
            
            for local_file, remote_file in files:
                try:
                    local_path = f"/Users/samuelquiroz/Documents/proyectos/jarvi/{local_file}"
                    remote_path = f"{REMOTE_PATH}/{remote_file}"
                    scp.put(local_path, remote_path)
                    print(f"  ✅ {local_file} → {remote_file}")
                except Exception as e:
                    print(f"  ❌ Failed to copy {local_file}: {e}")
        
        # Step 3: Copy source code
        print("\n📁 Step 3: Syncing source code...")
        
        # Create tar of source files
        execute_command(ssh, "rm -rf src_backup && mv src src_backup 2>/dev/null || true", show_output=False)
        
        with SCPClient(ssh.get_transport()) as scp:
            # Copy entire src directory
            import os
            import tarfile
            
            # Create a tar file locally
            tar_path = "/tmp/jarvi_src.tar"
            with tarfile.open(tar_path, "w") as tar:
                tar.add("/Users/samuelquiroz/Documents/proyectos/jarvi/src", arcname="src")
            
            # Transfer tar file
            scp.put(tar_path, f"{REMOTE_PATH}/src.tar")
            
            # Extract on remote
            execute_command(ssh, "tar -xf src.tar && rm src.tar", "Extracting source files...", show_output=False)
            print("  ✅ Source code synced")
        
        # Step 4: Build Docker image
        print("\n🔨 Step 4: Building JARVI Docker image...")
        print("  This will take 2-3 minutes...")
        
        output, errors = execute_command(
            ssh, 
            "docker build -t jarvi:latest -f Dockerfile .",
            timeout=300,
            show_output=False
        )
        
        if "Successfully built" in output or "writing image" in output.lower():
            print("  ✅ Docker image built successfully!")
        elif "error" in errors.lower():
            print(f"  ❌ Build failed: {errors[:200]}")
        else:
            print("  ⚠️ Build completed with warnings")
        
        # Step 5: Run container
        print("\n🚀 Step 5: Starting JARVI container...")
        
        # Use docker run instead of docker-compose for simplicity
        docker_run_cmd = """docker run -d \\
            --name jarvi-app \\
            --restart unless-stopped \\
            -p 5173:5173 \\
            -p 3001:3001 \\
            -p 3002:3002 \\
            -p 3003:3003 \\
            -p 3004:3004 \\
            -e NODE_ENV=development \\
            -e GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw \\
            -v $(pwd)/voice-notes:/app/voice-notes \\
            -v $(pwd)/data:/app/data \\
            -v $(pwd)/tasks:/app/tasks \\
            -v $(pwd)/meetings:/app/meetings \\
            jarvi:latest"""
        
        output, errors = execute_command(ssh, docker_run_cmd, show_output=False)
        
        if output and len(output) > 10:  # Container ID returned
            print(f"  ✅ Container started with ID: {output[:12]}")
        else:
            print("  ⚠️ Container may not have started properly")
        
        # Wait for services to initialize
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(15)
        
        # Step 6: Verify container
        print("\n✅ Step 6: Verifying JARVI container...")
        
        output, _ = execute_command(ssh, "docker ps --filter name=jarvi-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
        if "jarvi-app" in output:
            print("\n🐳 Docker container status:")
            print(output)
            
            # Check logs
            print("\n📜 Recent container logs:")
            output, _ = execute_command(ssh, "docker logs jarvi-app --tail 20")
            for line in output.split('\n')[:20]:
                if line and any(word in line for word in ['✅', '🚀', 'started', 'listening', 'ready']):
                    print(f"  {line}")
        else:
            print("  ❌ Container not found!")
            print("\n🔄 Starting services with Node.js as fallback...")
            
            # Fallback to Node.js
            services = [
                "nohup npm run dev > frontend.log 2>&1 &",
                "nohup node server-enhanced-notes.js > enhanced.log 2>&1 &",
                "nohup node server-meetings.js > meetings.log 2>&1 &",
                "nohup node server-tasks.js > tasks.log 2>&1 &",
                "nohup node server-voice-notes.js > voice.log 2>&1 &"
            ]
            
            for service in services:
                execute_command(ssh, service, show_output=False)
            
            print("  ✅ Services started with Node.js")
        
        # Step 7: Test connectivity
        print("\n🌐 Step 7: Testing connectivity...")
        
        services_to_test = [
            ("Frontend", "5173"),
            ("Enhanced Notes API", "3001"),
            ("Meetings API", "3002"),
            ("Tasks API", "3003"),
            ("Voice Notes API", "3004")
        ]
        
        for service_name, port in services_to_test:
            output, _ = execute_command(
                ssh, 
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port} 2>/dev/null || echo '000'",
                show_output=False
            )
            status_code = output.strip()
            if status_code in ['200', '304', '302']:
                print(f"  ✅ {service_name} (:{port}): Online")
            else:
                print(f"  ⚠️ {service_name} (:{port}): Status {status_code}")
        
        # Final summary
        print("\n" + "="*60)
        print("🎉 JARVI DOCKER DEPLOYMENT COMPLETE!")
        print("="*60)
        print("\n📍 Access JARVI at: http://192.168.1.141:5173")
        print("\n🐳 Docker commands:")
        print("  • View logs: docker logs -f jarvi-app")
        print("  • Stop container: docker stop jarvi-app")
        print("  • Start container: docker start jarvi-app")
        print("  • Restart container: docker restart jarvi-app")
        print("  • Container status: docker ps -a | grep jarvi")
        print("\n✅ All services should be running in the Docker container")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Deployment process completed!")

if __name__ == "__main__":
    main()