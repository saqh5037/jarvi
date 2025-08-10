import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.fromName = process.env.EMAIL_FROM_NAME || 'JARVI Assistant';
    this.fromEmail = process.env.EMAIL_USER;

    // Verificar configuración al inicializar
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Servicio de email configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando email:', error.message);
      console.log('💡 Configura EMAIL_USER y EMAIL_PASS en el .env');
    }
  }

  async sendMeetingMinutes(meeting, recipients) {
    try {
      const subject = `Minuta: ${meeting.title}`;
      
      const htmlBody = this.generateMeetingMinutesHTML(meeting);
      const textBody = this.generateMeetingMinutesText(meeting);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
        subject: subject,
        text: textBody,
        html: htmlBody,
        attachments: []
      };

      // Agregar archivo de audio como adjunto si existe
      if (meeting.audioFile && meeting.filePath) {
        mailOptions.attachments.push({
          filename: meeting.audioFile,
          path: meeting.filePath,
          contentType: 'audio/ogg'
        });
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Minuta enviada por email:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        recipients: mailOptions.to
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }

  generateMeetingMinutesHTML(meeting) {
    const date = new Date(meeting.date || meeting.timestamp).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header .subtitle { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .section { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
        .section h2 { color: #667eea; margin-top: 0; font-size: 20px; }
        .participants { display: flex; flex-wrap: wrap; gap: 10px; }
        .participant { background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; }
        .key-points, .action-items { list-style: none; padding: 0; }
        .key-points li, .action-items li { background: white; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 3px solid #28a745; }
        .action-items li { border-left-color: #ffc107; }
        .action-item { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .assignee { background: #e9ecef; padding: 3px 8px; border-radius: 12px; font-size: 12px; color: #495057; }
        .deadline { background: #fff3cd; padding: 3px 8px; border-radius: 12px; font-size: 12px; color: #856404; }
        .transcription { background: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 8px; font-style: italic; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #6c757d; font-size: 14px; border-top: 1px solid #dee2e6; }
        .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 ${meeting.title}</h1>
        <div class="subtitle">Minuta generada automáticamente por JARVI</div>
        <div class="subtitle">${date}</div>
    </div>

    <div class="stats">
        <div class="stat">
            <div class="stat-number">${this.formatDuration(meeting.duration)}</div>
            <div class="stat-label">Duración</div>
        </div>
        <div class="stat">
            <div class="stat-number">${meeting.participants ? meeting.participants.length : 0}</div>
            <div class="stat-label">Participantes</div>
        </div>
        <div class="stat">
            <div class="stat-number">${meeting.keyPoints ? meeting.keyPoints.length : 0}</div>
            <div class="stat-label">Puntos Clave</div>
        </div>
        <div class="stat">
            <div class="stat-number">${meeting.actionItems ? meeting.actionItems.length : 0}</div>
            <div class="stat-label">Acciones</div>
        </div>
    </div>

    ${meeting.participants && meeting.participants.length > 0 ? `
    <div class="section">
        <h2>👥 Participantes</h2>
        <div class="participants">
            ${meeting.participants.map(participant => `<span class="participant">${participant}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    ${meeting.summary ? `
    <div class="section">
        <h2>📝 Resumen Ejecutivo</h2>
        <p>${meeting.summary}</p>
    </div>
    ` : ''}

    ${meeting.keyPoints && meeting.keyPoints.length > 0 ? `
    <div class="section">
        <h2>🔑 Puntos Clave Discutidos</h2>
        <ul class="key-points">
            ${meeting.keyPoints.map(point => `<li>• ${point}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${meeting.actionItems && meeting.actionItems.length > 0 ? `
    <div class="section">
        <h2>✅ Acciones a Realizar</h2>
        <ul class="action-items">
            ${meeting.actionItems.map(item => `
                <li>
                    <div class="action-item">
                        <strong>${item.task}</strong>
                        <div>
                            <span class="assignee">👤 ${item.assignee}</span>
                            <span class="deadline">📅 ${item.deadline}</span>
                        </div>
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${meeting.transcription ? `
    <div class="section">
        <h2>📄 Transcripción Completa</h2>
        <div class="transcription">
            "${meeting.transcription}"
        </div>
    </div>
    ` : ''}

    ${meeting.tags && meeting.tags.length > 0 ? `
    <div class="section">
        <h2>🏷️ Tags</h2>
        <div class="participants">
            ${meeting.tags.map(tag => `<span class="participant">#${tag}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>🤖 Esta minuta fue generada automáticamente por <strong>JARVI</strong></p>
        <p>Sistema de Inteligencia Artificial para gestión de reuniones</p>
        <p><em>Generado el ${new Date().toLocaleString('es-ES')}</em></p>
    </div>
</body>
</html>`;
  }

  generateMeetingMinutesText(meeting) {
    const date = new Date(meeting.date || meeting.timestamp).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `
📋 MINUTA: ${meeting.title}
════════════════════════════════════════

📅 Fecha: ${date}
⏱️  Duración: ${this.formatDuration(meeting.duration)}
👥 Participantes: ${meeting.participants ? meeting.participants.length : 0}

`;

    if (meeting.participants && meeting.participants.length > 0) {
      text += `👥 PARTICIPANTES:
${meeting.participants.map(p => `• ${p}`).join('\n')}

`;
    }

    if (meeting.summary) {
      text += `📝 RESUMEN EJECUTIVO:
${meeting.summary}

`;
    }

    if (meeting.keyPoints && meeting.keyPoints.length > 0) {
      text += `🔑 PUNTOS CLAVE DISCUTIDOS:
${meeting.keyPoints.map(point => `• ${point}`).join('\n')}

`;
    }

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      text += `✅ ACCIONES A REALIZAR:
${meeting.actionItems.map(item => `• ${item.task} (Responsable: ${item.assignee}, Fecha: ${item.deadline})`).join('\n')}

`;
    }

    if (meeting.transcription) {
      text += `📄 TRANSCRIPCIÓN COMPLETA:
"${meeting.transcription}"

`;
    }

    if (meeting.tags && meeting.tags.length > 0) {
      text += `🏷️ TAGS:
${meeting.tags.map(tag => `#${tag}`).join(', ')}

`;
    }

    text += `
════════════════════════════════════════
🤖 Minuta generada automáticamente por JARVI
📧 Sistema de IA para gestión de reuniones
🕒 Generado el ${new Date().toLocaleString('es-ES')}
`;

    return text;
  }

  formatDuration(seconds) {
    if (!seconds) return '0min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  async sendTestEmail() {
    try {
      const testEmail = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: this.fromEmail,
        subject: '🧪 Test JARVI Email Service',
        html: `
          <h2>✅ Servicio de Email Funcionando</h2>
          <p>Este es un email de prueba del sistema JARVI.</p>
          <p><strong>Configuración exitosa!</strong></p>
          <p><em>Enviado el ${new Date().toLocaleString('es-ES')}</em></p>
        `,
        text: 'Test email de JARVI - Servicio funcionando correctamente!'
      };

      const result = await this.transporter.sendMail(testEmail);
      console.log('✅ Email de prueba enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error enviando email de prueba:', error);
      throw error;
    }
  }
}

export default new EmailService();