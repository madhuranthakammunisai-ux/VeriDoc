import unittest
from app.schemas import (
    InvoiceExtraction,
    InvoiceLineItem,
    BankStatementExtraction,
    BankTransaction,
    PurchaseOrderExtraction,
    POLineItem
)
from app.validation import DocumentValidator

class TestDocumentValidation(unittest.TestCase):
    def test_invoice_validation_valid(self):
        invoice = InvoiceExtraction(
            invoice_number="INV-2026-001",
            invoice_date="2026-10-15",
            vendor_name="Acme Corp",
            subtotal=100.0,
            tax_amount=10.0,
            discount=0.0,
            total_amount=110.0,
            line_items=[
                InvoiceLineItem(description="Widget A", quantity=2.0, unit_price=25.0, line_total=50.0, source_page=1),
                InvoiceLineItem(description="Widget B", quantity=1.0, unit_price=50.0, line_total=50.0, source_page=1),
            ]
        )

        result = DocumentValidator.validate_invoice(invoice)
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)
        self.assertGreaterEqual(result.confidence_score, 0.90)

    def test_invoice_validation_line_discrepancy(self):
        invoice = InvoiceExtraction(
            invoice_number="INV-2026-002",
            invoice_date="2026-10-15",
            vendor_name="Acme Corp",
            subtotal=100.0,
            tax_amount=10.0,
            total_amount=110.0,
            line_items=[
                InvoiceLineItem(description="Widget A", quantity=2.0, unit_price=25.0, line_total=99.0, source_page=1)
            ]
        )

        result = DocumentValidator.validate_invoice(invoice)
        self.assertTrue(any("Quantity" in w for w in result.warnings))
        self.assertLess(result.confidence_score, 0.95)

    def test_bank_statement_duplicate_detection_and_balance(self):
        stmt = BankStatementExtraction(
            bank_name="Global Bank",
            account_holder="John Doe",
            masked_account_number="1234567890",
            opening_balance=1000.0,
            closing_balance=1400.0,
            transactions=[
                BankTransaction(transaction_date="2026-10-01", description="Payroll", credit_amount=500.0, source_page=1),
                BankTransaction(transaction_date="2026-10-02", description="Coffee", debit_amount=100.0, source_page=1),
                BankTransaction(transaction_date="2026-10-02", description="Coffee", debit_amount=100.0, source_page=1),
            ]
        )

        result = DocumentValidator.validate_bank_statement(stmt)
        self.assertTrue(stmt.masked_account_number.startswith("••••"))
        self.assertEqual(len(stmt.duplicate_transactions), 1)
        self.assertTrue(any("duplicate" in w for w in result.warnings))

    def test_purchase_order_validation(self):
        po = PurchaseOrderExtraction(
            po_number="PO-999",
            po_date="2026-10-20",
            buyer_company="Tech Logistics",
            subtotal=200.0,
            tax=20.0,
            discount=0.0,
            grand_total=220.0,
            line_items=[
                POLineItem(product_code="ITEM-1", description="Server Rack", quantity=1.0, unit_price=200.0, line_total=200.0, source_page=1)
            ]
        )

        result = DocumentValidator.validate_purchase_order(po)
        self.assertTrue(result.is_valid)
        self.assertGreaterEqual(result.confidence_score, 0.90)

if __name__ == "__main__":
    unittest.main()
