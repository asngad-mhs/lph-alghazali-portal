# Security Specification for LPH Al-Ghazali Portal

## Data Invariants
1. Users must have a valid role: 'pu', 'admin', 'auditor', 'editor', or 'staf'.
2. Only authorized staff (admin, auditor, editor, staf) can modify system settings and news.
3. Pelaku Usaha (PU) can only read and manage their own applications.
4. Applications (Pengajuan Halal) must be linked to a valid User ID.
5. Critical updates to status can only be performed by staff.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: PU tries to create a user doc with role 'admin'.
2. **State Shortcutting**: PU tries to update their own application status to 'Selesai'.
3. **Ghost Field Injection**: Adding `isVerified: true` to a user profile.
4. **Orphaned Application**: Creating a 'pengajuan_halal' with a `userId` that doesn't match the auth UID.
5. **Unauthorized Settings Update**: PU tries to change the contact WhatsApp number in `system_settings`.
6. **Immutable Field Tamper**: PU tries to change their `createdAt` date.
7. **Bypass Role Check**: User with role 'pu' trying to delete another user's application.
8. **Malicious ID**: Trying to read a document with a 1MB string as the ID.
9. **Unverified Admin**: Sign in as `admin@lphalghazali.com` but without email verification.
10. **Shadow News Update**: PU tries to edit a news article's content.
11. **Resource Poisoning**: Uploading a 5MB string into the `name` field of a user profile.
12. **Relational Sync Break**: Creating an application for a non-existent company/context if required.

## Test Runner (Draft)
A `firestore.rules.test.ts` file will be prepared to verify these cases.
