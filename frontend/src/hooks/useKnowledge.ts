import { useState } from 'react';
import { api } from '../services/api';
import { KnowledgeAnswer } from '../types';

export function useKnowledge(documentId?: string) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<KnowledgeAnswer | null>(null);
  const [searching, setSearching] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (queryText: string) => {
    try {
      setSearching(true);
      setError(null);
      const data = await api.knowledge.search(queryText, documentId);
      setSearchResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const ask = async (question: string) => {
    try {
      setAsking(true);
      setError(null);
      const answer = await api.knowledge.ask(question, documentId);
      setCurrentAnswer(answer);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to answer question');
    } finally {
      setAsking(false);
    }
  };

  return {
    searchResults,
    currentAnswer,
    searching,
    asking,
    error,
    search,
    ask,
  };
}

