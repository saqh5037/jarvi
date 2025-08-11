import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Clock,
  FileText,
  Mic,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Sparkles,
  Hash,
  Play,
  Pause,
  Volume2,
  Download,
  Copy,
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

const VoiceNotesSearch = ({ notes = [], onNoteSelect, currentAudioUrl }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    dateRange: 'all', // all, today, week, month
    categories: [],
    tags: [],
    hasTranscription: null,
    minDuration: null,
    maxDuration: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedResult, setExpandedResult] = useState(null);
  const [searchIndex, setSearchIndex] = useState(null);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    averageResults: 0,
    popularKeywords: []
  });
  const [contextLines, setContextLines] = useState(2); // Líneas de contexto antes/después
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [copiedId, setCopiedId] = useState(null);

  // Construir índice de búsqueda al cargar
  useEffect(() => {
    buildSearchIndex();
  }, [notes]);

  // Construir índice invertido para búsqueda rápida
  const buildSearchIndex = () => {
    const index = {
      words: new Map(), // palabra -> [noteId, position]
      notes: new Map(), // noteId -> note data
      timestamps: new Map() // noteId -> timestamps array
    };

    notes.forEach(note => {
      if (note.transcription) {
        // Almacenar nota completa
        index.notes.set(note.id, {
          ...note,
          lowerTranscription: note.transcription.toLowerCase(),
          words: note.transcription.split(/\s+/)
        });

        // Indexar palabras
        const words = note.transcription.toLowerCase().split(/\s+/);
        words.forEach((word, position) => {
          const cleanWord = word.replace(/[^\w\sáéíóúñ]/gi, '');
          if (cleanWord) {
            if (!index.words.has(cleanWord)) {
              index.words.set(cleanWord, []);
            }
            index.words.get(cleanWord).push({
              noteId: note.id,
              position,
              originalWord: word
            });
          }
        });

        // Extraer timestamps si existen
        const timestampMatches = note.transcription.match(/\[(\d{2}:\d{2})\]/g);
        if (timestampMatches) {
          index.timestamps.set(note.id, timestampMatches.map(ts => ts.slice(1, -1)));
        }
      }
    });

    setSearchIndex(index);
  };

  // Función de búsqueda principal
  const performSearch = useCallback(() => {
    if (!searchQuery.trim() || !searchIndex) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const query = caseSensitive ? searchQuery.trim() : searchQuery.trim().toLowerCase();
    const results = [];

    // Buscar en el índice
    searchIndex.notes.forEach((noteData, noteId) => {
      const matches = [];
      let searchText = caseSensitive ? noteData.transcription : noteData.lowerTranscription;
      
      if (useRegex) {
        // Búsqueda con regex
        try {
          const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
          let match;
          while ((match = regex.exec(noteData.transcription)) !== null) {
            matches.push({
              index: match.index,
              length: match[0].length,
              text: match[0],
              context: extractContext(noteData.transcription, match.index, match[0].length)
            });
          }
        } catch (e) {
          console.error('Invalid regex:', e);
        }
      } else {
        // Búsqueda normal
        let startIndex = 0;
        let index;
        while ((index = searchText.indexOf(query, startIndex)) !== -1) {
          matches.push({
            index,
            length: query.length,
            text: noteData.transcription.substr(index, query.length),
            context: extractContext(noteData.transcription, index, query.length)
          });
          startIndex = index + 1;
        }
      }

      if (matches.length > 0) {
        // Aplicar filtros adicionales
        if (passesFilters(noteData)) {
          results.push({
            note: noteData,
            matches,
            relevanceScore: calculateRelevance(noteData, matches, query)
          });
        }
      }
    });

    // Ordenar por relevancia
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Actualizar estadísticas
    updateSearchStats(query, results.length);

    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, searchIndex, caseSensitive, useRegex, selectedFilters, contextLines]);

  // Extraer contexto alrededor del match
  const extractContext = (text, matchIndex, matchLength) => {
    const lines = text.split('\n');
    let currentPos = 0;
    let matchLine = 0;
    let matchLineStart = 0;

    // Encontrar la línea del match
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (currentPos + lineLength > matchIndex) {
        matchLine = i;
        matchLineStart = currentPos;
        break;
      }
      currentPos += lineLength;
    }

    // Extraer líneas de contexto
    const startLine = Math.max(0, matchLine - contextLines);
    const endLine = Math.min(lines.length - 1, matchLine + contextLines);
    const contextText = lines.slice(startLine, endLine + 1).join('\n');

    // Encontrar timestamp más cercano
    const beforeMatch = text.substring(0, matchIndex);
    const timestampMatches = beforeMatch.match(/\[(\d{2}:\d{2})\]/g);
    const nearestTimestamp = timestampMatches ? timestampMatches[timestampMatches.length - 1] : null;

    return {
      text: contextText,
      lineNumber: matchLine + 1,
      timestamp: nearestTimestamp ? nearestTimestamp.slice(1, -1) : null,
      startLine: startLine + 1,
      endLine: endLine + 1
    };
  };

  // Calcular relevancia del resultado
  const calculateRelevance = (note, matches, query) => {
    let score = 0;
    
    // Número de coincidencias
    score += matches.length * 10;
    
    // Coincidencia en título
    if (note.title && note.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }
    
    // Coincidencia en tags
    if (note.tags) {
      note.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          score += 20;
        }
      });
    }
    
    // Proximidad de las coincidencias
    if (matches.length > 1) {
      const distances = [];
      for (let i = 1; i < matches.length; i++) {
        distances.push(matches[i].index - matches[i-1].index);
      }
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      score += Math.max(0, 100 - avgDistance);
    }
    
    // Fecha reciente
    const daysSinceCreation = (Date.now() - new Date(note.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceCreation);
    
    return score;
  };

  // Verificar si pasa los filtros
  const passesFilters = (note) => {
    const filters = selectedFilters;
    
    // Filtro de rango de fecha
    if (filters.dateRange !== 'all') {
      const noteDate = new Date(note.timestamp);
      const now = new Date();
      const daysDiff = (now - noteDate) / (1000 * 60 * 60 * 24);
      
      if (filters.dateRange === 'today' && daysDiff > 1) return false;
      if (filters.dateRange === 'week' && daysDiff > 7) return false;
      if (filters.dateRange === 'month' && daysDiff > 30) return false;
    }
    
    // Filtro de categorías
    if (filters.categories.length > 0 && !filters.categories.includes(note.category)) {
      return false;
    }
    
    // Filtro de tags
    if (filters.tags.length > 0) {
      const noteTags = note.tags || [];
      if (!filters.tags.some(tag => noteTags.includes(tag))) {
        return false;
      }
    }
    
    // Filtro de transcripción
    if (filters.hasTranscription !== null) {
      if (filters.hasTranscription && !note.transcription) return false;
      if (!filters.hasTranscription && note.transcription) return false;
    }
    
    // Filtro de duración
    if (filters.minDuration && note.duration < filters.minDuration) return false;
    if (filters.maxDuration && note.duration > filters.maxDuration) return false;
    
    return true;
  };

  // Actualizar estadísticas de búsqueda
  const updateSearchStats = (query, resultCount) => {
    const stats = { ...searchStats };
    stats.totalSearches++;
    stats.averageResults = (stats.averageResults * (stats.totalSearches - 1) + resultCount) / stats.totalSearches;
    
    // Actualizar palabras clave populares
    const words = query.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const existing = stats.popularKeywords.find(kw => kw.word === word);
      if (existing) {
        existing.count++;
      } else {
        stats.popularKeywords.push({ word, count: 1 });
      }
    });
    
    // Mantener solo top 10 keywords
    stats.popularKeywords.sort((a, b) => b.count - a.count);
    stats.popularKeywords = stats.popularKeywords.slice(0, 10);
    
    setSearchStats(stats);
    
    // Guardar en localStorage
    localStorage.setItem('jarvi_search_stats', JSON.stringify(stats));
  };

  // Cargar estadísticas al iniciar
  useEffect(() => {
    const savedStats = localStorage.getItem('jarvi_search_stats');
    if (savedStats) {
      setSearchStats(JSON.parse(savedStats));
    }
  }, []);

  // Ejecutar búsqueda cuando cambian los parámetros
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [performSearch]);

  // Obtener clase de resaltado según el color seleccionado
  const getHighlightClass = () => {
    const colors = {
      yellow: 'bg-yellow-200 text-gray-900 px-0.5 rounded font-semibold',
      green: 'bg-green-200 text-gray-900 px-0.5 rounded font-semibold',
      blue: 'bg-blue-200 text-gray-900 px-0.5 rounded font-semibold',
      purple: 'bg-purple-200 text-gray-900 px-0.5 rounded font-semibold',
      pink: 'bg-pink-200 text-gray-900 px-0.5 rounded font-semibold'
    };
    return colors[highlightColor] || colors.yellow;
  };

  // Resaltar texto con matches
  const highlightText = (text, matches) => {
    if (!matches || matches.length === 0) return text;
    
    const parts = [];
    let lastIndex = 0;
    
    // Ordenar matches por posición
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    
    sortedMatches.forEach(match => {
      // Texto antes del match
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          highlighted: false
        });
      }
      
      // Texto del match
      parts.push({
        text: text.substring(match.index, match.index + match.length),
        highlighted: true
      });
      
      lastIndex = match.index + match.length;
    });
    
    // Texto restante
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        highlighted: false
      });
    }
    
    return (
      <span>
        {parts.map((part, index) => (
          <span
            key={index}
            className={part.highlighted ? getHighlightClass() : ''}
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  };

  // Copiar contexto al portapapeles
  const copyContext = (context, noteId) => {
    const textToCopy = `${context.text}\n\n[Timestamp: ${context.timestamp || 'N/A'}] [Lines: ${context.startLine}-${context.endLine}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(noteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Obtener todas las categorías y tags únicos
  const allCategories = useMemo(() => {
    const categories = new Set();
    notes.forEach(note => {
      if (note.category) categories.add(note.category);
    });
    return Array.from(categories);
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [notes]);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header de búsqueda */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Búsqueda en Notas de Voz</h3>
              <p className="text-xs text-gray-500">
                {notes.length} notas • {notes.filter(n => n.transcription).length} transcritas
              </p>
            </div>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Búsquedas totales</p>
              <p className="text-sm font-bold text-gray-900">{searchStats.totalSearches}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Promedio resultados</p>
              <p className="text-sm font-bold text-gray-900">{searchStats.averageResults.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda principal */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en transcripciones..."
            className="w-full pl-12 pr-32 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none placeholder-gray-400"
          />
          
          {/* Opciones de búsqueda */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                caseSensitive 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Sensible a mayúsculas"
            >
              Aa
            </button>
            
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                useRegex 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Usar RegEx"
            >
              .*
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors ${
                showFilters || Object.values(selectedFilters).some(f => f && f.length > 0)
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de fecha */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Rango de fecha</label>
                  <select
                    value={selectedFilters.dateRange}
                    onChange={(e) => setSelectedFilters({...selectedFilters, dateRange: e.target.value})}
                    className="w-full p-2 bg-white text-gray-900 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="all">Todas</option>
                    <option value="today">Hoy</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mes</option>
                  </select>
                </div>

                {/* Filtro de categorías */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Categorías</label>
                  <div className="flex flex-wrap gap-1">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          const cats = selectedFilters.categories.includes(cat)
                            ? selectedFilters.categories.filter(c => c !== cat)
                            : [...selectedFilters.categories, cat];
                          setSelectedFilters({...selectedFilters, categories: cats});
                        }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedFilters.categories.includes(cat)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de tags */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const tags = selectedFilters.tags.includes(tag)
                            ? selectedFilters.tags.filter(t => t !== tag)
                            : [...selectedFilters.tags, tag];
                          setSelectedFilters({...selectedFilters, tags});
                        }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedFilters.tags.includes(tag)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Líneas de contexto:</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={contextLines}
                      onChange={(e) => setContextLines(parseInt(e.target.value) || 2)}
                      className="w-12 px-2 py-1 bg-white text-gray-900 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Color resaltado:</span>
                    <select
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      className="px-2 py-1 bg-white text-gray-900 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="yellow">Amarillo</option>
                      <option value="green">Verde</option>
                      <option value="blue">Azul</option>
                      <option value="purple">Morado</option>
                      <option value="pink">Rosa</option>
                    </select>
                  </label>
                </div>

                <button
                  onClick={() => setSelectedFilters({
                    dateRange: 'all',
                    categories: [],
                    tags: [],
                    hasTranscription: null,
                    minDuration: null,
                    maxDuration: null
                  })}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Palabras clave populares */}
      {searchStats.popularKeywords.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Búsquedas frecuentes:</p>
          <div className="flex flex-wrap gap-2">
            {searchStats.popularKeywords.slice(0, 5).map(kw => (
              <button
                key={kw.word}
                onClick={() => setSearchQuery(kw.word)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
              >
                {kw.word} ({kw.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado de búsqueda */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <span className="text-gray-600">Buscando...</span>
          </div>
        </div>
      )}

      {/* Resultados de búsqueda */}
      {!isSearching && searchQuery && (
        <div className="space-y-4">
          {/* Resumen de resultados */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              {searchResults.length === 0 ? (
                <span className="text-gray-500">No se encontraron resultados</span>
              ) : (
                <>
                  <span className="font-bold text-white">{searchResults.length}</span> resultado{searchResults.length !== 1 && 's'} 
                  {' '}para "<span className="text-purple-400">{searchQuery}</span>"
                </>
              )}
            </p>
            
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">
                  {searchResults.reduce((sum, r) => sum + r.matches.length, 0)} coincidencias totales
                </span>
              </div>
            )}
          </div>

          {/* Lista de resultados */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((result, index) => (
              <motion.div
                key={result.note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500/50 transition-all hover:shadow-md"
              >
                {/* Header del resultado */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedResult(expandedResult === result.note.id ? null : result.note.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-medium text-white">
                          {result.note.title || `Nota del ${new Date(result.note.timestamp).toLocaleDateString()}`}
                        </h4>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {result.matches.length} coincidencia{result.matches.length !== 1 && 's'}
                        </span>
                      </div>
                      
                      {/* Preview del primer match */}
                      <div className="text-xs text-gray-400 mb-2">
                        {result.matches[0].context.timestamp && (
                          <span className="inline-flex items-center gap-1 mr-3">
                            <Clock className="w-3 h-3" />
                            {result.matches[0].context.timestamp}
                          </span>
                        )}
                        <span>Líneas {result.matches[0].context.startLine}-{result.matches[0].context.endLine}</span>
                      </div>
                      
                      <div className="p-2 bg-gray-100 rounded text-xs text-gray-700 font-mono border border-gray-200">
                        {highlightText(result.matches[0].context.text, [{
                          index: result.matches[0].context.text.toLowerCase().indexOf(searchQuery.toLowerCase()),
                          length: searchQuery.length
                        }])}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNoteSelect && onNoteSelect(result.note);
                        }}
                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors"
                        title="Abrir nota"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {expandedResult === result.note.id ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                  
                  {/* Tags y metadata */}
                  <div className="flex items-center gap-2 mt-3">
                    {result.note.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {result.note.category}
                      </span>
                    )}
                    {result.note.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                    <span className="text-xs text-gray-500 ml-auto">
                      Relevancia: {result.relevanceScore.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Resultados expandidos */}
                <AnimatePresence>
                  {expandedResult === result.note.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-700"
                    >
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        <p className="text-xs text-gray-600 mb-2">
                          Todas las coincidencias ({result.matches.length}):
                        </p>
                        
                        {result.matches.map((match, matchIndex) => (
                          <div key={matchIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                {match.context.timestamp && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {match.context.timestamp}
                                  </span>
                                )}
                                <span>Líneas {match.context.startLine}-{match.context.endLine}</span>
                              </div>
                              
                              <button
                                onClick={() => copyContext(match.context, result.note.id)}
                                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Copiar contexto"
                              >
                                {copiedId === result.note.id ? 
                                  <CheckCircle className="w-4 h-4 text-green-400" /> : 
                                  <Copy className="w-4 h-4" />
                                }
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-700 font-mono">
                              {highlightText(match.context.text, [{
                                index: match.context.text.toLowerCase().indexOf(searchQuery.toLowerCase()),
                                length: searchQuery.length
                              }])}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay búsqueda */}
      {!searchQuery && !isSearching && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Comienza a escribir para buscar</p>
          <p className="text-xs text-gray-500">
            Puedes usar expresiones regulares y filtros avanzados
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceNotesSearch;