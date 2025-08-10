import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de costos por API
const API_COSTS = {
  OPENAI_WHISPER: {
    name: 'OpenAI Whisper',
    costPerMinute: 0.006, // $0.006 por minuto de audio
    currency: 'USD'
  },
  GEMINI: {
    name: 'Google Gemini',
    costPerToken: 0, // Gemini es gratis hasta el límite
    freeTierLimit: 1000000, // 1M tokens gratis por mes
    costAfterLimit: 0.00025, // $0.00025 por 1K tokens después del límite
    currency: 'USD'
  },
  CLAUDE: {
    name: 'Claude',
    costPer1KTokensInput: 0.003, // $0.003 por 1K input tokens
    costPer1KTokensOutput: 0.015, // $0.015 por 1K output tokens
    currency: 'USD'
  }
};

class APICostsTracker {
  constructor() {
    this.costsFile = path.join(__dirname, 'api-costs-data.json');
    this.loadCostsData();
  }

  loadCostsData() {
    try {
      if (fs.existsSync(this.costsFile)) {
        const data = fs.readFileSync(this.costsFile, 'utf8');
        this.costsData = JSON.parse(data);
      } else {
        this.costsData = {
          totalCost: 0,
          dailyCosts: {},
          monthlyCosts: {},
          apiUsage: {
            openai: { calls: 0, audioMinutes: 0, cost: 0 },
            gemini: { calls: 0, tokens: 0, cost: 0 },
            claude: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
          },
          transactions: []
        };
        this.saveCostsData();
      }
    } catch (error) {
      console.error('Error cargando datos de costos:', error);
      this.costsData = {
        totalCost: 0,
        dailyCosts: {},
        monthlyCosts: {},
        apiUsage: {
          openai: { calls: 0, audioMinutes: 0, cost: 0 },
          gemini: { calls: 0, tokens: 0, cost: 0 },
          claude: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
        },
        transactions: []
      };
    }
  }

  saveCostsData() {
    try {
      fs.writeFileSync(this.costsFile, JSON.stringify(this.costsData, null, 2));
    } catch (error) {
      console.error('Error guardando datos de costos:', error);
    }
  }

  // Registrar uso de OpenAI Whisper
  recordOpenAIUsage(audioMinutes, metadata = {}) {
    const cost = audioMinutes * API_COSTS.OPENAI_WHISPER.costPerMinute;
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    this.costsData.apiUsage.openai.calls++;
    this.costsData.apiUsage.openai.audioMinutes += audioMinutes;
    this.costsData.apiUsage.openai.cost += cost;

    this.costsData.totalCost += cost;
    this.costsData.dailyCosts[today] = (this.costsData.dailyCosts[today] || 0) + cost;
    this.costsData.monthlyCosts[month] = (this.costsData.monthlyCosts[month] || 0) + cost;

    this.costsData.transactions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      api: 'openai',
      service: 'whisper',
      cost: cost,
      currency: 'USD',
      usage: { audioMinutes },
      metadata
    });

    this.saveCostsData();

    console.log(`💰 OpenAI Whisper: ${audioMinutes.toFixed(2)} min = $${cost.toFixed(4)}`);
    return cost;
  }

  // Registrar uso de Gemini
  recordGeminiUsage(tokens, metadata = {}) {
    let cost = 0;
    
    // Verificar si hemos excedido el límite gratuito mensual
    const month = new Date().toISOString().substring(0, 7);
    const monthlyTokens = this.getMonthlyTokens('gemini', month);
    
    if (monthlyTokens + tokens > API_COSTS.GEMINI.freeTierLimit) {
      const excessTokens = (monthlyTokens + tokens) - API_COSTS.GEMINI.freeTierLimit;
      cost = (excessTokens / 1000) * API_COSTS.GEMINI.costAfterLimit;
    }

    const today = new Date().toISOString().split('T')[0];

    this.costsData.apiUsage.gemini.calls++;
    this.costsData.apiUsage.gemini.tokens += tokens;
    this.costsData.apiUsage.gemini.cost += cost;

    this.costsData.totalCost += cost;
    this.costsData.dailyCosts[today] = (this.costsData.dailyCosts[today] || 0) + cost;
    this.costsData.monthlyCosts[month] = (this.costsData.monthlyCosts[month] || 0) + cost;

    this.costsData.transactions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      api: 'gemini',
      service: 'transcription',
      cost: cost,
      currency: 'USD',
      usage: { tokens, withinFreeLimit: cost === 0 },
      metadata
    });

    this.saveCostsData();

    console.log(`💰 Gemini: ${tokens} tokens = $${cost.toFixed(4)} ${cost === 0 ? '(FREE)' : ''}`);
    return cost;
  }

  // Registrar uso de Claude
  recordClaudeUsage(inputTokens, outputTokens, metadata = {}) {
    const inputCost = (inputTokens / 1000) * API_COSTS.CLAUDE.costPer1KTokensInput;
    const outputCost = (outputTokens / 1000) * API_COSTS.CLAUDE.costPer1KTokensOutput;
    const cost = inputCost + outputCost;

    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    this.costsData.apiUsage.claude.calls++;
    this.costsData.apiUsage.claude.inputTokens += inputTokens;
    this.costsData.apiUsage.claude.outputTokens += outputTokens;
    this.costsData.apiUsage.claude.cost += cost;

    this.costsData.totalCost += cost;
    this.costsData.dailyCosts[today] = (this.costsData.dailyCosts[today] || 0) + cost;
    this.costsData.monthlyCosts[month] = (this.costsData.monthlyCosts[month] || 0) + cost;

    this.costsData.transactions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      api: 'claude',
      service: 'chat',
      cost: cost,
      currency: 'USD',
      usage: { inputTokens, outputTokens },
      metadata
    });

    this.saveCostsData();

    console.log(`💰 Claude: ${inputTokens}/${outputTokens} tokens = $${cost.toFixed(4)}`);
    return cost;
  }

  // Obtener tokens usados en un mes específico para una API
  getMonthlyTokens(api, month) {
    return this.costsData.transactions
      .filter(t => t.api === api && t.timestamp.startsWith(month))
      .reduce((sum, t) => sum + (t.usage.tokens || 0), 0);
  }

  // Obtener estadísticas de costos
  getCostStats() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    
    // Calcular tokens de Gemini del mes actual
    const geminiMonthlyTokens = this.getMonthlyTokens('gemini', currentMonth);
    const geminiRemainingFreeTokens = Math.max(0, API_COSTS.GEMINI.freeTierLimit - geminiMonthlyTokens);

    return {
      totalCost: this.costsData.totalCost,
      todayCost: this.costsData.dailyCosts[today] || 0,
      monthCost: this.costsData.monthlyCosts[currentMonth] || 0,
      apiUsage: this.costsData.apiUsage,
      geminiFreeTier: {
        used: geminiMonthlyTokens,
        remaining: geminiRemainingFreeTokens,
        limit: API_COSTS.GEMINI.freeTierLimit,
        percentage: (geminiMonthlyTokens / API_COSTS.GEMINI.freeTierLimit) * 100
      },
      recentTransactions: this.costsData.transactions.slice(-10).reverse(),
      dailyCosts: this.costsData.dailyCosts,
      monthlyCosts: this.costsData.monthlyCosts
    };
  }

  // Obtener resumen diario de la última semana
  getWeeklyCosts() {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        cost: this.costsData.dailyCosts[dateStr] || 0
      });
    }
    return result;
  }

  // Reiniciar contadores mensuales (útil para testing)
  resetMonthlyCounters() {
    const month = new Date().toISOString().substring(0, 7);
    this.costsData.monthlyCosts[month] = 0;
    
    // Filtrar transacciones del mes actual
    this.costsData.transactions = this.costsData.transactions.filter(
      t => !t.timestamp.startsWith(month)
    );
    
    this.saveCostsData();
  }
}

// Crear instancia singleton
const costsTracker = new APICostsTracker();

export default costsTracker;