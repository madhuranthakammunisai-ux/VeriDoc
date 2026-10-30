import React, { useState } from 'react';
import { useKnowledge } from '../hooks/useKnowledge';
import { 
  Search, 
  Send, 
  BookOpen, 
  MessageSquareQuote, 
  ExternalLink, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KnowledgePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults, currentAnswer, searching, asking, error, search, ask } = useKnowledge();
  const navigate = useNavigate();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      ask(query);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Knowledge Discovery</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ask questions or full-text search across all chunked documents with verifiable source citations
        </p>
      </div>

      {/* Grounded Natural Language Q&A Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Natural-Language Grounded Q&A</h2>
        </div>

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Which vendor provided the server hardware in October and what was the invoice total?"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={asking || !query.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask VeriDoc</span>
          </button>
        </form>

        {currentAnswer && (
          <div className="mt-4 p-5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400">Answer</span>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {currentAnswer.answer}
              </p>
            </div>

            {/* Citations */}
            {currentAnswer.citations && currentAnswer.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Verified Page Citations
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentAnswer.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/documents/${cite.documentId}`)}
                      className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between text-indigo-400 font-semibold mb-1">
                        <span className="truncate max-w-[200px]">{cite.documentTitle}</span>
                        <span className="text-[10px]">Pages {cite.pageStart}-{cite.pageEnd}</span>
                      </div>
                      <p className="text-slate-400 italic text-[11px]">"{cite.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Semantic / Keyword Full-Text Search across Chunks */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 text-slate-300">
          <Search className="w-4 h-4 text-indigo-400" />
          <span>Full-Text Chunk Search</span>
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw paragraphs, statements, or serial numbers..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="space-y-3 pt-2">
          {searchResults.map((res) => (
            <div
              key={res.chunkId}
              onClick={() => navigate(`/documents/${res.documentId}`)}
              className="p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg cursor-pointer text-xs transition-colors"
            >
              <div className="flex justify-between items-center text-indigo-400 font-semibold mb-1">
                <span>{res.documentTitle} (Pages {res.pageStart} - {res.pageEnd})</span>
                <span className="text-[10px] text-slate-500 uppercase">{res.category}</span>
              </div>
              <p className="text-slate-300">{res.snippet}</p>
            </div>
          ))}
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-xs text-slate-500 py-3 text-center">No matching text chunks found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

