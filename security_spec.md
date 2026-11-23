# Security Specification & Threat Model

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}` and all subcollections (`settings`, `archives`, `trades`, `patterns`) is strictly owned by `userId == request.auth.uid`. Cross-user reads, lists, writes, or deletes are denied.
2. **Email Verification Mandate**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Strict Shape & Size Bounds**:
   - `DrawArchive.sequence` must match `^[0-9]+$` with length `1..1500` and `drawCount == sequence.size()`.
   - `TradeLog.resultDigit` must be integer `0..9`, `stake > 0`, `stepNumber` `1..20`, and `outcome` in `['win', 'loss']`.
   - `RiskProfile` numeric bounds prevent negative capital/baseBet or invalid strategies.
4. **Immutable Audit Fields**: `createdAt`, `userId`, and `uid` cannot be altered after creation. Timestamps (`createdAt`, `updatedAt`) must equal `request.time`.
5. **No Shadow Fields**: Every `create` validates exact `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` validates `affectedKeys().hasOnly(...)` inside named action branches wrapped by `isValid[Entity]()`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `GET /users/uid1/archives/day1` with `auth: null`.
2. **Unverified Email Write**: `CREATE /users/uid1/archives/day1` with `auth: { uid: 'uid1', token: { email_verified: false } }`.
3. **Cross-User Read**: `GET /users/uid2/trades/t1` while authenticated as `uid1`.
4. **Identity Spoofing on Create**: `CREATE /users/uid1/archives/day1` with `userId: 'uid2'`.
5. **Ghost / Shadow Field Injection**: `CREATE /users/uid1/settings/riskProfile` with extra field `isAdmin: true`.
6. **ID Poisoning**: `CREATE /users/uid1/archives/bad$id!with/slashes` or >128-char document ID.
7. **Sequence Regex / Overflow Attack**: `CREATE /users/uid1/archives/day1` with `sequence: 'abc123'` or 5000-character string.
8. **DrawCount Mismatch**: `CREATE /users/uid1/archives/day1` with `sequence: '123'` and `drawCount: 999`.
9. **Client Timestamp Spoofing**: `CREATE /users/uid1/trades/t1` with `createdAt: Timestamp(2020-01-01)`.
10. **Immutable Ownership Tampering**: `UPDATE /users/uid1/archives/day1` changing `userId` or `createdAt`.
11. **Negative Stake / Invalid Digit Poisoning**: `CREATE /users/uid1/trades/t1` with `stake: -500` or `resultDigit: 42`.
12. **Terminal Trade Mutation**: `UPDATE /users/uid1/trades/t1` trying to alter `netPnl` or `outcome` after trade settlement.
