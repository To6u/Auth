# Security Checklist — Auth Project

Security has highest priority.

---

# AUTH FLOW RISKS

- JWT stored in localStorage → XSS exposure
- No refresh token rotation
- No token invalidation strategy
- Account enumeration via check-email
- Password reset flow abuse
- Rate limiting coverage
- Dev routes exposed in production

Always assign severity:
Low / Medium / High / Critical

---

# REQUIRED SECURITY ANALYSIS

For any auth-related change:

1. Does it increase XSS attack surface?
2. Can token be replayed?
3. Can attacker brute force credentials?
4. Is rate limiting sufficient?
5. Can user enumeration occur?
6. Are error messages leaking sensitive info?
7. Are logs leaking secrets?

---

# PASSWORD HANDLING

- Never log passwords
- Ensure bcrypt cost is appropriate
- Prevent timing attacks
- Validate password length server-side

---

# PRODUCTION HARDENING

- Ensure NODE_ENV checks protect dev routes
- Verify Helmet config
- Restrict CORS in production
- Confirm JWT secret strength
- Validate input via Zod only
