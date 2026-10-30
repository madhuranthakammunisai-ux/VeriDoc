import React, { useState } from 'react';
import { DocumentDetail } from '../../types';
import { EditableField } from './EditableField';
import { 
  FileText, 
  Receipt, 
  Building2, 
  Calendar, 
  DollarSign, 
  ListChecks, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  Save 
} from 'lucide-react';
import { api } from '../../services/api';

interface ExtractedDataViewerProps {
  document: DocumentDetail;
  isVerificationMode?: boolean;
  onSaved?: () => void;
}

export const ExtractedDataViewer: React.FC<ExtractedDataViewerProps> = ({
  document,
  isVerificationMode = false,
  onSaved,
}) => {
  const initialData = document.verification?.corrected_data && Object.keys(document.verification.corrected_data).length > 0
    ? document.verification.corrected_data
    : document.extraction?.extracted_data || {};

  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [reviewerNotes, setReviewerNotes] = useState<string>(document.verification?.reviewer_notes || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const category = document.category;

  const handleFieldChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveCorrections = async () => {
    try {
      setSaving(true);
      await api.verification.update(document.id, {
        corrected_data: formData,
        reviewer_notes: reviewerNotes,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      alert('Failed to save corrections');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white capitalize">
            {category.replace('_', ' ')} Extraction Data
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model: <span className="font-mono text-indigo-400">{document.extraction?.model_name || 'Gemini 2.5'}</span> • Schema v{document.extraction?.schema_version || '1.0'}
          </p>
        </div>

        {isVerificationMode && (
          <button
            onClick={handleSaveCorrections}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {saving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Human Edits</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Category: INVOICES */}
      {category === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <EditableField
              label="Invoice Number"
              value={formData.invoice_number}
              onChange={(v) => handleFieldChange('invoice_number', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="Invoice Date"
              type="date"
              value={formData.invoice_date}
              onChange={(v) => handleFieldChange('invoice_date', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(v) => handleFieldChange('due_date', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="PO Reference"
              value={formData.purchase_order_reference}
              onChange={(v) => handleFieldChange('purchase_order_reference', v)}
              disabled={!isVerificationMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Vendor Details
              </h4>
              <EditableField
                label="Vendor Name"
                value={formData.vendor_name}
                onChange={(v) => handleFieldChange('vendor_name', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Vendor Address"
                value={formData.vendor_address}
                onChange={(v) => handleFieldChange('vendor_address', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Vendor Tax ID / VAT"
                value={formData.vendor_tax_id}
                onChange={(v) => handleFieldChange('vendor_tax_id', v)}
                disabled={!isVerificationMode}
              />
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Customer Details
              </h4>
              <EditableField
                label="Customer Name"
                value={formData.customer_name}
                onChange={(v) => handleFieldChange('customer_name', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Customer Address"
                value={formData.customer_address}
                onChange={(v) => handleFieldChange('customer_address', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Payment Terms"
                value={formData.payment_terms}
                onChange={(v) => handleFieldChange('payment_terms', v)}
                disabled={!isVerificationMode}
              />
            </div>
          </div>

          {/* Line items table */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
              <ListChecks className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Invoice Line Items
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/40 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Line Total</th>
                    <th className="py-2.5 px-3">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {document.line_items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-200">{item.description}</td>
                      <td className="py-2 px-3 text-slate-400">{item.quantity}</td>
                      <td className="py-2 px-3 text-slate-400">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">${Number(item.line_total).toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-500">P.{item.source_page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Totals */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-200">${Number(formData.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax Amount:</span>
                  <span className="font-semibold text-slate-200">${Number(formData.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount:</span>
                  <span className="font-semibold text-slate-200">${Number(formData.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400">${Number(formData.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category: BANK STATEMENTS */}
      {category === 'bank_statements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <EditableField
              label="Bank Name"
              value={formData.bank_name}
              onChange={(v) => handleFieldChange('bank_name', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="Account Holder"
              value={formData.account_holder}
              onChange={(v) => handleFieldChange('account_holder', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="Masked Account #"
              value={formData.masked_account_number}
              onChange={(v) => handleFieldChange('masked_account_number', v)}
              disabled={true}
            />
            <EditableField
              label="Account Type"
              value={formData.account_type || 'Checking / Savings'}
              onChange={(v) => handleFieldChange('account_type', v)}
              disabled={!isVerificationMode}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Opening Balance</span>
              <p className="text-base font-bold text-white mt-1">${Number(formData.opening_balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Deposits</span>
              <p className="text-base font-bold text-emerald-400 mt-1">${Number(formData.total_deposits || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Withdrawals</span>
              <p className="text-base font-bold text-rose-400 mt-1">${Number(formData.total_withdrawals || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Closing Balance</span>
              <p className="text-base font-bold text-white mt-1">${Number(formData.closing_balance || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Normalized Transactions ({document.transactions?.length || 0})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/40 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Debit (-)</th>
                    <th className="py-2.5 px-3">Credit (+)</th>
                    <th className="py-2.5 px-3">Balance</th>
                    <th className="py-2.5 px-3">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {document.transactions?.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-300 font-mono">{tx.transaction_date}</td>
                      <td className="py-2 px-3 text-slate-200">{tx.description}</td>
                      <td className="py-2 px-3 text-rose-400 font-medium">
                        {tx.debit_amount ? `-$${Number(tx.debit_amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-medium">
                        {tx.credit_amount ? `+$${Number(tx.credit_amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {tx.running_balance ? `$${Number(tx.running_balance).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">P.{tx.source_page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category: PURCHASE ORDERS */}
      {category === 'purchase_orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <EditableField
              label="PO Number"
              value={formData.po_number}
              onChange={(v) => handleFieldChange('po_number', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="PO Date"
              type="date"
              value={formData.po_date}
              onChange={(v) => handleFieldChange('po_date', v)}
              disabled={!isVerificationMode}
            />
            <EditableField
              label="Expected Delivery"
              type="date"
              value={formData.expected_delivery_date}
              onChange={(v) => handleFieldChange('expected_delivery_date', v)}
              disabled={!isVerificationMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Buyer Company</h4>
              <EditableField
                label="Buyer Company"
                value={formData.buyer_company}
                onChange={(v) => handleFieldChange('buyer_company', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Shipping Address"
                value={formData.shipping_address}
                onChange={(v) => handleFieldChange('shipping_address', v)}
                disabled={!isVerificationMode}
              />
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Supplier Company</h4>
              <EditableField
                label="Supplier Company"
                value={formData.supplier_company}
                onChange={(v) => handleFieldChange('supplier_company', v)}
                disabled={!isVerificationMode}
              />
              <EditableField
                label="Supplier Address"
                value={formData.supplier_address}
                onChange={(v) => handleFieldChange('supplier_address', v)}
                disabled={!isVerificationMode}
              />
            </div>
          </div>

          {/* Grand total summary */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-300">Grand Total Amount</span>
            <span className="text-xl font-bold text-emerald-400">${Number(formData.grand_total || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Category: LARGE PDF DOCUMENTS / UNKNOWN */}
      {(category === 'large_pdf_documents' || category === 'unknown') && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Executive AI Summary</h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {document.summary || formData.document_summary || 'No summary available.'}
            </p>
          </div>

          {document.chunks && document.chunks.length > 0 && (
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Indexed Page Chunks ({document.chunks.length})
              </h4>
              <div className="space-y-3">
                {document.chunks.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-400">
                        Chunk #{c.chunk_index + 1} (Pages {c.page_start}-{c.page_end})
                      </span>
                      <span className="text-[10px]">{c.token_count} est. tokens</span>
                    </div>
                    <p className="text-slate-300">{c.chunk_summary || c.chunk_text?.slice(0, 200) || 'Indexed paragraph chunk.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviewer Notes in Verification Mode */}
      {isVerificationMode && (
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Reviewer Verification Notes
          </label>
          <textarea
            rows={3}
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder="Add internal verification notes, audit justifications, or discrepancies..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
};
