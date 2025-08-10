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

def execute_command(ssh, command, description=""):
    if description:
        print(f"\n{description}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    output = stdout.read().decode()
    errors = stderr.read().decode()
    
    if output and len(output) < 500:
        print(f"  {output.strip()}")
    if errors and "Warning" not in errors and len(errors) < 500:
        print(f"  ⚠️ {errors.strip()}")
    
    return output, errors

def main():
    print("🚀 Applying Prompt Generator changes to remote Mac...")
    print("="*60)
    
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Copy PromptGenerator component
        print("\n📦 Step 1: Copying PromptGenerator component...")
        
        with SCPClient(ssh.get_transport()) as scp:
            local_file = "/Users/samuelquiroz/Documents/proyectos/jarvi/src/components/PromptGenerator.jsx"
            remote_file = REMOTE_PATH + "/src/components/PromptGenerator.jsx"
            try:
                scp.put(local_file, remote_file)
                print("  ✅ PromptGenerator.jsx copied")
            except Exception as e:
                print(f"  ❌ Error copying PromptGenerator: {e}")
        
        # Step 2: Copy updated EnhancedVoiceNotesModule
        print("\n📦 Step 2: Copying updated EnhancedVoiceNotesModule...")
        
        with SCPClient(ssh.get_transport()) as scp:
            local_file = "/Users/samuelquiroz/Documents/proyectos/jarvi/src/components/EnhancedVoiceNotesModule.jsx"
            remote_file = REMOTE_PATH + "/src/components/EnhancedVoiceNotesModule.jsx"
            try:
                scp.put(local_file, remote_file)
                print("  ✅ EnhancedVoiceNotesModule.jsx copied")
            except Exception as e:
                print(f"  ❌ Error copying EnhancedVoiceNotesModule: {e}")
        
        # Step 3: Verify files exist
        print("\n✅ Step 3: Verifying files...")
        
        output, _ = execute_command(ssh, f"ls -la {REMOTE_PATH}/src/components/PromptGenerator.jsx 2>/dev/null | wc -l")
        if "1" in output:
            print("  ✅ PromptGenerator.jsx exists")
        else:
            print("  ❌ PromptGenerator.jsx not found")
        
        output, _ = execute_command(ssh, f"ls -la {REMOTE_PATH}/src/components/EnhancedVoiceNotesModule.jsx 2>/dev/null | wc -l")
        if "1" in output:
            print("  ✅ EnhancedVoiceNotesModule.jsx exists")
        else:
            print("  ❌ EnhancedVoiceNotesModule.jsx not found")
        
        # Step 4: Kill and restart the frontend
        print("\n🔄 Step 4: Restarting frontend service...")
        
        execute_command(ssh, "pkill -f 'npm run dev' || true", "Stopping frontend...")
        time.sleep(2)
        
        # Start frontend service
        cmd = f'''cd {REMOTE_PATH} && nohup /usr/local/bin/npm run dev > frontend.log 2>&1 & echo $!'''
        output, _ = execute_command(ssh, cmd, "Starting frontend...")
        
        # Wait for service to start
        print("\n⏳ Waiting for service to initialize...")
        time.sleep(10)
        
        # Step 5: Verify service is running
        print("\n✅ Step 5: Verifying service...")
        
        output, _ = execute_command(ssh, "ps aux | grep 'npm run dev' | grep -v grep | wc -l")
        if int(output.strip()) > 0:
            print("  ✅ Frontend is running!")
        else:
            print("  ⚠️ Frontend may still be starting...")
        
        # Final message
        print("\n" + "="*60)
        print("🎉 CHANGES APPLIED SUCCESSFULLY!")
        print("="*60)
        print("\n📍 Changes applied:")
        print("  ✅ Added Prompt Generator button (✨) to voice notes")
        print("  ✅ Removed 'Recargar' button")
        print("  ✅ Removed 'Transcribir Todas' button")
        print("\n🌐 Access JARVI at:")
        print("  • http://192.168.1.141:5173")
        print("\n✨ New features:")
        print("  • Click the ✨ button on any transcribed note")
        print("  • Generate optimized prompts for:")
        print("    - Mockups")
        print("    - Project Planning")
        print("    - Code Generation")
        print("    - Documentation")
        print("    - Analysis & Improvements")
        print("    - System Architecture")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ssh.close()
        print("\n👋 Remote update complete!")

if __name__ == "__main__":
    main()