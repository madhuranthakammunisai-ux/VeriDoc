import logging
from typing import List, Dict, Any, Tuple
from app.schemas import (
    InvoiceExtraction,
    BankStatementExtraction,
    PurchaseOrderExtraction,
    ValidationResult
)

logger = logging.getLogger("veridoc-worker")

class DocumentValidator:
    @staticmethod
    def validate_invoice(invoice: InvoiceExtraction) -> ValidationResult:
        warnings: List[str] = []
        errors: List[str] = []
        confidence = 0.95

        # 1. Required fields check
        if not invoice.invoice_number:
            warnings.append("Missing invoice number")
            confidence -= 0.15
        if not invoice.invoice_date:
            warnings.append("Missing invoice date")
            confidence -= 0.10
        if not invoice.vendor_name:
            warnings.append("Missing vendor name")
            confidence -= 0.15
        if invoice.total_amount is None:
            errors.append("Missing total invoice amount")
            confidence -= 0.25

        # 2. Line items arithmetic check
        calculated_line_sum = 0.0
        if invoice.line_items:
            for idx, item in enumerate(invoice.line_items):
                expected_line_total = round(item.quantity * item.unit_price, 2)
                actual_line_total = round(item.line_total, 2)
                calculated_line_sum += actual_line_total

                if abs(expected_line_total - actual_line_total) > 0.02 and item.quantity > 0 and item.unit_price > 0:
                    warnings.append(
                        f"Line {idx + 1} ({item.description[:30]}): Quantity ({item.quantity}) * Unit Price ({item.unit_price}) = {expected_line_total}, but line total is {actual_line_total}"
                    )
                    confidence -= 0.05
        else:
            warnings.append("No individual line items were extracted")
            confidence -= 0.10

        # 3. Subtotal reconciliation
        if invoice.subtotal is not None and invoice.line_items:
            subtotal = round(invoice.subtotal, 2)
            calc_subtotal = round(calculated_line_sum, 2)
            if abs(subtotal - calc_subtotal) > 0.05:
                warnings.append(
                    f"Subtotal discrepancy: Extracted subtotal is {subtotal}, but sum of line items is {calc_subtotal}"
                )
                confidence -= 0.10

        # 4. Tax and Grand Total reconciliation
        if invoice.total_amount is not None:
            sub = invoice.subtotal if invoice.subtotal is not None else calculated_line_sum
            tax = invoice.tax_amount if invoice.tax_amount is not None else 0.0
            discount = invoice.discount if invoice.discount is not None else 0.0
            expected_total = round(sub + tax - discount, 2)
            actual_total = round(invoice.total_amount, 2)

            if sub > 0 and abs(expected_total - actual_total) > 0.05:
                warnings.append(
                    f"Total amount reconciliation check: Subtotal ({sub}) + Tax ({tax}) - Discount ({discount}) = {expected_total}, but total is {actual_total}"
                )
                confidence -= 0.10

        confidence = max(0.10, min(1.00, round(confidence, 4)))
        is_valid = len(errors) == 0

        return ValidationResult(
            is_valid=is_valid,
            warnings=warnings,
            errors=errors,
            confidence_score=confidence
        )

    @staticmethod
    def validate_bank_statement(stmt: BankStatementExtraction) -> ValidationResult:
        warnings: List[str] = []
        errors: List[str] = []
        confidence = 0.95

        # 1. Required bank fields
        if not stmt.bank_name:
            warnings.append("Missing bank name")
            confidence -= 0.10
        if not stmt.account_holder:
            warnings.append("Missing account holder name")
            confidence -= 0.10
        if stmt.opening_balance is None:
            warnings.append("Missing opening balance")
            confidence -= 0.10
        if stmt.closing_balance is None:
            errors.append("Missing closing balance")
            confidence -= 0.20

        # Mask account number if unmasked
        if stmt.masked_account_number and not stmt.masked_account_number.startswith("•"):
            clean = stmt.masked_account_number.strip()
            if len(clean) > 4:
                stmt.masked_account_number = "••••" + clean[-4:]

        # 2. Reconcile transactions sum
        sum_credits = 0.0
        sum_debits = 0.0
        seen_txs = set()
        duplicates = []

        for idx, tx in enumerate(stmt.transactions):
            debit = tx.debit_amount or 0.0
            credit = tx.credit_amount or 0.0
            sum_debits += debit
            sum_credits += credit

            # Duplicate transaction detection
            tx_sig = f"{tx.transaction_date}|{round(debit, 2)}|{round(credit, 2)}|{tx.description.strip().lower()}"
            if tx_sig in seen_txs:
                duplicates.append({
                    "date": tx.transaction_date,
                    "description": tx.description,
                    "debit": debit,
                    "credit": credit,
                    "source_page": tx.source_page
                })
            seen_txs.add(tx_sig)

        if duplicates:
            stmt.duplicate_transactions = duplicates
            warnings.append(f"Detected {len(duplicates)} potential duplicate transaction candidate(s)")
            confidence -= 0.05

        # 3. Balance reconciliation check
        if stmt.opening_balance is not None and stmt.closing_balance is not None:
            expected_closing = round(stmt.opening_balance + sum_credits - sum_debits, 2)
            actual_closing = round(stmt.closing_balance, 2)

            if len(stmt.transactions) > 0 and abs(expected_closing - actual_closing) > 0.05:
                warnings.append(
                    f"Statement balance reconciliation discrepancy: Opening ({stmt.opening_balance}) + Credits ({round(sum_credits, 2)}) - Debits ({round(sum_debits, 2)}) = {expected_closing}, but closing balance is {actual_closing}"
                )
                confidence -= 0.15

        confidence = max(0.10, min(1.00, round(confidence, 4)))
        is_valid = len(errors) == 0

        return ValidationResult(
            is_valid=is_valid,
            warnings=warnings,
            errors=errors,
            confidence_score=confidence
        )

    @staticmethod
    def validate_purchase_order(po: PurchaseOrderExtraction) -> ValidationResult:
        warnings: List[str] = []
        errors: List[str] = []
        confidence = 0.95

        if not po.po_number:
            warnings.append("Missing PO number")
            confidence -= 0.15
        if not po.po_date:
            warnings.append("Missing PO date")
            confidence -= 0.10
        if not po.buyer_company:
            warnings.append("Missing buyer company name")
            confidence -= 0.15
        if po.grand_total is None:
            errors.append("Missing PO grand total")
            confidence -= 0.25

        calculated_line_sum = 0.0
        if po.line_items:
            for idx, item in enumerate(po.line_items):
                expected = round(item.quantity * item.unit_price, 2)
                actual = round(item.line_total, 2)
                calculated_line_sum += actual

                if abs(expected - actual) > 0.02 and item.quantity > 0 and item.unit_price > 0:
                    warnings.append(
                        f"Line {idx + 1} ({item.description[:30]}): Quantity ({item.quantity}) * Price ({item.unit_price}) = {expected}, but line total is {actual}"
                    )
                    confidence -= 0.05

        if po.grand_total is not None and po.line_items:
            sub = po.subtotal if po.subtotal is not None else calculated_line_sum
            tax = po.tax or 0.0
            discount = po.discount or 0.0
            expected_grand = round(sub + tax - discount, 2)
            actual_grand = round(po.grand_total, 2)

            if sub > 0 and abs(expected_grand - actual_grand) > 0.05:
                warnings.append(
                    f"Grand total reconciliation: Subtotal ({sub}) + Tax ({tax}) - Discount ({discount}) = {expected_grand}, but grand total is {actual_grand}"
                )
                confidence -= 0.10

        confidence = max(0.10, min(1.00, round(confidence, 4)))
        is_valid = len(errors) == 0

        return ValidationResult(
            is_valid=is_valid,
            warnings=warnings,
            errors=errors,
            confidence_score=confidence
        )

