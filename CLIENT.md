# Auth Project - Client Side Context

## Overview

React 19 + TypeScript + Vite authentication frontend with advanced animations, 3D graphics, and comprehensive form validation.

**Tech Stack:**
- React 19.2 + TypeScript 5.9
- Vite 7.2 (build tool)
- React Router DOM 7.10 (routing)
- Framer Motion 12.23 (animations)
- Three.js + R3F (3D graphics)
- Lucide React (icons)

**Development Server:** `http://localhost:5173`
**API Proxy:** `/api` → `http://localhost:3001`

---

## Project Structure

```
client/
├── src/
│   ├── App.tsx                          # Main app with routing setup
│   ├── main.tsx                         # Entry point
│   │
│   ├── components/                      # Reusable UI components
│   │   ├── auth-form/                   # Authentication form system
│   │   │   ├── AuthForm.tsx             # Main form with mode switching
│   │   │   ├── AuthContainer.tsx        # Layout wrapper with animations
│   │   │   └── components/              # Form sub-components
│   │   │       ├── AnimatedTitle/       # Typewriter effect title
│   │   │       ├── FormFields/          # Field group with validation UI
│   │   │       ├── InputField/          # Custom input with error state
│   │   │       ├── Logo/                # Animated logo
│   │   │       ├── ModeSelector/        # Login/Register/Reset tabs
│   │   │       └── SubmitButton/        # Button with loading & waves
│   │   │
│   │   ├── wave-bg/                     # Background wave animations
│   │   │   ├── WavesBackground.tsx      # SVG-based waves
│   │   │   ├── WavesBackgroundWebGL.tsx # WebGL shader waves
│   │   │   ├── ThinWavesBackground.tsx  # Thin wave variant
│   │   │   ├── WavesWithText.tsx        # WebGL with text morph
│   │   │   ├── wave-with-text/          # WebGL implementation
│   │   │   │   ├── shaders.ts           # GLSL vertex & fragment shaders
│   │   │   │   ├── wave-bg.render.ts    # Rendering logic
│   │   │   │   ├── wave-bg.anim.ts      # Animation logic
│   │   │   │   └── useWaveAnimation.ts  # Animation hook
│   │   │   └── thin-wave/               # Thin wave config
│   │   │
│   │   ├── floating-balls/              # 3D floating spheres (Three.js)
│   │   │   ├── FloatingBalls.tsx        # R3F component
│   │   │   ├── useBouncingBalls.ts      # Physics simulation
│   │   │   └── useImages.tsx            # Image loader
│   │   │
│   │   ├── route/                       # Route guards
│   │   │   └── ProtectedRoute.tsx       # Auth-required wrapper
│   │   │
│   │   ├── layout/                      # Layout components
│   │   │   └── AnimatedPageWrapper.tsx  # Page transitions
│   │   │
│   │   ├── header/                      # Navigation header
│   │   ├── tabs/                        # Tab component system
│   │   ├── expandable-content/          # Expandable UI
│   │   └── popover-trigger/             # Popover component
│   │
│   ├── pages/                           # Route pages
│   │   ├── LoginPage.tsx                # Login/Register/Reset page
│   │   └── profile/                     # User profile page
│   │       ├── ProfilePage.tsx          # Main profile container
│   │       └── components/              # Profile sub-components
│   │           ├── hero/                # Hero section
│   │           └── about-hero/          # Tabbed about section
│   │               ├── AboutHero.tsx
│   │               ├── ScrollProgressIndicator.tsx
│   │               └── components/      # Section content
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── useAuthForm.ts               # Form logic, validation, submit
│   │   ├── useAuthInfo.ts               # Auth context accessor
│   │   ├── useTypewriter.ts             # Typewriter text effect
│   │   └── useWaveEffect.tsx            # Wave animation logic
│   │
│   ├── context/                         # React Context
│   │   ├── AuthInfoContext.tsx          # Auth provider wrapper
│   │   └── createAuthInfoContext.ts     # Context factory
│   │
│   ├── services/                        # API layer
│   │   └── api.service.ts               # All API calls (fetch wrapper)
│   │
│   ├── utils/                           # Utility functions
│   │   ├── validation.utils.ts          # Form validation helpers
│   │   └── noiseGenerator.utils.ts      # Noise for backgrounds
│   │
│   ├── constants/                       # App constants
│   │   └── auth.constants.ts            # Validation rules, animations, modes
│   │
│   ├── types/                           # TypeScript definitions
│   │   ├── auth.types.ts                # ViewMode, FormData, FormErrors
│   │   ├── auth-info-context.types.ts   # User, AuthInfoContextType
│   │   └── error.types.ts               # Error types
│   │
│   ├── styles/                          # Global CSS
│   │   ├── button.css                   # Button styling
│   │   ├── input.css                    # Input field styling
│   │   └── font.css                     # Font definitions
│   │
│   └── assets/                          # Static assets
│       ├── icons/                       # SVG icon components
│       └── about-images/                # Profile images
│
├── public/fonts/                        # Local Inter font
├── index.html                           # HTML entry
├── vite.config.ts                       # Vite config with proxy
├── tsconfig.app.json                    # TS config with path aliases
├── .prettierrc                          # Code formatting
└── package.json
```

---

## Core Architecture

### 1. Routing System

**File:** `src/App.tsx`

Routes defined with React Router DOM v7:

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/login` | LoginPage | No | Authentication form |
| `/profile` | ProfilePage | Yes | User profile page |
| `/` | - | No | Redirects to `/login` |
| `*` | - | No | Catch-all redirects to `/login` |

**Page Transitions:**
- Uses Framer Motion's `AnimatePresence`
- Blur + opacity + translate effects
- Unique keys per route for smooth transitions

**Background Layers:**
```tsx
<ThinWavesBackground />
<WavesBackground />
<WavesWithText />
```

### 2. State Management

**AuthInfoContext** - `src/context/AuthInfoContext.tsx`

Global authentication state using React Context API.

**Interface:**
```typescript
interface AuthInfoContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

interface User {
  id: number
  email: string
  created_at?: string
}
```

**Storage:**
- JWT token: `localStorage.token`
- User data: `localStorage.user` (JSON string)

**Auto-initialization:**
- On mount, checks for existing token
- If found, fetches user profile via `getUserProfile()`
- Sets `isAuthenticated` and `user` state

**Usage:**
```typescript
const { user, isAuthenticated, login, logout } = useAuthInfo()
```

### 3. API Service Layer

**File:** `src/services/api.service.ts`

All API calls go through this service. Base URL: `/api` (proxied to `http://localhost:3001` in dev).

**Functions:**

```typescript
// Authentication
registerUser(data: { email: string; password: string })
  → POST /api/auth/register
  → Returns: { message: string, userId: number }

loginUser(data: { email: string; password: string })
  → POST /api/auth/login
  → Returns: { token: string, user: User }
  → Side effect: stores token & user in localStorage

checkEmail(email: string)
  → POST /api/auth/check-email
  → Returns: { emailExists: boolean }

resetPassword(email: string, newPassword: string)
  → POST /api/auth/reset-password
  → Returns: { message: string, success: boolean }

// User Profile
getUserProfile()
  → GET /api/user/profile
  → Requires: Bearer token in Authorization header
  → Returns: User

// Helpers
logoutUser() → Clears localStorage
isAuthenticated() → Checks if token exists
getCurrentUser() → Reads user from localStorage
```

**Error Handling:**
- All requests wrapped in try-catch
- Returns `{ error: true, message: string }` on failure
- Network errors return generic message

### 4. Form System

**Custom Hook:** `src/hooks/useAuthForm.ts`

Manages all form logic for authentication.

**View Modes:**
```typescript
type ViewMode = 'login' | 'register' | 'reset'
```

**State:**
```typescript
{
  viewMode: ViewMode
  formData: {
    email: string
    password: string
    confirmPassword?: string
    newPassword?: string
    confirmNewPassword?: string
  }
  errors: Record<string, string>
  touched: Record<string, boolean>
  isLoading: boolean
  showPasswordFields: boolean  // For reset mode step 2
  isExiting: boolean           // For exit animation
}
```

**Key Methods:**

```typescript
handleModeChange(mode: ViewMode)
  → Switches mode, resets form, clears errors

handleChange(e: ChangeEvent<HTMLInputElement>)
  → Updates field value
  → Validates if field was touched

handleBlur(e: FocusEvent<HTMLInputElement>)
  → Marks field as touched
  → Triggers validation

validateForm() → boolean
  → Validates all required fields for current mode
  → Returns true if valid

handleSubmit(e: FormEvent)
  → Prevents default
  → Validates form
  → Calls appropriate API (register/login/reset)
  → Handles success/error states
```

**Validation Rules:**
- **Email:** Must match regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password:** Minimum 6 characters
- **Confirm Password:** Must exactly match password
- **New Password (reset):** Minimum 6 characters
- **Confirm New Password:** Must match new password

**Flow Example (Register):**
1. User fills form → `handleChange` updates state
2. User tabs away → `handleBlur` marks touched & validates
3. User clicks submit → `validateForm` checks all fields
4. If valid → calls `registerUser()` API
5. Success → shows message, switches to login mode
6. Error → displays error message

### 5. Component Hierarchy

#### Auth Form Components

**AuthContainer** - `src/components/auth-form/AuthContainer.tsx`
- Layout wrapper with exit animation
- Two-column layout (form left, logo right)
- Handles exit animation before navigation

**AuthForm** - `src/components/auth-form/AuthForm.tsx`
- Main form component
- Integrates all sub-components
- Uses `useAuthForm` hook for logic

**Component Tree:**
```
AuthContainer
├─ AuthForm
   ├─ Logo (mini, top-left)
   ├─ ModeSelector (tabs)
   ├─ AnimatedTitle (typewriter)
   ├─ FormFields
   │  ├─ InputField (email)
   │  ├─ InputField (password)
   │  ├─ InputField (confirmPassword)
   │  └─ ... (conditional fields)
   └─ SubmitButton
```

**FormFields** - Renders different fields based on mode:
- **Login:** email, password
- **Register:** email, password, confirmPassword
- **Reset (step 1):** email
- **Reset (step 2):** newPassword, confirmNewPassword

**InputField** - `src/components/auth-form/components/InputField/`
- Custom input with label, error message, password toggle
- Props: `label`, `name`, `type`, `value`, `onChange`, `onBlur`, `error`, `touched`
- Shows error only if touched
- Eye icon for password visibility toggle

**ModeSelector** - `src/components/auth-form/components/ModeSelector/`
- Tab-like UI with icons
- Smooth sliding background animation
- Active state styling

**SubmitButton** - `src/components/auth-form/components/SubmitButton/`
- Animated button with wave background
- Loading state shows different text
- Spring animation on hover/click
- Icon support (left/right position)

#### Profile Page Components

**ProfilePage** - `src/pages/profile/ProfilePage.tsx`
- Header with logout
- Hero section with user info
- AboutHero with tabbed content
- Scroll progress indicator

**Hero** - `src/pages/profile/components/hero/Hero.tsx`
- User email display
- Created date display
- Animated entrance

**AboutHero** - `src/pages/profile/components/about-hero/AboutHero.tsx`
- Tab navigation (About, Projects, Contacts)
- Multiple content sections
- Scroll-triggered animations
- 3D floating balls background

### 6. Route Protection

**ProtectedRoute** - `src/components/route/ProtectedRoute.tsx`

Higher-order component that wraps protected routes.

**Logic:**
```typescript
const { isAuthenticated, isLoading } = useAuthInfo()

if (isLoading) return <div>Loading...</div>
if (!isAuthenticated) return <Navigate to="/login" replace />
return <>{children}</>
```

**Usage:**
```tsx
<Route path="/profile" element={
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
} />
```

### 7. Animation System

**Framer Motion Configuration** - `src/constants/auth.constants.ts`

```typescript
SPRING_CONFIG = {
  stiffness: 380,
  damping: 30
}

BUTTON_SPRING_CONFIG = {
  stiffness: 400,
  damping: 17
}

ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3
}
```

**Animation Patterns:**

**Page Transitions:**
```tsx
<motion.div
  initial={{ opacity: 0, filter: 'blur(10px)', x: -20 }}
  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
  exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
  transition={{ duration: 0.2 }}
>
```

**Form Mode Switch:**
- Fields animate height 0 → auto (exit)
- New fields fade in with scale effect
- Uses `AnimatePresence` with unique keys

**Error Messages:**
```tsx
<AnimatePresence mode="wait">
  {error && (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
    >
      {error}
    </motion.div>
  )}
</AnimatePresence>
```

**Background Waves:**
- WebGL shader-based animations
- Smooth sine wave movement
- Particle effects
- Text morphing with flubber

### 8. Validation System

**File:** `src/utils/validation.utils.ts`

```typescript
validateEmail(email: string): string | null
  → Checks regex pattern
  → Returns error message or null

validatePassword(password: string): string | null
  → Checks length >= 6
  → Returns error message or null

validateConfirmPassword(confirm: string, password: string): string | null
  → Checks exact match
  → Returns error message or null

getFieldValidator(fieldName: string, password?: string)
  → Returns validator function for field
  → Handles all field types
```

**Mode Configurations:**
```typescript
MODE_CONFIGS = {
  login: {
    title: 'Welcome Back',
    buttonText: 'Sign In',
    fieldsToValidate: ['email', 'password']
  },
  register: {
    title: 'Create Account',
    buttonText: 'Sign Up',
    fieldsToValidate: ['email', 'password', 'confirmPassword']
  },
  reset: {
    title: 'Reset Password',
    buttonText: 'Reset',
    fieldsToValidate: ['email']
  }
}
```

### 9. TypeScript Types

**Auth Types** - `src/types/auth.types.ts`

```typescript
export type ViewMode = 'login' | 'register' | 'reset'

export interface FormData {
  email: string
  password: string
  confirmPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

export interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

export interface ModeConfig {
  title: string
  buttonText: string
  fieldsToValidate: (keyof FormData)[]
}
```

**Context Types** - `src/types/auth-info-context.types.ts`

```typescript
export interface User {
  id: number
  email: string
  created_at?: string
}

export interface AuthInfoContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}
```

### 10. Configuration Files

**Vite Config** - `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    assetsInlineLimit: 0  // Don't inline fonts
  }
})
```

**TypeScript Config** - `tsconfig.app.json`

Path aliases for clean imports:
```typescript
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/context/*": ["./src/context/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/assets/*": ["./src/assets/*"]
    }
  }
}
```

**Usage:**
```typescript
import { useAuthInfo } from '@/hooks/useAuthInfo'
import { validateEmail } from '@/utils/validation.utils'
import { AuthForm } from '@/components/auth-form'
```

**Prettier Config** - `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5"
}
```

### 11. Custom Hooks

**useAuthForm** - `src/hooks/useAuthForm.ts`
- Form state management
- Validation logic
- API submission
- Mode switching

**useAuthInfo** - `src/hooks/useAuthInfo.ts`
- Access auth context
- Shorthand for `useContext(AuthInfoContext)`

**useTypewriter** - `src/hooks/useTypewriter.ts`
- Animated text typing effect
- Configurable speed and cursor

**useWaveEffect** - `src/hooks/useWaveEffect.tsx`
- Wave animation logic
- Scroll-triggered effects

### 12. Global Styles

**Button Styles** - `src/styles/button.css`
- Base button classes
- Hover/active states
- Loading state
- Variants (primary, secondary, ghost)

**Input Styles** - `src/styles/input.css`
- Input field base styling
- Focus states
- Error states
- Label animations

**Font Configuration** - `src/styles/font.css`
- Local Inter font loading
- Font-weight variants (400, 500, 600, 700)
- Font-display: swap for performance

### 13. Development Workflow

**Start Dev Server:**
```bash
cd client
npm run dev
# Opens on http://localhost:5173
```

**Build for Production:**
```bash
npm run build
# Output: dist/
```

**Preview Production Build:**
```bash
npm run preview
```

**Linting:**
```bash
npm run lint
```

---

## Key Features

### Authentication Flow

**Registration:**
1. User fills email, password, confirmPassword
2. Client validates all fields
3. POST to `/api/auth/register`
4. Success: auto-switch to login mode
5. Error: display error message

**Login:**
1. User fills email, password
2. Client validates fields
3. POST to `/api/auth/login`
4. Success: store token, update context, navigate to `/profile`
5. Error: display error message

**Password Reset:**
1. User enters email
2. POST to `/api/auth/check-email`
3. If email exists: show new password fields
4. User enters newPassword, confirmNewPassword
5. POST to `/api/auth/reset-password`
6. Success: switch to login mode
7. Error: display error message

### Token Management

**Storage:**
```typescript
localStorage.setItem('token', jwtToken)
localStorage.setItem('user', JSON.stringify(userData))
```

**Retrieval:**
```typescript
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || 'null')
```

**API Headers:**
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Logout:**
```typescript
localStorage.removeItem('token')
localStorage.removeItem('user')
// Redirect to /login
```

### Error Handling

**Client-Side Validation:**
- Real-time validation on blur
- Display errors below fields
- Prevent submission if invalid

**API Errors:**
- Caught in try-catch
- Displayed as toast/alert
- User stays on current page

**Network Errors:**
- Generic "Something went wrong" message
- Logs to console for debugging

### Responsive Design

- Mobile-first approach
- Breakpoints handled in CSS
- Touch-friendly inputs
- Adaptive layouts

---

## Best Practices

### When Adding New Components

1. Create folder in `src/components/[component-name]/`
2. Add component file: `[ComponentName].tsx`
3. Add styles if needed: `[ComponentName].css`
4. Add types if complex: `[component-name].types.ts`
5. Export via `index.ts` barrel file
6. Use path aliases: `@/components/[component-name]`

### When Adding New Routes

1. Create page in `src/pages/[PageName].tsx`
2. Add route in `src/App.tsx`
3. If protected, wrap in `<ProtectedRoute>`
4. Add page transition animations

### When Adding New API Endpoints

1. Add function in `src/services/api.service.ts`
2. Add TypeScript types in `src/types/`
3. Handle errors with try-catch
4. Update context if needed (e.g., new user data)

### When Adding New Form Fields

1. Update `FormData` type in `src/types/auth.types.ts`
2. Add validation in `src/utils/validation.utils.ts`
3. Update `MODE_CONFIGS` if new mode
4. Add field to `FormFields` component
5. Update `useAuthForm` hook validation logic

---

## Troubleshooting

**Issue:** "API call fails with 404"
- Check proxy in `vite.config.ts`
- Ensure backend server running on port 3001
- Check URL path matches backend routes

**Issue:** "Token not being sent"
- Verify token in localStorage: `localStorage.getItem('token')`
- Check Authorization header in Network tab
- Ensure `isAuthenticated()` returns true

**Issue:** "Animations not working"
- Check Framer Motion version compatibility
- Ensure `AnimatePresence` has unique keys
- Verify `initial`, `animate`, `exit` props

**Issue:** "Form validation not triggering"
- Check if field is marked as `touched`
- Verify validator function in `validation.utils.ts`
- Check `fieldsToValidate` in mode config

**Issue:** "Protected route not redirecting"
- Check `isAuthenticated` state in context
- Verify `ProtectedRoute` wraps component
- Check React Router setup in `App.tsx`

---

## File Locations Quick Reference

| Purpose | File Path |
|---------|-----------|
| Main app | `src/App.tsx` |
| Auth context | `src/context/AuthInfoContext.tsx` |
| API service | `src/services/api.service.ts` |
| Form hook | `src/hooks/useAuthForm.ts` |
| Auth form | `src/components/auth-form/AuthForm.tsx` |
| Login page | `src/pages/LoginPage.tsx` |
| Profile page | `src/pages/profile/ProfilePage.tsx` |
| Protected route | `src/components/route/ProtectedRoute.tsx` |
| Validation | `src/utils/validation.utils.ts` |
| Constants | `src/constants/auth.constants.ts` |
| Types | `src/types/` |
| Vite config | `vite.config.ts` |
| TS config | `tsconfig.app.json` |

---

## Dependencies Reference

**Core:**
- `react@19.2.0` - UI library
- `react-dom@19.2.0` - DOM rendering
- `react-router-dom@7.10.1` - Routing
- `typescript@5.9.3` - Type safety

**Animation & Graphics:**
- `framer-motion@12.23.26` - Animations
- `three@0.182.0` - 3D graphics
- `@react-three/fiber@9.5.0` - React Three.js
- `@react-three/drei@10.7.7` - R3F helpers
- `flubber@0.4.2` - SVG morphing

**UI & Icons:**
- `lucide-react@0.561.0` - Icon library

**Build Tools:**
- `vite@7.2.4` - Build tool & dev server
- `eslint` - Linting
- `prettier@3.7.4` - Formatting

---

## Summary

This client application is a modern React SPA with:
- JWT-based authentication
- Global state via Context API
- Custom hooks for reusable logic
- Comprehensive form validation
- Production-quality animations
- 3D graphics and WebGL effects
- Type-safe TypeScript throughout
- Clean component architecture
- Protected routing
- Developer-friendly tooling

The codebase emphasizes separation of concerns with dedicated folders for components, hooks, services, utils, and types, making it maintainable and scalable.
