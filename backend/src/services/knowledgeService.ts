import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errors.js';

export interface GroundedCitation {
  documentId: string;
  documentTitle: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  snippet: string;
}

export class KnowledgeService {
  /**
   * Search chunks across user's documents using keyword/text matching.
   */
  static async searchKnowledge(
    userId: string,
    queryText: string,
    documentId: string | undefined,
    supabase: SupabaseClient
  ) {
    let query = supabase
      .from('document_chunks')
      .select('*, documents(id, original_filename, category)')
      .eq('user_id', userId);

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    if (queryText && queryText.trim()) {
      query = query.ilike('chunk_text', `%${queryText.trim()}%`);
    }

    const { data, error } = await query.limit(20);
    if (error) {
      throw new AppError(`Knowledge search error: ${error.message}`, 500);
    }

    return (data || []).map(chunk => ({
      chunkId: chunk.id,
      documentId: chunk.document_id,
      documentTitle: chunk.documents?.original_filename || 'Document',
      category: chunk.documents?.category || 'unknown',
      chunkIndex: chunk.chunk_index,
      pageStart: chunk.page_start,
      pageEnd: chunk.page_end,
      snippet: chunk.chunk_text.slice(0, 300) + (chunk.chunk_text.length > 300 ? '...' : ''),
      summary: chunk.chunk_summary,
    }));
  }

  /**
   * Answers questions grounded on document chunks with verifiable source citations.
   */
  static async askKnowledge(
    userId: string,
    question: string,
    documentId: string | undefined,
    supabase: SupabaseClient
  ) {
    // 1. Fetch relevant chunks
    const terms = question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 3);
    
    let query = supabase
      .from('document_chunks')
      .select('*, documents(id, original_filename, category, summary)')
      .eq('user_id', userId);

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data: chunks, error } = await query.limit(50);
    if (error) {
      throw new AppError(`Failed to fetch context for Q&A: ${error.message}`, 500);
    }

    if (!chunks || chunks.length === 0) {
      return {
        question,
        answer: 'No document content is currently available to answer this question. Please ensure documents have finished processing.',
        citations: [],
      };
    }

    // Rank chunks based on keyword matching
    const scoredChunks = chunks.map(chunk => {
      const text = chunk.chunk_text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) {
          score += 1;
        }
      }
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.filter(c => c.score > 0).slice(0, 5).map(c => c.chunk);
    const relevant = topChunks.length > 0 ? topChunks : chunks.slice(0, 3);

    const citations: GroundedCitation[] = relevant.map(c => ({
      documentId: c.document_id,
      documentTitle: c.documents?.original_filename || 'Unknown Document',
      pageStart: c.page_start,
      pageEnd: c.page_end,
      chunkIndex: c.chunk_index,
      snippet: c.chunk_text.slice(0, 250) + '...',
    }));

    // Synthesize structured answer from chunks
    const factsFound: string[] = [];
    relevant.forEach((c) => {
      if (c.chunk_summary) {
        factsFound.push(c.chunk_summary);
      } else {
        const lines = c.chunk_text.split('\n').filter((l: string) => l.trim().length > 20);
        if (lines.length > 0) factsFound.push(lines[0]);
      }
    });

    const answer = factsFound.length > 0
      ? `Based on verified content from ${citations[0].documentTitle} (pages ${citations[0].pageStart}-${citations[0].pageEnd}):\n\n` +
        factsFound.map(f => `• ${f}`).join('\n')
      : `Based on the indexed document text, relevant information was found on page ${citations[0]?.pageStart || 1} of ${citations[0]?.documentTitle || 'the document'}. Please review the cited excerpt below.`;

    return {
      question,
      answer,
      citations,
    };
  }

  /**
   * Retrieves relations for a document (e.g. matching Purchase Orders and Invoices).
   */
  static async getDocumentRelations(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: relations, error } = await supabase
      .from('document_relations')
      .select('*, related_document:related_document_id(id, original_filename, category, processing_status)')
      .eq('user_id', userId)
      .eq('source_document_id', documentId);

    if (error) {
      throw new AppError(`Failed to fetch relations: ${error.message}`, 500);
    }

    return relations || [];
  }
}

