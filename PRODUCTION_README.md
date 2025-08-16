# 🚀 JARVI Production Deployment Guide

## Version 1.0.0 - Production Release

### 📋 Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- 2GB+ available disk space
- Valid API keys for AI services

### 🔧 Quick Start - Production Deployment

#### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/saqh5037/jarvi.git
cd jarvi

# Checkout production branch
git checkout mejoras250816
```

#### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required configurations:**
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `GEMINI_API_KEY` - Google Gemini API (recommended - free)
- At least one AI service key

#### 3. Migrate Your Local Data (If Applicable)

If you have existing local data to migrate:

```bash
# Run migration script
./scripts/migrate-data.sh
```

This will:
- ✅ Backup all your data
- ✅ Prepare Docker volumes
- ✅ Create migration report

#### 4. Deploy with Docker

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Or use the convenience script
./scripts/start-docker.sh
```

#### 5. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
./scripts/logs-docker.sh

# Access the application
open http://localhost
```

### 📁 Data Structure

```
jarvi/
├── docker-data/          # Docker persistent data
│   ├── voice-notes/      # Voice recordings & transcriptions
│   ├── meetings/         # Meeting recordings & minutes
│   ├── tasks/           # Tasks & todos database
│   └── data/            # System data
├── backups/             # Automatic backups
└── logs/                # Application logs
```

### 🐳 Docker Commands

```bash
# Start services
./scripts/start-docker.sh

# Stop services
./scripts/stop-docker.sh

# View logs
./scripts/logs-docker.sh

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update to latest version
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### 🔍 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80/5173 | Main web interface |
| Enhanced Notes | 3001 | Voice notes management |
| Meetings | 3002 | Meeting management |
| Tasks | 3003 | Task management |
| Voice Processing | 3004 | Voice transcription |
| AI Classifier | 3005 | AI routing & classification |
| Edge TTS | 3007 | Text-to-speech service |

### 📊 Monitoring

#### Health Check
```bash
# Check if services are healthy
curl http://localhost:5173/health
```

#### Service Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs jarvi-app

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### 🔒 Security Recommendations

1. **Environment Variables**
   - Never commit `.env` file
   - Use strong JWT secrets (32+ characters)
   - Rotate API keys regularly

2. **Network Security**
   - Use HTTPS in production (nginx/traefik)
   - Configure firewall rules
   - Limit exposed ports

3. **Data Protection**
   - Regular backups (automated)
   - Encrypt sensitive data
   - Secure file permissions

### 🔄 Backup & Restore

#### Create Backup
```bash
# Manual backup
tar -czf jarvi-backup-$(date +%Y%m%d).tar.gz docker-data/

# Automated backup (add to crontab)
0 2 * * * cd /path/to/jarvi && tar -czf backups/jarvi-$(date +\%Y\%m\%d).tar.gz docker-data/
```

#### Restore from Backup
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore data
tar -xzf jarvi-backup-20250816.tar.gz

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 🚀 Production Optimizations

The production build includes:
- ✅ Minified and optimized frontend
- ✅ Production Node.js configuration
- ✅ Multi-stage Docker build
- ✅ Health checks
- ✅ Automatic restart on failure
- ✅ Non-root user execution
- ✅ Resource limits

### 🆘 Troubleshooting

#### Services not starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check port conflicts
lsof -i :5173,3001-3007

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Permission issues
```bash
# Fix permissions
sudo chown -R 1001:1001 docker-data/
```

#### Memory issues
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.prod.yml
```

### 📈 Performance Tuning

#### Recommended System Requirements
- **Minimum**: 2 CPU cores, 4GB RAM
- **Recommended**: 4 CPU cores, 8GB RAM
- **Storage**: 10GB+ for data growth

#### Docker Resource Limits
Edit `docker-compose.prod.yml`:
```yaml
services:
  jarvi-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 🔄 Updates & Maintenance

#### Update Process
```bash
# Backup current data
./scripts/migrate-data.sh

# Pull latest changes
git pull origin mejoras250816

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Maintenance Mode
```bash
# Stop frontend only
docker-compose -f docker-compose.prod.yml stop jarvi-app

# Perform maintenance
# ...

# Start frontend
docker-compose -f docker-compose.prod.yml start jarvi-app
```

### 📞 Support

- **GitHub Issues**: https://github.com/saqh5037/jarvi/issues
- **Documentation**: See `/docs` folder
- **Version**: 1.0.0
- **License**: MIT

### ✅ Production Checklist

Before going live:
- [ ] Configure all environment variables
- [ ] Test all services locally
- [ ] Setup automated backups
- [ ] Configure HTTPS/SSL
- [ ] Set up monitoring
- [ ] Review security settings
- [ ] Test data migration
- [ ] Document custom configurations

---

**JARVI v1.0.0** - Your AI-Powered Personal Assistant
Built with ❤️ by Samuel Quiroz