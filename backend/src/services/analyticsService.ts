import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errors.js';

export class AnalyticsService {
  static async getDashboardMetrics(userId: string, supabase: SupabaseClient) {
    // 1. Fetch all documents for this user
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, original_filename, category, processing_status, verification_status, confidence_score, uploaded_at, processed_at, file_size_bytes')
      .eq('user_id', userId);

    if (error) {
      throw new AppError(`Failed to fetch dashboard metrics: ${error.message}`, 500);
    }

    const documents = docs || [];

    // Calculate core metrics
    const totalDocuments = documents.length;
    const successfullyProcessed = documents.filter(d => d.processing_status === 'completed').length;
    const processing = documents.filter(d => d.processing_status === 'processing' || d.processing_status === 'queued').length;
    const pendingVerification = documents.filter(d => d.verification_status === 'pending' && d.processing_status === 'completed').length;
    const failedDocuments = documents.filter(d => d.processing_status === 'failed').length;

    // Average processing time in seconds for completed documents
    let totalDurationSeconds = 0;
    let completedWithDatesCount = 0;

    for (const doc of documents) {
      if (doc.processing_status === 'completed' && doc.uploaded_at && doc.processed_at) {
        const uploadTime = new Date(doc.uploaded_at).getTime();
        const finishTime = new Date(doc.processed_at).getTime();
        const duration = (finishTime - uploadTime) / 1000;
        if (duration > 0 && duration < 3600) {
          totalDurationSeconds += duration;
          completedWithDatesCount++;
        }
      }
    }

    const averageProcessingTimeSeconds = completedWithDatesCount > 0 
      ? Number((totalDurationSeconds / completedWithDatesCount).toFixed(1))
      : 0;

    // Average confidence score
    const scoredDocs = documents.filter(d => d.confidence_score !== null);
    const averageConfidence = scoredDocs.length > 0
      ? Number((scoredDocs.reduce((acc, curr) => acc + Number(curr.confidence_score), 0) / scoredDocs.length).toFixed(3))
      : 0;

    // Category Distribution
    const categoryCounts: Record<string, number> = {
      invoices: 0,
      bank_statements: 0,
      purchase_orders: 0,
      large_pdf_documents: 0,
      unknown: 0,
    };

    for (const doc of documents) {
      const cat = doc.category || 'unknown';
      if (cat in categoryCounts) {
        categoryCounts[cat]++;
      } else {
        categoryCounts.unknown++;
      }
    }

    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Status Distribution
    const statusCounts = {
      completed: 0,
      processing: 0,
      queued: 0,
      failed: 0,
    };
    for (const doc of documents) {
      const st = doc.processing_status as keyof typeof statusCounts;
      if (st in statusCounts) {
        statusCounts[st]++;
      }
    }
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Monthly trends (group by YYYY-MM of uploaded_at)
    const monthMap: Record<string, { month: string; uploads: number; completed: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthMap[key] = { month: `${monthName} ${d.getFullYear()}`, uploads: 0, completed: 0 };
    }

    for (const doc of documents) {
      if (doc.uploaded_at) {
        const key = doc.uploaded_at.substring(0, 7);
        if (monthMap[key]) {
          monthMap[key].uploads++;
          if (doc.processing_status === 'completed') {
            monthMap[key].completed++;
          }
        }
      }
    }

    const monthlyTrends = Object.values(monthMap);

    // Recent 5 documents
    const recentDocuments = [...documents]
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, 5);

    // Recent verification activity
    const { data: recentVerifications } = await supabase
      .from('verification_records')
      .select('*, documents(original_filename, category)')
      .eq('user_id', userId)
      .order('reviewed_at', { ascending: false })
      .limit(5);

    return {
      cards: {
        totalDocuments,
        successfullyProcessed,
        processing,
        pendingVerification,
        failedDocuments,
        averageProcessingTimeSeconds,
        averageConfidence,
      },
      categoryDistribution,
      statusDistribution,
      monthlyTrends,
      recentDocuments,
      recentVerifications: recentVerifications || [],
    };
  }
}

