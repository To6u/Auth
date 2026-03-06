# Auth Project - Server Side Context

## Overview

Express.js REST API with JWT authentication, SQLite database, and comprehensive security middleware.

**Tech Stack:**
- Node.js + Express 5.2
- TypeScript 5.9
- SQLite (better-sqlite3)
- JWT authentication
- bcryptjs (password hashing)
- Zod (validation)
- Winston (logging)

**Server Port:** `3001`
**API Base:** `/api`

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                         # Express app & server startup
│   ├── db.ts                            # SQLite database initialization
│   │
│   ├── routes/                          # API route handlers
│   │   ├── auth.routes.ts               # Auth endpoints (register, login, reset)
│   │   └── user.routes.ts               # User endpoints (profile, update, delete)
│   │
│   ├── middleware/                      # Express middleware
│   │   ├── auth.middleware.ts           # JWT verification
│   │   ├── error.middleware.ts          # Error handling
│   │   └── validation.middleware.ts     # Request validation (Zod)
│   │
│   ├── config/                          # Configuration
│   │   └── rate-limit.config.ts         # Rate limiting rules
│   │
│   ├── validation/                      # Validation schemas
│   │   └── auth.validation.ts           # Zod schemas for auth
│   │
│   ├── utils/                           # Utilities
│   │   └── logger.ts                    # Winston logger setup
│   │
│   └── dev-routes.ts                    # Dev-only debug routes
│
├── logs/                                # Log files (gitignored)
│   ├── error.log                        # Error logs only
│   └── combined.log                     # All logs
│
├── tsconfig.json                        # TypeScript config
├── .env                                 # Environment variables
└── package.json
```

---

## Database

**SQLite Database:** `auth.db` (in project root)

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Initialization:** `src/db.ts`

```typescript
import Database from 'better-sqlite3'

const db = new Database(process.env.DB_PATH || './auth.db')

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export default db
```

**Query Examples:**
```typescript
// Insert user
const insert = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
insert.run(email, hashedPassword)

// Find by email
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// Update password
db.prepare('UPDATE users SET password = ? WHERE email = ?')
  .run(newHashedPassword, email)

// Delete user
db.prepare('DELETE FROM users WHERE id = ?').run(userId)
```

**Note:** better-sqlite3 is **synchronous**, no async/await needed for queries.

---

## API Endpoints

### Authentication Routes

**File:** `src/routes/auth.routes.ts`

#### POST `/api/auth/register`

Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- Email: valid format, min 1 char
- Password: 6-100 characters

**Process:**
1. Validate request body with Zod
2. Check if email already exists
3. Hash password with bcrypt (12 rounds)
4. Insert user into database
5. Return success message

**Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Errors:**
- 400: Validation error
- 409: Email already exists
- 500: Server error

---

#### POST `/api/auth/login`

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Process:**
1. Validate credentials
2. Find user by email
3. Compare password with bcrypt
4. Generate JWT token (24h expiry)
5. Return token and user data

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Invalid credentials
- 500: Server error

**JWT Payload:**
```typescript
{
  userId: number
  email: string
  iat: number      // issued at
  exp: number      // expiry (24h)
}
```

---

#### POST `/api/auth/check-email`

Check if email exists (for password reset).

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "emailExists": true
}
```

**Errors:**
- 400: Email required
- 500: Server error

---

#### POST `/api/auth/reset-password`

Reset user password.

**Request:**
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123"
}
```

**Validation:**
- Email: valid format
- New password: min 6 characters

**Process:**
1. Validate request
2. Check if user exists
3. Hash new password
4. Update database
5. Return success

**Response (200):**
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

**Errors:**
- 400: Validation error
- 404: User not found
- 500: Server error

---

### User Routes

**File:** `src/routes/user.routes.ts`

All user routes require authentication (Bearer token).

#### GET `/api/user/profile`

Get authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Errors:**
- 401: No token / invalid token
- 404: User not found
- 500: Server error

---

#### PUT `/api/user/profile`

Update user email.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "email": "newemail@example.com"
}
```

**Validation:**
- Email: valid format

**Process:**
1. Verify JWT token
2. Validate new email
3. Check if new email already exists
4. Update database
5. Return updated email

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "email": "newemail@example.com"
}
```

**Errors:**
- 400: Validation error
- 401: Unauthorized
- 409: Email already in use
- 500: Server error

---

#### DELETE `/api/user/account`

Delete user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Process:**
1. Verify JWT token
2. Delete user from database
3. Return success message

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Errors:**
- 401: Unauthorized
- 500: Server error

---

## Middleware

### Authentication Middleware

**File:** `src/middleware/auth.middleware.ts`

#### `authenticate` Middleware

Verifies JWT token and adds user data to request.

**Process:**
1. Extract token from Authorization header: `Bearer <token>`
2. Verify token with JWT_SECRET
3. Decode payload: `{ userId, email }`
4. Attach to request: `req.user = { userId, email }`
5. Call `next()`

**Usage:**
```typescript
router.get('/profile', authenticate, (req: AuthRequest, res) => {
  const { userId, email } = req.user
  // ... fetch user data
})
```

**Extended Request Type:**
```typescript
export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
  }
}
```

**Error Responses:**
- 401: "Authorization header required"
- 401: "Invalid authorization format"
- 401: "Invalid or expired token"

---

#### `optionalAuth` Middleware

Same as authenticate but doesn't block request if no token.

**Usage:**
```typescript
router.get('/public-data', optionalAuth, (req: AuthRequest, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // Anonymous user
  }
})
```

---

### Error Middleware

**File:** `src/middleware/error.middleware.ts`

#### `errorHandler`

Catches all errors thrown in route handlers.

**Process:**
1. Log error with Winston
2. Return JSON error response
3. Include stack trace in development only

**Response (500):**
```json
{
  "error": "Internal server error",
  "stack": "Error: ...\n  at ..." // dev only
}
```

**Usage:**
```typescript
// Must be LAST middleware in chain
app.use(errorHandler)
```

---

#### `notFoundHandler`

Handles 404 for undefined routes.

**Response (404):**
```json
{
  "error": "Route not found",
  "path": "/invalid/path",
  "method": "GET"
}
```

**Usage:**
```typescript
// Add BEFORE errorHandler
app.use(notFoundHandler)
app.use(errorHandler)
```

---

### Validation Middleware

**File:** `src/validation/auth.validation.ts`

Uses **Zod** for schema validation.

#### Zod Schemas

```typescript
const registerSchema = z.object({
  body: z.object({
    email: z.string().email().min(1),
    password: z.string().min(6).max(100)
  })
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().min(1),
    password: z.string().min(1)
  })
})
```

#### `validateRequest` Factory

Creates validation middleware from Zod schema.

**Usage:**
```typescript
router.post(
  '/register',
  validateRequest(registerSchema),
  async (req, res) => {
    // req.body is validated and typed
    const { email, password } = req.body
  }
)
```

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["body", "email"],
      "message": "Invalid email"
    }
  ]
}
```

---

## Configuration

### Rate Limiting

**File:** `src/config/rate-limit.config.ts`

Uses `express-rate-limit` package.

#### Auth Limiter

Applied to all `/api/auth/*` routes.

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,        // 15 minutes
  max: 9999999,                     // essentially unlimited (for dev)
  message: 'Too many authentication attempts...',
  standardHeaders: true,            // Return rate limit info in headers
  legacyHeaders: false
})
```

**Headers:**
```
X-RateLimit-Limit: 9999999
X-RateLimit-Remaining: 9999998
X-RateLimit-Reset: 1640000000000
```

#### API Limiter

Applied to all `/api/*` routes.

```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,        // 15 minutes
  max: 100,                         // 100 requests per window
  message: 'Too many requests from this IP...'
})
```

**Usage:**
```typescript
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api', apiLimiter)
```

---

### Logging

**File:** `src/utils/logger.ts`

Uses **Winston** for structured logging.

**Configuration:**
```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // All logs
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
})
```

**Development Console:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}
```

**Usage:**
```typescript
import { logger } from './utils/logger'

logger.info('User registered', { email, userId })
logger.warn('Failed login attempt', { email })
logger.error('Database error', { error: err.message })
```

**Log Levels:**
- `error` - Errors only
- `warn` - Warnings + errors
- `info` - Info + warnings + errors (default)
- `debug` - Debug + all above

---

## Security Features

### Password Hashing

**Library:** bcryptjs

**Registration:**
```typescript
import bcrypt from 'bcryptjs'

const hashedPassword = await bcrypt.hash(password, 12)
// Rounds: 12 (good balance of security & performance)
```

**Login:**
```typescript
const isValid = await bcrypt.compare(password, user.password)
if (!isValid) {
  return res.status(401).json({ error: 'Invalid credentials' })
}
```

**Security:**
- Salted hashes (unique per password)
- Slow algorithm (prevents brute force)
- Never store plain-text passwords

---

### JWT Tokens

**Library:** jsonwebtoken

**Creation:**
```typescript
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET || 'fallback-secret',
  { expiresIn: '24h' }
)
```

**Verification:**
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
  userId: number
  email: string
}
```

**Expiry:**
- 24 hours from issue
- Client must re-login after expiry
- No refresh token (stateless auth)

---

### CORS

**Library:** cors

**Configuration:**
```typescript
import cors from 'cors'

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'  // Production domain
    : '*',                        // Development: allow all
  credentials: true
}

app.use(cors(corsOptions))
```

---

### Helmet

**Library:** helmet

Sets security HTTP headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)

**Usage:**
```typescript
import helmet from 'helmet'

app.use(helmet())
```

---

### SQL Injection Prevention

**better-sqlite3** uses prepared statements:

```typescript
// SAFE: parameterized query
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// UNSAFE: string concatenation (DON'T DO THIS)
const user = db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get()
```

**Always use `?` placeholders.**

---

## Development Routes

**File:** `src/dev-routes.ts`

**⚠️ Only enabled in development mode!**

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes)
}
```

### GET `/api/dev/users`

Get all users (without passwords).

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### GET `/api/dev/users/count`

Get total user count.

**Response:**
```json
{
  "count": 42
}
```

---

### DELETE `/api/dev/users/:email`

Delete specific user by email.

**Request:**
```
DELETE /api/dev/users/user@example.com
```

**Response:**
```json
{
  "message": "User deleted",
  "email": "user@example.com"
}
```

---

### DELETE `/api/dev/users`

Delete ALL users (dangerous!).

**Response:**
```json
{
  "message": "All users deleted",
  "count": 42
}
```

---

## Server Startup

**File:** `src/index.ts`

**Initialization Order:**
1. Load environment variables (`dotenv`)
2. Security headers (`helmet`)
3. JSON body parser (`express.json()`, 10kb limit)
4. CORS setup
5. Request logging (Morgan-style)
6. Rate limiting
7. Health check endpoint
8. Development routes (if dev)
9. Auth routes
10. User routes
11. 404 handler
12. Error handler

**Server Start:**
```typescript
const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})
```

**Graceful Shutdown:**
```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...')
  server.close(() => {
    logger.info('Server closed')
    db.close()
    process.exit(0)
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)  // 10s timeout
})
```

**Health Check:**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

**Request Logging:**
```typescript
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  })
  next()
})
```

---

## Environment Variables

**File:** `.env` (in project root)

```env
# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-abc123xyz789

# Logging
LOG_LEVEL=info

# Database
DB_PATH=./auth.db

# Frontend (for reference)
VITE_API_URL=http://localhost:3001/api
```

**Loading:**
```typescript
import dotenv from 'dotenv'
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
```

**Security:**
- Never commit `.env` to git
- Use different secrets in production
- Store production secrets in secure vault

---

## TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Build:**
```bash
npm run build
# Compiles to dist/
```

**Dev Mode:**
```bash
npm run dev
# Uses tsx for hot reload
```

---

## Error Handling Patterns

### Route-Level Errors

**Async/Await with Try-Catch:**
```typescript
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    // ... validation

    const hashedPassword = await bcrypt.hash(password, 12)
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
      .run(email, hashedPassword)

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})
```

### Validation Errors

**Zod Validation:**
```typescript
try {
  const validatedData = registerSchema.parse(req.body)
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    })
  }
}
```

### Database Errors

**SQLite Constraints:**
```typescript
try {
  db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
    .run(email, hashedPassword)
} catch (error: any) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ error: 'Email already exists' })
  }
  throw error
}
```

### JWT Errors

**Token Verification:**
```typescript
try {
  const decoded = jwt.verify(token, JWT_SECRET)
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: 'Token expired' })
  }
  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  throw error
}
```

---

## Testing API Endpoints

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Profile:**
```bash
curl http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Reset Password:**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","newPassword":"newpass123"}'
```

---

## Best Practices

### When Adding New Endpoints

1. Define route in `src/routes/[resource].routes.ts`
2. Add validation schema in `src/validation/`
3. Use `validateRequest` middleware
4. Add authentication if needed (`authenticate`)
5. Implement error handling (try-catch)
6. Log important actions with Winston
7. Return consistent JSON responses

### When Adding New Middleware

1. Create in `src/middleware/[name].middleware.ts`
2. Export middleware function
3. Add TypeScript types (extend Request if needed)
4. Add error handling
5. Call `next()` or send response
6. Register in correct order in `index.ts`

### When Modifying Database Schema

1. Update table creation in `src/db.ts`
2. Delete existing `auth.db` file
3. Restart server (recreates database)
4. Update TypeScript types
5. Test all affected endpoints

### Security Checklist

- [ ] All passwords hashed with bcrypt
- [ ] JWT_SECRET in environment variable
- [ ] Rate limiting enabled
- [ ] Input validation with Zod
- [ ] SQL injection prevented (prepared statements)
- [ ] CORS configured correctly
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain passwords/tokens
- [ ] HTTPS in production
- [ ] Helmet security headers enabled

---

## Common Issues & Solutions

**Issue:** "JWT secret not set"
- Set `JWT_SECRET` in `.env` file
- Never use default/fallback secret in production

**Issue:** "SQLITE_CONSTRAINT" error
- Email already exists in database
- Return 409 Conflict status code

**Issue:** "Token expired" error
- Token is valid for 24 hours
- User must re-login
- Consider implementing refresh tokens

**Issue:** "CORS error" in browser
- Check CORS origin configuration
- Ensure `credentials: true` if using cookies
- Verify frontend URL matches allowed origin

**Issue:** "Database locked"
- better-sqlite3 doesn't support concurrent writes
- Ensure only one instance writes at a time
- Consider connection pooling for production

**Issue:** "Rate limit exceeded"
- Adjust limits in `src/config/rate-limit.config.ts`
- Consider per-user limits instead of per-IP
- Whitelist trusted IPs if needed

---

## File Locations Quick Reference

| Purpose | File Path |
|---------|-----------|
| Server entry | `src/index.ts` |
| Database setup | `src/db.ts` |
| Auth routes | `src/routes/auth.routes.ts` |
| User routes | `src/routes/user.routes.ts` |
| Auth middleware | `src/middleware/auth.middleware.ts` |
| Error middleware | `src/middleware/error.middleware.ts` |
| Validation | `src/validation/auth.validation.ts` |
| Rate limiting | `src/config/rate-limit.config.ts` |
| Logger | `src/utils/logger.ts` |
| Dev routes | `src/dev-routes.ts` |
| TS config | `tsconfig.json` |
| Environment | `.env` |

---

## Dependencies Reference

**Core:**
- `express@5.2.1` - Web framework
- `typescript@5.9.3` - Type safety
- `tsx@4.21.0` - TS execution for dev

**Database:**
- `better-sqlite3@12.6.2` - SQLite driver

**Authentication:**
- `jsonwebtoken@9.0.3` - JWT tokens
- `bcryptjs@3.0.3` - Password hashing

**Security:**
- `helmet@8.1.0` - Security headers
- `cors@2.8.5` - CORS middleware
- `express-rate-limit@8.2.1` - Rate limiting

**Validation:**
- `zod@4.2.1` - Schema validation

**Logging:**
- `winston@3.19.0` - Logging

**Environment:**
- `dotenv@17.2.3` - Load .env files

---

## API Response Formats

### Success Responses

**Registration:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Login:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Profile:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["body", "email"],
      "message": "Invalid email"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "error": "Invalid or expired token"
}
```

**Not Found (404):**
```json
{
  "error": "User not found"
}
```

**Conflict (409):**
```json
{
  "error": "Email already exists"
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error",
  "stack": "Error: ..." // dev only
}
```

---

## Development Workflow

**Start Server:**
```bash
cd server
npm run dev
# Runs on http://localhost:3001
# Hot reload enabled with tsx watch
```

**Build for Production:**
```bash
npm run build
# Compiles to dist/
```

**Run Production Build:**
```bash
npm start
# Runs compiled JS from dist/
```

**View Logs:**
```bash
# Error logs
tail -f logs/error.log

# All logs
tail -f logs/combined.log
```

**Check Health:**
```bash
curl http://localhost:3001/health
```

---

## Summary

This server provides:
- **RESTful API** with Express.js
- **JWT authentication** with 24h tokens
- **SQLite database** with better-sqlite3
- **Input validation** with Zod schemas
- **Rate limiting** for security
- **Comprehensive logging** with Winston
- **Security middleware** (Helmet, CORS)
- **Password hashing** with bcrypt
- **TypeScript** for type safety
- **Graceful shutdown** handling
- **Development routes** for debugging
- **Error handling** middleware chain

The codebase follows Express best practices with:
- Middleware chain pattern
- Route separation by resource
- Centralized error handling
- Environment-based configuration
- Prepared SQL statements
- Structured logging
- Type-safe request/response handling
