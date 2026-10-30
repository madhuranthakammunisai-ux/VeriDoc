from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# ------------------------------------------------------------------------------
# Invoices
# ------------------------------------------------------------------------------
class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    line_total: float = 0.0
    source_page: int = 1

class InvoiceExtraction(BaseModel):
    category: Literal["invoices"] = "invoices"
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    currency: Optional[str] = "USD"
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    discount: Optional[float] = 0.0
    total_amount: Optional[float] = None
    payment_terms: Optional[str] = None
    purchase_order_reference: Optional[str] = None
    line_items: List[InvoiceLineItem] = Field(default_factory=list)
    confidence_score: Optional[float] = None
    notes: Optional[str] = None

# ------------------------------------------------------------------------------
# Bank Statements
# ------------------------------------------------------------------------------
class BankTransaction(BaseModel):
    transaction_date: str
    description: str
    reference_number: Optional[str] = None
    debit_amount: Optional[float] = None
    credit_amount: Optional[float] = None
    running_balance: Optional[float] = None
    source_page: int = 1

class BankStatementExtraction(BaseModel):
    category: Literal["bank_statements"] = "bank_statements"
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    masked_account_number: Optional[str] = None
    account_type: Optional[str] = None
    statement_start_date: Optional[str] = None
    statement_end_date: Optional[str] = None
    currency: Optional[str] = "USD"
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    total_deposits: Optional[float] = None
    total_withdrawals: Optional[float] = None
    total_credits: Optional[float] = None
    total_debits: Optional[float] = None
    transactions: List[BankTransaction] = Field(default_factory=list)
    duplicate_transactions: List[Dict[str, Any]] = Field(default_factory=list)
    anomalies: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None

# ------------------------------------------------------------------------------
# Purchase Orders
# ------------------------------------------------------------------------------
class POLineItem(BaseModel):
    product_code: Optional[str] = None
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    line_total: float = 0.0
    source_page: int = 1

class PurchaseOrderExtraction(BaseModel):
    category: Literal["purchase_orders"] = "purchase_orders"
    po_number: Optional[str] = None
    po_date: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    buyer_company: Optional[str] = None
    buyer_address: Optional[str] = None
    supplier_company: Optional[str] = None
    supplier_address: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    currency: Optional[str] = "USD"
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = 0.0
    grand_total: Optional[float] = None
    line_items: List[POLineItem] = Field(default_factory=list)
    confidence_score: Optional[float] = None

# ------------------------------------------------------------------------------
# Large PDF Documents
# ------------------------------------------------------------------------------
class LargePDFExtraction(BaseModel):
    category: Literal["large_pdf_documents"] = "large_pdf_documents"
    document_summary: str
    important_topics: List[str] = Field(default_factory=list)
    named_entities: Dict[str, List[str]] = Field(default_factory=dict)
    important_dates: List[Dict[str, str]] = Field(default_factory=list)
    key_facts: List[str] = Field(default_factory=list)
    obligations_and_actions: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None

# ------------------------------------------------------------------------------
# Classification & Validation Schemas
# ------------------------------------------------------------------------------
class DocumentClassificationResult(BaseModel):
    category: Literal["invoices", "bank_statements", "purchase_orders", "large_pdf_documents", "unknown"]
    confidence: float
    reasoning: str

class ValidationResult(BaseModel):
    is_valid: bool
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    confidence_score: float

