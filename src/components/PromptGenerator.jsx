import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Layout, 
  Calendar, 
  Code, 
  FileText, 
  Copy, 
  Check,
  Sparkles,
  Target,
  Layers,
  Settings,
  Brain,
  Zap,
  Package,
  GitBranch,
  Edit3
} from 'lucide-react';
import PromptEditor from './PromptEditor';

const PromptGenerator = ({ transcription, onClose }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');

  const promptTypes = [
    {
      id: 'mockup',
      name: 'Generar Mockup',
      icon: Layout,
      color: 'from-blue-500 to-cyan-500',
      description: 'Crea un diseño visual detallado'
    },
    {
      id: 'planning',
      name: 'Planificación de Proyecto',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      description: 'Estructura un plan completo'
    },
    {
      id: 'code',
      name: 'Generación de Código',
      icon: Code,
      color: 'from-green-500 to-emerald-500',
      description: 'Genera código funcional'
    },
    {
      id: 'documentation',
      name: 'Documentación',
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      description: 'Crea documentación técnica'
    },
    {
      id: 'analysis',
      name: 'Análisis y Mejoras',
      icon: Brain,
      color: 'from-indigo-500 to-purple-500',
      description: 'Analiza y sugiere mejoras'
    },
    {
      id: 'architecture',
      name: 'Arquitectura de Sistema',
      icon: GitBranch,
      color: 'from-teal-500 to-cyan-500',
      description: 'Diseña arquitectura técnica'
    }
  ];

  const generatePromptForType = (type) => {
    const baseContext = transcription || customContext;
    
    const templates = {
      mockup: `# Prompt para Generación de Mockup

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Necesito que diseñes un mockup detallado basado en el contexto anterior. Por favor:

### 1. Estructura Visual
- Crea una descripción detallada del layout principal
- Define la jerarquía visual de los elementos
- Especifica el sistema de navegación
- Describe los componentes interactivos principales

### 2. Diseño de Interfaz
- **Paleta de colores**: Sugiere una paleta moderna y accesible
- **Tipografía**: Define fuentes principales y secundarias
- **Espaciado**: Describe el sistema de grid y márgenes
- **Componentes UI**: Lista todos los componentes necesarios (botones, cards, formularios, etc.)

### 3. Experiencia de Usuario
- Describe el flujo principal del usuario
- Identifica puntos de interacción clave
- Sugiere microinteracciones y animaciones
- Define estados de los componentes (normal, hover, activo, deshabilitado)

### 4. Responsive Design
- Describe adaptaciones para desktop (1920x1080)
- Describe adaptaciones para tablet (768px)
- Describe adaptaciones para móvil (375px)

### 5. Especificaciones Técnicas
- Sugiere tecnologías frontend recomendadas
- Define estructura de componentes
- Especifica consideraciones de rendimiento

### Formato de Salida
Proporciona:
1. Una descripción narrativa del diseño
2. Un esquema ASCII art del layout principal
3. Lista de componentes con especificaciones
4. Código HTML/CSS básico de ejemplo para el componente principal

### Consideraciones Especiales
- Prioriza la accesibilidad (WCAG 2.1 AA)
- Optimiza para velocidad de carga
- Considera modo oscuro/claro
- Asegura compatibilidad cross-browser`,

      planning: `# Prompt para Planificación de Proyecto

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Desarrolla un plan de proyecto completo y detallado basado en el contexto anterior. Incluye:

### 1. Resumen Ejecutivo
- Visión general del proyecto
- Objetivos principales (SMART)
- Alcance y limitaciones
- Stakeholders clave

### 2. Análisis de Requisitos
- **Requisitos Funcionales**: Lista detallada con prioridades (MoSCoW)
- **Requisitos No Funcionales**: Rendimiento, seguridad, escalabilidad
- **Casos de Uso**: Principales escenarios de usuario
- **Criterios de Aceptación**: Métricas de éxito

### 3. Arquitectura y Diseño Técnico
- Stack tecnológico recomendado con justificación
- Arquitectura del sistema (diagrama conceptual)
- Modelo de datos
- APIs e integraciones necesarias

### 4. Plan de Implementación
- **Fase 1 - Preparación** (Semana 1-2)
  - Setup del entorno
  - Investigación y POCs
  - Definición de estándares
  
- **Fase 2 - Desarrollo Core** (Semana 3-6)
  - Funcionalidades principales
  - Testing unitario
  - Documentación técnica
  
- **Fase 3 - Integraciones** (Semana 7-8)
  - APIs externas
  - Testing de integración
  
- **Fase 4 - Optimización** (Semana 9-10)
  - Performance tuning
  - Testing de carga
  - Seguridad
  
- **Fase 5 - Despliegue** (Semana 11-12)
  - Preparación de producción
  - Migración de datos
  - Go-live

### 5. Gestión de Recursos
- **Equipo Necesario**:
  - Roles y responsabilidades
  - Habilidades requeridas
  - Dedicación estimada
  
- **Presupuesto Estimado**:
  - Costos de desarrollo
  - Infraestructura
  - Licencias y servicios
  - Contingencia (15%)

### 6. Gestión de Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| [Identifica 5 riesgos principales] | | | |

### 7. Métricas y KPIs
- Velocidad de desarrollo (story points/sprint)
- Calidad del código (cobertura de tests >80%)
- Performance (tiempo de carga <2s)
- Satisfacción del usuario (NPS >7)

### 8. Entregables
- Lista completa de entregables con fechas
- Criterios de calidad para cada entregable
- Proceso de revisión y aprobación

### Formato de Salida
Proporciona:
1. Timeline visual (Gantt simplificado en texto)
2. Matriz RACI para el equipo
3. Checklist de lanzamiento
4. Propuesta de stack técnico con pros/contras`,

      code: `# Prompt para Generación de Código

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Genera código de producción completo y funcional basado en el contexto anterior. 

### Especificaciones Técnicas
1. **Lenguaje/Framework**: Elige el más apropiado y justifica
2. **Arquitectura**: Implementa patrones de diseño apropiados
3. **Calidad**: Código limpio, mantenible y bien documentado

### Requisitos del Código
- **Funcionalidad Completa**: Implementa todas las características descritas
- **Manejo de Errores**: Try-catch, validaciones, mensajes de error claros
- **Logging**: Sistema de logs para debugging
- **Configuración**: Variables de entorno, archivos de config
- **Testing**: Incluye tests unitarios básicos
- **Documentación**: JSDoc/Docstrings completos

### Estructura del Proyecto
\`\`\`
proyecto/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── services/       # Lógica de negocio
│   ├── utils/          # Funciones auxiliares
│   ├── config/         # Configuración
│   └── tests/          # Tests unitarios
├── docs/               # Documentación
├── .env.example        # Variables de entorno
├── README.md           # Guía de instalación
└── package.json        # Dependencias
\`\`\`

### Características Específicas a Implementar
1. [Analiza el contexto y lista las funcionalidades principales]
2. Validación de datos entrada/salida
3. Autenticación y autorización si aplica
4. Optimización de performance
5. Compatibilidad cross-platform

### Estándares de Código
- Nomenclatura consistente (camelCase/snake_case)
- Máximo 100 líneas por función
- Complejidad ciclomática < 10
- DRY (Don't Repeat Yourself)
- SOLID principles
- Comentarios para lógica compleja

### Formato de Salida
Proporciona:
1. Código fuente completo y ejecutable
2. Archivo de configuración
3. Script de instalación/setup
4. Ejemplos de uso
5. Tests básicos
6. README con instrucciones

### Consideraciones de Seguridad
- Sanitización de inputs
- Prevención de inyecciones
- Manejo seguro de credenciales
- HTTPS/TLS si aplica
- Rate limiting`,

      documentation: `# Prompt para Generación de Documentación

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Crea documentación técnica completa y profesional basada en el contexto anterior.

### 1. Documentación de Usuario
- **Guía de Inicio Rápido**: Pasos básicos para empezar
- **Manual de Usuario**: Todas las funcionalidades explicadas
- **FAQs**: Preguntas frecuentes y soluciones
- **Troubleshooting**: Problemas comunes y resoluciones

### 2. Documentación Técnica
- **Arquitectura del Sistema**: Diagramas y explicaciones
- **API Reference**: Endpoints, parámetros, respuestas
- **Modelo de Datos**: Esquemas, relaciones, diccionario
- **Guía de Desarrollo**: Setup, convenciones, workflows

### 3. Documentación de Procesos
- **Guía de Instalación**: Requisitos, pasos, verificación
- **Guía de Despliegue**: Ambientes, CI/CD, rollback
- **Guía de Mantenimiento**: Backups, actualizaciones, monitoreo
- **Guía de Seguridad**: Mejores prácticas, auditoría

### 4. Formato y Estructura
Cada sección debe incluir:
- Tabla de contenidos
- Objetivos de aprendizaje
- Prerrequisitos
- Contenido principal
- Ejemplos prácticos
- Resumen
- Enlaces relacionados

### 5. Elementos Visuales
- Diagramas de flujo
- Capturas de pantalla anotadas
- Tablas comparativas
- Infografías de procesos

### Formato de Salida
Genera documentación en formato Markdown incluyendo:
1. README.md principal
2. Guía de contribución (CONTRIBUTING.md)
3. Changelog (CHANGELOG.md)
4. Licencia (LICENSE.md)
5. Wiki structure

### Estilo de Escritura
- Claro y conciso
- Voz activa
- Ejemplos prácticos
- Nivel técnico apropiado
- Actualizable y versionado`,

      analysis: `# Prompt para Análisis y Mejoras

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Realiza un análisis exhaustivo y proporciona recomendaciones de mejora basadas en el contexto anterior.

### 1. Análisis de la Situación Actual
- **Fortalezas**: Aspectos positivos identificados
- **Debilidades**: Áreas de mejora detectadas
- **Oportunidades**: Potencial no aprovechado
- **Amenazas**: Riesgos y desafíos

### 2. Análisis Técnico
- **Performance**: Métricas actuales vs ideales
- **Escalabilidad**: Capacidad de crecimiento
- **Seguridad**: Vulnerabilidades potenciales
- **Mantenibilidad**: Deuda técnica acumulada
- **Usabilidad**: Experiencia de usuario actual

### 3. Análisis de Negocio
- **ROI Potencial**: Retorno de inversión estimado
- **Ventaja Competitiva**: Diferenciadores clave
- **Time to Market**: Optimización de tiempos
- **Costos**: Optimización de recursos

### 4. Recomendaciones Prioritizadas

#### Prioridad Alta (Implementar Inmediatamente)
1. [Lista de mejoras críticas con justificación]
2. Impacto esperado y métricas de éxito
3. Recursos necesarios y timeline

#### Prioridad Media (Próximos 3 meses)
1. [Lista de mejoras importantes]
2. Dependencies y prerrequisitos
3. Plan de implementación

#### Prioridad Baja (Roadmap futuro)
1. [Lista de mejoras nice-to-have]
2. Condiciones para implementación
3. Beneficios a largo plazo

### 5. Plan de Acción
- **Semana 1-2**: Quick wins y configuraciones
- **Mes 1**: Implementaciones prioritarias
- **Mes 2-3**: Optimizaciones y refinamientos
- **Evaluación**: Métricas de éxito y siguiente iteración

### 6. Métricas de Mejora
| Métrica | Estado Actual | Objetivo | Plazo |
|---------|--------------|----------|-------|
| [Define KPIs específicos] | | | |

### Formato de Salida
Proporciona:
1. Resumen ejecutivo (1 página)
2. Análisis detallado con datos
3. Matriz de decisión para prioridades
4. Roadmap de implementación visual
5. Checklist de validación`,

      architecture: `# Prompt para Arquitectura de Sistema

## Contexto del Proyecto
${baseContext}

## Instrucciones para Claude
Diseña una arquitectura de sistema completa, escalable y robusta basada en el contexto anterior.

### 1. Vista de Alto Nivel
- **Arquitectura General**: Microservicios, Monolito, Serverless, etc.
- **Patrones Arquitectónicos**: MVC, MVVM, Event-Driven, CQRS, etc.
- **Principios de Diseño**: SOLID, DRY, KISS, YAGNI
- **Estilo Arquitectónico**: REST, GraphQL, gRPC, WebSockets

### 2. Componentes del Sistema

#### Frontend
- Framework y justificación
- State management
- Routing y navegación
- Component library
- Build y bundling

#### Backend
- Lenguaje y framework
- API Gateway
- Servicios y microservicios
- Message queues
- Caching strategy

#### Base de Datos
- Tipo (SQL/NoSQL) y justificación
- Esquema y modelado
- Índices y optimización
- Backup y recuperación
- Replicación y sharding

#### Infraestructura
- Cloud provider recomendado
- Containerización (Docker/Kubernetes)
- CI/CD pipeline
- Monitoreo y logging
- Escalado automático

### 3. Flujos de Datos
\`\`\`
Usuario -> CDN -> Load Balancer -> API Gateway -> Services -> Database
                                                 -> Cache
                                                 -> Queue -> Workers
\`\`\`

### 4. Seguridad
- **Autenticación**: OAuth2, JWT, SSO
- **Autorización**: RBAC, ABAC
- **Encriptación**: TLS, encriptación en reposo
- **Auditoría**: Logs de acceso y cambios
- **Compliance**: GDPR, HIPAA, PCI-DSS según aplique

### 5. Integraciones
- APIs externas necesarias
- Webhooks y eventos
- Sincronización de datos
- Formatos de intercambio

### 6. Performance y Escalabilidad
- **Caching**: Redis, Memcached, CDN
- **Load Balancing**: Round-robin, least connections
- **Database Optimization**: Índices, particiones, read replicas
- **Async Processing**: Queues, workers, event streaming
- **Auto-scaling**: Horizontal y vertical

### 7. Resiliencia
- **High Availability**: Multi-AZ, failover
- **Disaster Recovery**: RTO/RPO, backups
- **Circuit Breakers**: Manejo de fallos
- **Rate Limiting**: Protección contra abuso
- **Health Checks**: Endpoints de monitoreo

### 8. Consideraciones de Costos
- Estimación mensual por componente
- Optimizaciones para reducir costos
- Escalado basado en demanda
- Reserved instances vs on-demand

### Formato de Salida
Proporciona:
1. Diagrama de arquitectura (ASCII art)
2. Especificaciones técnicas por componente
3. Matriz de tecnologías con pros/contras
4. Estimación de costos de infraestructura
5. Plan de migración si aplica
6. Configuración de ejemplo (docker-compose, k8s manifests)`
    };

    const prompt = templates[type] || '';
    setGeneratedPrompt(prompt);
  };

  const handleGeneratePrompt = () => {
    if (selectedType) {
      generatePromptForType(selectedType);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Generador de Prompts Optimizados
              </h2>
              <p className="text-gray-400 text-sm">
                Selecciona el tipo de prompt que necesitas generar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {!generatedPrompt ? (
            <>
              {/* Contexto opcional */}
              {!transcription && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contexto del proyecto (opcional)
                  </label>
                  <textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Describe tu proyecto o pega la transcripción de tu nota de voz..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    rows={4}
                  />
                </div>
              )}

              {/* Grid de tipos de prompts */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {promptTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedType === type.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-10 rounded-xl`} />
                      <div className="relative">
                        <Icon className={`w-8 h-8 mb-2 ${
                          selectedType === type.id ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                        <h3 className="text-white font-semibold text-sm mb-1">
                          {type.name}
                        </h3>
                        <p className="text-gray-500 text-xs">
                          {type.description}
                        </p>
                      </div>
                      {selectedType === type.id && (
                        <motion.div
                          layoutId="selected"
                          className="absolute inset-0 border-2 border-purple-500 rounded-xl"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Botón de generar */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGeneratePrompt}
                  disabled={!selectedType && !customContext}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    selectedType || customContext
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  Generar Prompt Optimizado
                </motion.button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Área del prompt generado */}
              <div className="bg-gray-800 rounded-xl p-6 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditablePrompt(generatedPrompt);
                      setShowPromptEditor(true);
                    }}
                    className="px-4 py-2 rounded-lg font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </motion.button>
                </div>
                
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono overflow-auto max-h-[60vh] pr-32">
                  {generatedPrompt}
                </pre>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setGeneratedPrompt('');
                    setSelectedType(null);
                  }}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Generar Otro
                </button>
                <button
                  onClick={() => {
                    window.open('https://claude.ai', '_blank');
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Abrir Claude
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal del Editor de Prompt */}
      {showPromptEditor && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] overflow-y-auto"
          onClick={(e) => {
            // Solo cerrar si se hace click en el fondo
            if (e.target === e.currentTarget) {
              setShowPromptEditor(false);
            }
          }}
        >
          <div className="w-full max-w-4xl my-8" onClick={(e) => e.stopPropagation()}>
            <PromptEditor
              initialPrompt={editablePrompt}
              onSave={(editedPrompt) => {
                setGeneratedPrompt(editedPrompt);
                setShowPromptEditor(false);
                setCopied(false);
              }}
              onCancel={() => setShowPromptEditor(false)}
              title="Editar Prompt Generado"
              context={transcription || customContext}
              promptType={selectedType}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PromptGenerator;