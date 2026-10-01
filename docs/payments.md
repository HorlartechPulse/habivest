# Payments & rent ledger

## MockPaymentProvider

Development payments succeed server-side without card data.

Flow:

1. Tenant `POST /payments/rent` with `leaseId` + `amount`
2. Backend verifies lease ownership
3. Creates `RentPayment` (SUCCESS) with unique `reference`
4. Appends `RentLedgerEntry` CREDIT
5. Marks due `RentSchedule` as PAID
6. Notifies tenant

## Production path

Swap provider: initialize → provider redirect → webhook → verify amount/currency/reference → same ledger writes. Never trust frontend success alone.

## Disclaimers

- Not a bank or payment institution  
- Mock only in this portfolio seed  
- No card numbers stored  
