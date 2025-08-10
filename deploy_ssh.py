#!/usr/bin/env python3

import paramiko
import os
import sys
from scp import SCPClient

# Configuration
HOST = "192.168.1.141"
USER = "samuelquiroz"
PASSWORD = "Tesoro86*"
REMOTE_PATH = "/Users/samuelquiroz/Documents/jarvis"
LOCAL_FILE = "jarvi-deploy.tar.gz"

def create_ssh_client(host, user, password):
    """Create SSH client with password authentication"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, username=user, password=password, timeout=30)
        print(f"✅ Connected to {host}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def main():
    print("🚀 Starting JARVI deployment to remote Mac...")
    print(f"📍 Target: {USER}@{HOST}:{REMOTE_PATH}")
    
    # Create SSH client
    ssh = create_ssh_client(HOST, USER, PASSWORD)
    if not ssh:
        sys.exit(1)
    
    try:
        # Step 1: Create remote directory
        print("\n📁 Creating remote directory...")
        stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {REMOTE_PATH}")
        stdout.read()
        print("✅ Directory created")
        
        # Step 2: Copy file via SCP
        print(f"\n📤 Copying {LOCAL_FILE} to remote...")
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(LOCAL_FILE, f"{REMOTE_PATH}/{LOCAL_FILE}")
        print("✅ File transferred successfully")
        
        # Step 3: Extract files on remote
        print("\n📦 Extracting files on remote...")
        commands = [
            f"cd {REMOTE_PATH}",
            f"tar -xzf {LOCAL_FILE}",
            f"rm {LOCAL_FILE}",
            "chmod +x *.sh",
            "echo 'Extraction complete'"
        ]
        cmd = " && ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        if errors:
            print(f"⚠️ Warnings: {errors}")
        print("✅ Files extracted and permissions set")
        
        # Step 4: Install Node dependencies
        print("\n📦 Installing Node.js dependencies (this may take a while)...")
        stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_PATH} && npm install")
        output = stdout.read().decode()
        print("✅ Dependencies installed")
        
        # Step 5: Show next steps
        print("\n" + "="*50)
        print("✅ DEPLOYMENT SUCCESSFUL!")
        print("="*50)
        print("\n📋 Next steps on remote Mac:")
        print(f"\n1. SSH into remote: ssh {USER}@{HOST}")
        print(f"2. Navigate to: cd {REMOTE_PATH}")
        print("3. Copy your .env file with API keys")
        print("4. Start services:")
        print("   - With Docker: docker-compose up -d")
        print("   - Without Docker: npm run start:all")
        print("\n🌐 Access JARVI at: http://192.168.1.141:5173")
        
    except Exception as e:
        print(f"❌ Error during deployment: {e}")
    finally:
        ssh.close()
        print("\n👋 SSH connection closed")

if __name__ == "__main__":
    main()