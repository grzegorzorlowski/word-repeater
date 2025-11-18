# Authentication System - Technical Specification

## Document Overview

This technical specification defines the architecture and implementation details for the authentication system in WordRepeater AI, covering user registration, login, logout, password recovery, and account deletion functionality. The specification is designed to integrate seamlessly with the existing application architecture using Supabase Auth and Astro 5.

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Applicable User Stories:** US-001, US-002, US-003, US-004

---

## Table of Contents

1. [User Interface Architecture](#1-user-interface-architecture)
2. [Backend Logic](#2-backend-logic)
3. [Authentication System](#3-authentication-system)
4. [Data Models & Types](#4-data-models--types)
5. [Security Considerations](#5-security-considerations)
6. [Migration Strategy](#6-migration-strategy)

---

## 1. User Interface Architecture

### 1.1 Page Structure Overview

The authentication system introduces four new public pages and modifies existing protected pages to enforce authentication requirements.

#### 1.1.1 New Pages (Public)

| Route | Page File | Description | Access |
|-------|-----------|-------------|--------|
| `/login` | `src/pages/login.astro` | User login form | Unauthenticated only |
| `/register` | `src/pages/register.astro` | User registration form | Unauthenticated only |
| `/forgot-password` | `src/pages/forgot-password.astro` | Password reset request | Unauthenticated only |
| `/reset-password` | `src/pages/reset-password.astro` | Password reset confirmation | Token-based access |

#### 1.1.2 Modified Pages (Protected)

All existing application pages must be protected and require authentication:

- `/dashboard` - Main application hub
- `/generate` - Flashcard generation interface
- `/accept` - AI flashcard acceptance flow
- `/flashcards/index` - Flashcard list view
- `/flashcards/new` - Manual flashcard creation
- All API endpoints under `/api/flashcards/*`

**Protection Mechanism:** Middleware-based session validation with automatic redirect to `/login` for unauthenticated users.

---

### 1.2 Component Architecture

#### 1.2.1 Authentication Forms (React Components)

All form components are implemented as interactive React components with client-side validation and state management.

##### **LoginForm Component**
- **File Location:** `src/components/auth/LoginForm.tsx`
- **Responsibility:** Handle user login flow with email/password credentials
- **State Management:**
  ```typescript
  interface LoginFormState {
    email: string;
    password: string;
    isSubmitting: boolean;
    error: string | null;
    validationErrors: {
      email?: string;
      password?: string;
    };
  }
  ```
- **Props:**
  ```typescript
  interface LoginFormProps {
    redirectTo?: string; // Optional redirect path after successful login
  }
  ```
- **Key Elements:**
  - Email input field (type="email", autocomplete="email")
  - Password input field (type="password", autocomplete="current-password")
  - "Remember me" checkbox (optional - stores session preference)
  - Submit button (disabled during submission)
  - Link to registration page
  - Link to password reset page
  - Error message display area
  - Loading indicator overlay during submission
- **Validation Rules:**
  - Email: Required, valid email format (RFC 5322 basic validation)
  - Password: Required, minimum 8 characters
- **User Interactions:**
  1. User fills email and password fields
  2. Client-side validation on blur and submit
  3. On submit: Disable form, show loading state
  4. POST to `/api/auth/login` with credentials
  5. On success: Store session, redirect to `redirectTo` or `/dashboard`
  6. On error: Display error message, re-enable form
- **Error Messages:**
  - `"Invalid email or password"` - Generic auth failure (don't reveal if email exists)
  - `"Please enter a valid email address"` - Format validation
  - `"Password must be at least 8 characters"` - Length validation
  - `"Network error. Please try again."` - Connection issues
  - `"Too many attempts. Please try again later."` - Rate limiting

##### **RegisterForm Component**
- **File Location:** `src/components/auth/RegisterForm.tsx`
- **Responsibility:** Handle new user registration with email, password, and consent
- **State Management:**
  ```typescript
  interface RegisterFormState {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    isSubmitting: boolean;
    error: string | null;
    validationErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      acceptTerms?: string;
    };
  }
  ```
- **Props:**
  ```typescript
  interface RegisterFormProps {
    onSuccess?: () => void; // Callback after successful registration
  }
  ```
- **Key Elements:**
  - Email input field (type="email", autocomplete="email")
  - Password input field (type="password", autocomplete="new-password")
  - Confirm password input field (type="password", autocomplete="new-password")
  - Password strength indicator (visual feedback)
  - Terms and privacy policy checkbox with links
  - Submit button (disabled until all validations pass)
  - Link to login page
  - Success message display area
  - Error message display area
  - Loading indicator overlay during submission
- **Validation Rules:**
  - Email: Required, valid format, not already registered
  - Password: Required, minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
  - Confirm Password: Must match password field
  - Accept Terms: Must be checked (true)
- **User Interactions:**
  1. User fills all fields
  2. Real-time password strength feedback
  3. Client-side validation on blur
  4. On submit: Validate all fields, disable form
  5. POST to `/api/auth/register` with user data
  6. On success: Display success message, redirect to login after 2 seconds
  7. On error: Display specific error, re-enable form
- **Error Messages:**
  - `"Email address is already registered"` - Duplicate email
  - `"Please enter a valid email address"` - Format validation
  - `"Password must be at least 8 characters and include uppercase, lowercase, number, and special character"` - Password requirements
  - `"Passwords do not match"` - Confirmation mismatch
  - `"You must accept the terms and conditions to register"` - Terms not accepted
  - `"Registration failed. Please try again."` - Generic server error

##### **ForgotPasswordForm Component**
- **File Location:** `src/components/auth/ForgotPasswordForm.tsx`
- **Responsibility:** Handle password reset request initiation
- **State Management:**
  ```typescript
  interface ForgotPasswordFormState {
    email: string;
    isSubmitting: boolean;
    isSuccess: boolean;
    error: string | null;
    validationErrors: {
      email?: string;
    };
  }
  ```
- **Key Elements:**
  - Email input field (type="email", autocomplete="email")
  - Submit button
  - Success message display
  - Link back to login
  - Loading indicator
- **Validation Rules:**
  - Email: Required, valid format
- **User Interactions:**
  1. User enters email address
  2. On submit: POST to `/api/auth/forgot-password`
  3. Always show success message (security: don't reveal if email exists)
  4. User checks email for reset link
- **Error Messages:**
  - `"Please enter a valid email address"` - Format validation
  - `"Network error. Please try again."` - Connection issues
- **Success Message:**
  - `"If an account exists with this email, you will receive password reset instructions shortly."`

##### **ResetPasswordForm Component**
- **File Location:** `src/components/auth/ResetPasswordForm.tsx`
- **Responsibility:** Handle password reset completion with token validation
- **State Management:**
  ```typescript
  interface ResetPasswordFormState {
    password: string;
    confirmPassword: string;
    isSubmitting: boolean;
    isSuccess: boolean;
    error: string | null;
    validationErrors: {
      password?: string;
      confirmPassword?: string;
    };
  }
  ```
- **Props:**
  ```typescript
  interface ResetPasswordFormProps {
    token: string; // Reset token from URL query parameter
  }
  ```
- **Key Elements:**
  - Password input field (type="password", autocomplete="new-password")
  - Confirm password input field
  - Password strength indicator
  - Submit button
  - Success message display
  - Token validation status
- **Validation Rules:**
  - Password: Same as registration
  - Confirm Password: Must match
  - Token: Must be valid and not expired
- **User Interactions:**
  1. Component validates token on mount
  2. If invalid: Display error, offer to request new reset
  3. User enters new password
  4. On submit: POST to `/api/auth/reset-password` with token and password
  5. On success: Display success, redirect to login
- **Error Messages:**
  - `"Reset link is invalid or has expired"` - Token validation failure
  - `"Password must be at least 8 characters and include uppercase, lowercase, number, and special character"` - Password requirements
  - `"Passwords do not match"` - Confirmation mismatch
  - `"Failed to reset password. Please try again."` - Generic error

##### **DeleteAccountModal Component**
- **File Location:** `src/components/auth/DeleteAccountModal.tsx`
- **Responsibility:** Handle account deletion with confirmation (GDPR compliance)
- **State Management:**
  ```typescript
  interface DeleteAccountModalState {
    isOpen: boolean;
    confirmationText: string;
    isDeleting: boolean;
    error: string | null;
  }
  ```
- **Props:**
  ```typescript
  interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }
  ```
- **Key Elements:**
  - Modal overlay (using Shadcn/ui Dialog)
  - Warning message about data deletion
  - Confirmation text input (user must type "DELETE")
  - Cancel button
  - Delete button (destructive styling, disabled until confirmation)
  - Loading indicator
- **Validation Rules:**
  - Confirmation text must exactly match "DELETE" (case-sensitive)
- **User Interactions:**
  1. User clicks "Delete Account" in settings/profile
  2. Modal opens with warning
  3. User must type "DELETE" to enable delete button
  4. On delete: POST to `/api/auth/delete-account`
  5. On success: Logout, redirect to goodbye page
  6. On error: Display error, keep modal open
- **Error Messages:**
  - `"Please type DELETE to confirm"` - Confirmation validation
  - `"Failed to delete account. Please try again."` - Generic error
  - `"Network error. Please try again."` - Connection issues

#### 1.2.2 Layout Modifications

##### **AuthLayout Component**
- **File Location:** `src/layouts/AuthLayout.astro`
- **Purpose:** Dedicated layout for authentication pages with centered form design
- **Structure:**
  ```astro
  ---
  import Layout from './Layout.astro';
  interface Props {
    title: string;
  }
  ---
  <Layout title={title}>
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <!-- App Logo/Title -->
        </div>
        <div class="bg-card p-8 rounded-lg shadow-lg border">
          <slot />
        </div>
      </div>
    </div>
  </Layout>
  ```
- **Usage:** Wrap all auth pages (login, register, forgot-password, reset-password)

##### **AppLayout Component (New)**
- **File Location:** `src/layouts/AppLayout.astro`
- **Purpose:** Authenticated application layout with navigation and user menu
- **Structure:**
  ```astro
  ---
  import Layout from './Layout.astro';
  import AppNavigation from '@/components/AppNavigation.astro';
  import UserMenu from '@/components/UserMenu';
  
  interface Props {
    title: string;
  }
  
  // Get user session from middleware
  const session = Astro.locals.session;
  const user = Astro.locals.user;
  ---
  <Layout title={title}>
    <div class="min-h-screen flex flex-col">
      <AppNavigation user={user} />
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </Layout>
  ```
- **Usage:** Wrap all protected pages (dashboard, flashcards, generate, accept)

##### **AppNavigation Component**
- **File Location:** `src/components/AppNavigation.astro`
- **Responsibility:** Main navigation bar for authenticated users
- **Elements:**
  - App logo/title (link to dashboard)
  - Navigation links: Dashboard, Generate, My Flashcards, Learning
  - User menu trigger (right side)
  - Mobile hamburger menu
- **Accessibility:**
  - Semantic `<nav>` element with `aria-label="Main navigation"`
  - Current page indicated with `aria-current="page"`
  - Mobile menu with proper `aria-expanded` state

##### **UserMenu Component**
- **File Location:** `src/components/UserMenu.tsx`
- **Responsibility:** Dropdown menu with user actions
- **Props:**
  ```typescript
  interface UserMenuProps {
    userEmail: string;
  }
  ```
- **Elements:**
  - User email display
  - Settings link (future)
  - Delete Account button (opens DeleteAccountModal)
  - Logout button
- **Implementation:** Shadcn/ui DropdownMenu component

#### 1.2.3 Shared UI Components

##### **PasswordStrengthIndicator Component**
- **File Location:** `src/components/ui/PasswordStrengthIndicator.tsx`
- **Props:**
  ```typescript
  interface PasswordStrengthIndicatorProps {
    password: string;
  }
  ```
- **Display:** Visual bar showing password strength (weak/medium/strong) with color coding

##### **FormField Component**
- **File Location:** `src/components/ui/FormField.tsx`
- **Props:**
  ```typescript
  interface FormFieldProps {
    label: string;
    name: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    autocomplete?: string;
  }
  ```
- **Features:** Consistent styling, error display, accessibility labels

---

### 1.3 Page Implementation Details

#### 1.3.1 Login Page (`/login`)

**File:** `src/pages/login.astro`

**Structure:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { LoginForm } from '@/components/auth/LoginForm';

// Redirect if already authenticated
const session = Astro.locals.session;
if (session) {
  return Astro.redirect('/dashboard');
}

// Get redirect parameter from URL
const redirectTo = Astro.url.searchParams.get('redirect') || '/dashboard';
---

<AuthLayout title="Login">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Welcome Back</h1>
      <p class="text-muted-foreground mt-2">Sign in to your account</p>
    </div>
    
    <LoginForm client:load redirectTo={redirectTo} />
    
    <div class="text-center text-sm">
      <p class="text-muted-foreground">
        Don't have an account?{' '}
        <a href="/register" class="text-primary hover:underline">
          Sign up
        </a>
      </p>
    </div>
  </div>
</AuthLayout>
```

**Server-Side Logic:**
- Check for existing session
- If authenticated, redirect to dashboard
- Extract and pass redirect parameter to form

**SEO Considerations:**
- Meta robots: noindex, nofollow (auth pages)
- Canonical URL

#### 1.3.2 Registration Page (`/register`)

**File:** `src/pages/register.astro`

**Structure:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { RegisterForm } from '@/components/auth/RegisterForm';

// Redirect if already authenticated
const session = Astro.locals.session;
if (session) {
  return Astro.redirect('/dashboard');
}
---

<AuthLayout title="Create Account">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Create Account</h1>
      <p class="text-muted-foreground mt-2">Start learning with flashcards</p>
    </div>
    
    <RegisterForm client:load />
    
    <div class="text-center text-sm">
      <p class="text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" class="text-primary hover:underline">
          Sign in
        </a>
      </p>
    </div>
  </div>
</AuthLayout>
```

**Additional Elements:**
- Links to Terms of Service and Privacy Policy in footer
- Styled as `/legal/terms` and `/legal/privacy` (static pages)

#### 1.3.3 Forgot Password Page (`/forgot-password`)

**File:** `src/pages/forgot-password.astro`

**Structure:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Redirect if already authenticated
const session = Astro.locals.session;
if (session) {
  return Astro.redirect('/dashboard');
}
---

<AuthLayout title="Reset Password">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Reset Password</h1>
      <p class="text-muted-foreground mt-2">
        Enter your email to receive reset instructions
      </p>
    </div>
    
    <ForgotPasswordForm client:load />
    
    <div class="text-center text-sm">
      <a href="/login" class="text-primary hover:underline">
        Back to login
      </a>
    </div>
  </div>
</AuthLayout>
```

#### 1.3.4 Reset Password Page (`/reset-password`)

**File:** `src/pages/reset-password.astro`

**Structure:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Extract token from URL
const token = Astro.url.searchParams.get('token');

// If no token, redirect to forgot password page
if (!token) {
  return Astro.redirect('/forgot-password');
}
---

<AuthLayout title="Set New Password">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Set New Password</h1>
      <p class="text-muted-foreground mt-2">
        Enter your new password below
      </p>
    </div>
    
    <ResetPasswordForm client:load token={token} />
  </div>
</AuthLayout>
```

#### 1.3.5 Modified Dashboard Page

**File:** `src/pages/dashboard.astro` (updated)

**Changes:**
```astro
---
import AppLayout from '@/layouts/AppLayout.astro';
import DashboardHeader from '@/components/DashboardHeader.astro';
import { DashboardContent } from '@/components/DashboardContent';

// Session is validated by middleware
// User info is available in Astro.locals.user
const user = Astro.locals.user;
---

<AppLayout title="Dashboard">
  <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
    <div class="w-full max-w-2xl">
      <DashboardHeader title="Dashboard" />
      
      <DashboardContent client:load userId={user.id} />
    </div>
  </main>
</AppLayout>
```

**Key Changes:**
- Use AppLayout instead of Layout
- Access user from Astro.locals
- Pass userId to DashboardContent component
- Remove DEFAULT_USER usage

---

### 1.4 Validation Strategy

#### 1.4.1 Client-Side Validation

**Purpose:** Immediate feedback, reduce server load, improve UX

**Implementation:**
- Custom React hook: `useFormValidation`
- Zod schemas for validation rules
- Real-time validation on blur
- Pre-submit validation

**Example Validation Schema:**
```typescript
// src/lib/validation/authSchemas.ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

#### 1.4.2 Server-Side Validation

**Purpose:** Security, prevent malicious requests, business logic validation

**Implementation:**
- Validate all inputs in API endpoints
- Use Zod schemas (same as client-side)
- Check for duplicate emails
- Verify token validity
- Rate limiting

---

### 1.5 Error Handling Scenarios

#### 1.5.1 Network Errors
- **Display:** "Network error. Please check your connection and try again."
- **Action:** Show retry button
- **Logging:** Log to audit_logs with action "network_error_auth"

#### 1.5.2 Validation Errors
- **Display:** Specific field-level errors
- **Action:** Highlight invalid fields
- **User Flow:** User corrects and resubmits

#### 1.5.3 Authentication Errors
- **Display:** Generic "Invalid email or password" (security)
- **Action:** Clear password field, focus email
- **Logging:** Log failed login attempts with IP (rate limiting)

#### 1.5.4 Rate Limiting
- **Trigger:** 5 failed attempts within 15 minutes
- **Display:** "Too many attempts. Please try again in 15 minutes."
- **Implementation:** Supabase rate limiting + custom middleware check

#### 1.5.5 Session Expiration
- **Detection:** API returns 401 Unauthorized
- **Action:** Clear local session, redirect to `/login?redirect=/current-path`
- **Display:** "Your session has expired. Please log in again."

---

## 2. Backend Logic

### 2.1 API Endpoints

All authentication endpoints follow RESTful conventions and return consistent response formats.

#### 2.1.1 Register User

**Endpoint:** `POST /api/auth/register`

**File:** `src/pages/api/auth/register.ts`

**Request Body:**
```typescript
{
  email: string;
  password: string;
  acceptTerms: boolean;
}
```

**Validation:**
- Email: Valid format, unique
- Password: Meets complexity requirements
- AcceptTerms: Must be true

**Process Flow:**
1. Validate request body against `registerSchema`
2. Check if email already exists in Supabase Auth
3. If duplicate: Return 409 Conflict
4. Create user in Supabase Auth using `supabase.auth.signUp()`
5. Log registration event in audit_logs
6. Return success response

**Response (Success - 201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (Error - 409 Conflict):**
```json
{
  "error": "Email address is already registered"
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "password": "Password must be at least 8 characters"
  }
}
```

**Implementation Example:**
```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { registerSchema } from '@/lib/validation/authSchemas';
import { logAuditEvent } from '@/lib/services/auditLogService';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, password } = validationResult.data;
    const supabase = locals.supabase;
    
    // Attempt to create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });
    
    if (error) {
      // Check for duplicate email error
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Email address is already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Log error and return generic message
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({ error: 'Registration failed. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log successful registration
    if (data.user) {
      await logAuditEvent(supabase, data.user.id, 'user_registered');
    }
    
    return new Response(
      JSON.stringify({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in registration:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### 2.1.2 Login User

**Endpoint:** `POST /api/auth/login`

**File:** `src/pages/api/auth/login.ts`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Validation:**
- Email: Valid format
- Password: Non-empty

**Process Flow:**
1. Validate request body
2. Authenticate with Supabase using `supabase.auth.signInWithPassword()`
3. If invalid credentials: Return 401 Unauthorized
4. Create session cookie using Astro.cookies
5. Log login event in audit_logs
6. Return success with user data

**Response (Success - 200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "redirectTo": "/dashboard"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

**Implementation Notes:**
- Use Supabase's session management
- Set httpOnly cookie for security
- Cookie name: `sb-access-token` and `sb-refresh-token`
- Cookie attributes: `Secure`, `SameSite=Lax`, `HttpOnly`
- Log IP address for rate limiting (stored temporarily, not in audit_logs)

#### 2.1.3 Logout User

**Endpoint:** `POST /api/auth/logout`

**File:** `src/pages/api/auth/logout.ts`

**Authentication:** Required (session cookie)

**Process Flow:**
1. Verify session exists
2. Call `supabase.auth.signOut()`
3. Clear session cookies
4. Log logout event
5. Return success

**Response (Success - 200 OK):**
```json
{
  "message": "Logout successful"
}
```

**Implementation:**
```typescript
export const POST: APIRoute = async ({ locals, cookies }) => {
  const supabase = locals.supabase;
  const session = locals.session;
  
  if (session?.user) {
    await logAuditEvent(supabase, session.user.id, 'user_logged_out');
  }
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Clear cookies
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  
  return new Response(
    JSON.stringify({ message: 'Logout successful' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

#### 2.1.4 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**File:** `src/pages/api/auth/forgot-password.ts`

**Request Body:**
```typescript
{
  email: string;
}
```

**Process Flow:**
1. Validate email format
2. Call `supabase.auth.resetPasswordForEmail()`
3. Always return success (security: don't reveal if email exists)
4. Supabase sends email with reset link
5. Link format: `{origin}/reset-password?token={token}`

**Response (Success - 200 OK):**
```json
{
  "message": "If an account exists with this email, you will receive password reset instructions shortly."
}
```

**Security Notes:**
- Always return success, even if email doesn't exist
- Rate limit: 3 requests per email per hour
- Tokens expire after 1 hour

#### 2.1.5 Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**File:** `src/pages/api/auth/reset-password.ts`

**Request Body:**
```typescript
{
  token: string;
  password: string;
}
```

**Validation:**
- Token: Valid JWT format, not expired
- Password: Meets complexity requirements

**Process Flow:**
1. Validate request body
2. Verify token with Supabase
3. If invalid/expired: Return 400 Bad Request
4. Update password using `supabase.auth.updateUser()`
5. Invalidate all existing sessions for user
6. Log password reset event
7. Return success

**Response (Success - 200 OK):**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Reset link is invalid or has expired"
}
```

#### 2.1.6 Delete Account

**Endpoint:** `POST /api/auth/delete-account`

**File:** `src/pages/api/auth/delete-account.ts`

**Authentication:** Required (session cookie)

**Request Body:**
```typescript
{
  confirmationText: string; // Must be "DELETE"
}
```

**Process Flow:**
1. Verify user session
2. Validate confirmation text
3. Soft delete all user flashcards (set deleted_at)
4. Log account deletion event
5. Delete user from Supabase Auth (hard delete)
6. Clear session
7. Return success

**Response (Success - 200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Invalid confirmation text"
}
```

**GDPR Compliance:**
- Hard delete from Supabase Auth (PII removed)
- Soft delete flashcards (retain for analytics, anonymized)
- Audit logs retain user_id but user is unidentifiable
- Process must complete within 30 days per GDPR

**Implementation:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const body = await request.json();
  
  if (body.confirmationText !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Invalid confirmation text' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Soft delete flashcards
    await supabase
      .from('flashcards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('deleted_at', null);
    
    // Log deletion event
    await logAuditEvent(supabase, user.id, 'user_account_deleted');
    
    // Delete user from Auth (this is permanent)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in account deletion:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### 2.2 Middleware Enhancement

#### 2.2.1 Session Management Middleware

**File:** `src/middleware/index.ts` (updated)

**Current Implementation:**
```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Enhanced Implementation:**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/legal/terms',
  '/legal/privacy',
];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, locals, redirect } = context;
  
  // Attach Supabase client to context
  locals.supabase = supabaseClient;
  
  // Get session from cookies
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  
  // Attempt to get session if tokens exist
  if (accessToken && refreshToken) {
    const { data: { session }, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if (!error && session) {
      locals.session = session;
      locals.user = session.user;
      
      // Refresh tokens if needed
      if (session.access_token !== accessToken) {
        cookies.set('sb-access-token', session.access_token, {
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
      
      if (session.refresh_token !== refreshToken) {
        cookies.set('sb-refresh-token', session.refresh_token, {
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    } else {
      // Invalid session, clear cookies
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
    }
  }
  
  const pathname = url.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
  const isAuthenticated = !!locals.session;
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return redirect('/dashboard');
  }
  
  // Redirect unauthenticated users from protected routes
  if (!isAuthenticated && !isPublicRoute && !isPublicApiRoute) {
    // Store intended destination for redirect after login
    const redirectTo = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
    return redirect(`/login${redirectTo}`);
  }
  
  return next();
});
```

**Key Features:**
- Session validation on every request
- Automatic token refresh
- Cookie management (set, update, delete)
- Route protection (redirect logic)
- Public vs. protected route distinction
- User context injection (locals.user, locals.session)

#### 2.2.2 Context Locals Interface

**File:** `src/env.d.ts` (updated)

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('./db/supabase.client').SupabaseClient;
    session: import('@supabase/supabase-js').Session | null;
    user: import('@supabase/supabase-js').User | null;
  }
}
```

**Usage in Pages:**
```typescript
// Access authenticated user
const user = Astro.locals.user;
const session = Astro.locals.session;

// User is guaranteed to exist on protected pages (middleware handles redirect)
```

---

### 2.3 Service Layer

#### 2.3.1 Auth Service

**File:** `src/lib/services/authService.ts`

**Purpose:** Centralize authentication business logic, separate from API routes

**Interface:**
```typescript
export interface AuthService {
  registerUser(email: string, password: string): Promise<RegisterResult>;
  loginUser(email: string, password: string): Promise<LoginResult>;
  logoutUser(userId: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<ResetResult>;
  deleteUserAccount(userId: string): Promise<void>;
  validateSession(accessToken: string, refreshToken: string): Promise<SessionResult>;
}

interface RegisterResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

interface LoginResult {
  success: boolean;
  session?: Session;
  user?: User;
  error?: string;
}

interface ResetResult {
  success: boolean;
  error?: string;
}

interface SessionResult {
  valid: boolean;
  session?: Session;
  user?: User;
}
```

**Implementation Example:**
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import { logAuditEvent } from './auditLogService';

export class SupabaseAuthService implements AuthService {
  constructor(private supabase: SupabaseClient) {}
  
  async registerUser(email: string, password: string): Promise<RegisterResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      await logAuditEvent(this.supabase, data.user.id, 'user_registered');
    }
    
    return {
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
    };
  }
  
  async loginUser(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (data.user) {
      await logAuditEvent(this.supabase, data.user.id, 'user_logged_in');
    }
    
    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  }
  
  // ... other methods
}

// Factory function
export function createAuthService(supabase: SupabaseClient): AuthService {
  return new SupabaseAuthService(supabase);
}
```

**Benefits:**
- Testable (can mock SupabaseClient)
- Reusable across API routes
- Centralized audit logging
- Business logic separation from HTTP concerns

#### 2.3.2 Audit Log Service Enhancement

**File:** `src/lib/services/auditLogService.ts` (updated)

**New Events:**
- `user_registered` - New user account created
- `user_logged_in` - Successful login
- `user_logged_out` - User logged out
- `user_password_reset_requested` - Password reset email sent
- `user_password_reset_completed` - Password successfully reset
- `user_account_deleted` - Account deletion (GDPR)
- `failed_login_attempt` - Authentication failure (for rate limiting)

**Rate Limiting Implementation:**
```typescript
export async function checkLoginRateLimit(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string
): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  // Check failed attempts in last 15 minutes
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('action', `failed_login_attempt:${email}:${ipAddress}`)
    .gte('occurred_at', fifteenMinutesAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Fail open (allow attempt)
  }
  
  return (data?.length || 0) < 5; // Allow if less than 5 attempts
}

export async function logFailedLoginAttempt(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string
): Promise<void> {
  await logAuditEvent(
    supabase,
    null, // No user_id for failed attempts
    `failed_login_attempt:${email}:${ipAddress}`
  );
}
```

---

### 2.4 Existing Services Migration

#### 2.4.1 Remove DEFAULT_USER Constant

**File:** `src/db/supabase.client.ts` (updated)

**Remove:**
```typescript
// DELETE THIS:
export const DEFAULT_USER = "00647a8c-3e04-4f84-8e59-ef4900413931";
```

#### 2.4.2 Update Flashcard Service

**File:** `src/lib/services/flashcardService.ts` (updated)

**Change all methods to accept userId parameter:**

**Before:**
```typescript
export async function listFlashcards(
  supabase: SupabaseClient,
  page: number = 1,
  limit: number = 10
): Promise<ListUserFlashcardsResponseDTO> {
  // Uses DEFAULT_USER
}
```

**After:**
```typescript
export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ListUserFlashcardsResponseDTO> {
  // Uses provided userId
  const { data, error, count } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  // ... rest of implementation
}
```

**Apply similar changes to:**
- `createFlashcard()`
- `updateFlashcard()`
- `deleteFlashcard()`
- `getFlashcardsBySchedule()`
- All other user-specific operations

#### 2.4.3 Update API Endpoints

**Files:** All files in `src/pages/api/flashcards/`

**Change all endpoint handlers to extract userId from session:**

**Example:**
```typescript
// src/pages/api/flashcards/index.ts
export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  const result = await flashcardService.listFlashcards(
    locals.supabase,
    user.id, // Pass actual user ID
    page,
    limit
  );
  
  // ... rest of implementation
};
```

**Apply to all endpoints:**
- GET `/api/flashcards`
- POST `/api/flashcards`
- PUT `/api/flashcards/[id]`
- DELETE `/api/flashcards/[id]`
- POST `/api/flashcards/generate`
- POST `/api/flashcards/[id]/decision`

---

## 3. Authentication System

### 3.1 Supabase Auth Configuration

#### 3.1.1 Environment Variables

**File:** `.env` (add these variables)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # For admin operations (account deletion)

# Application URLs
PUBLIC_APP_URL=http://localhost:3000 # or production URL
```

**File:** `src/env.d.ts` (update)

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_APP_URL: string;
}
```

#### 3.1.2 Supabase Project Configuration

**Authentication Settings (via Supabase Dashboard):**

1. **Email Auth:**
   - Enable Email provider
   - Enable "Confirm email" (email verification required)
   - Disable "Allow duplicate emails"
   
2. **Email Templates:**
   - **Confirmation Email:**
     ```html
     <h2>Confirm your email</h2>
     <p>Follow this link to confirm your email:</p>
     <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
     ```
   
   - **Password Reset Email:**
     ```html
     <h2>Reset your password</h2>
     <p>Follow this link to reset your password:</p>
     <p><a href="{{ .SiteURL }}/reset-password?token={{ .Token }}">Reset password</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>
     ```
   
3. **Redirect URLs:**
   - Add to allowlist:
     - `http://localhost:3000/login` (development)
     - `https://yourdomain.com/login` (production)
     - `http://localhost:3000/reset-password` (development)
     - `https://yourdomain.com/reset-password` (production)

4. **Security Settings:**
   - Session timeout: 7 days
   - Refresh token lifetime: 30 days
   - JWT expiry: 3600 seconds (1 hour)
   - Password min length: 8
   - Enable password complexity requirements

5. **Rate Limiting:**
   - Login attempts: 5 per 15 minutes per IP
   - Password reset: 3 per hour per email
   - Registration: 10 per hour per IP

---

### 3.2 Session Management

#### 3.2.1 Session Storage

**Method:** HTTP-only cookies (secure, SameSite=Lax)

**Cookies:**
- `sb-access-token` - JWT access token (1 hour expiry)
- `sb-refresh-token` - Refresh token (30 days expiry)

**Benefits:**
- XSS protection (httpOnly flag)
- CSRF protection (SameSite=Lax)
- Automatic cookie management by browser
- Works with SSR (server-side rendering)

#### 3.2.2 Token Refresh Flow

**Trigger:** Access token expires (detected by middleware)

**Process:**
1. Middleware reads refresh token from cookie
2. Call `supabase.auth.setSession()` with refresh token
3. Supabase returns new access token and refresh token
4. Update cookies with new tokens
5. Continue request with valid session

**Implementation:** Handled automatically in middleware (see section 2.2.1)

#### 3.2.3 Session Termination

**Scenarios:**
- User logs out (explicit)
- User deletes account
- Tokens expire and refresh fails
- Admin revokes session (future feature)

**Process:**
1. Call `supabase.auth.signOut()`
2. Delete cookies: `sb-access-token`, `sb-refresh-token`
3. Clear any client-side state
4. Redirect to `/login`

---

### 3.3 Password Security

#### 3.3.1 Password Requirements

**Client-Side Validation:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Server-Side Enforcement:**
- Same rules enforced in API
- Supabase Auth applies additional hashing (bcrypt)

#### 3.3.2 Password Hashing

**Method:** Supabase Auth handles hashing automatically using bcrypt

**Salt Rounds:** Configured by Supabase (default: 10)

**Storage:** Passwords stored only in Supabase Auth, never in application database

#### 3.3.3 Password Reset Security

**Token Generation:**
- Supabase generates secure JWT token
- Token includes: user_id, type=recovery, expiry (1 hour)
- Signed with Supabase secret key

**Token Validation:**
- Verify JWT signature
- Check expiry timestamp
- Ensure type is 'recovery'
- One-time use (invalidated after successful reset)

**Attack Prevention:**
- Rate limiting: 3 requests per hour per email
- Always return success (don't reveal email existence)
- Tokens expire after 1 hour
- Used tokens cannot be reused

---

### 3.4 Account Deletion (GDPR Compliance)

#### 3.4.1 Data Retention Policy

**Immediate Deletion (Hard Delete):**
- User record in Supabase Auth
- Email address (PII)
- Password hash

**Soft Deletion (Anonymized Retention):**
- Flashcards: Set `deleted_at`, retain `user_id` for referential integrity
- Audit logs: Retain `user_id` but user is unidentifiable (no way to link back to email)

**Rationale:**
- Hard delete removes all personally identifiable information
- Soft deleted data is anonymized (user_id is orphaned)
- Allows analytics on aggregate data without PII
- Meets GDPR "right to be forgotten" requirements

#### 3.4.2 Deletion Process

**Steps:**
1. User initiates deletion from UI (DeleteAccountModal)
2. User confirms by typing "DELETE"
3. API validates confirmation
4. Soft delete flashcards (set deleted_at)
5. Log deletion event in audit_logs
6. Hard delete user from Supabase Auth
7. Clear session cookies
8. Redirect to goodbye page

**Database Cleanup:**
```sql
-- Soft delete flashcards
UPDATE flashcards
SET deleted_at = NOW()
WHERE user_id = '...' AND deleted_at IS NULL;

-- Supabase Auth handles user deletion
-- (no direct SQL needed, use supabase.auth.admin.deleteUser())
```

#### 3.4.3 GDPR Compliance Checklist

- [x] User can initiate account deletion from UI
- [x] Confirmation required to prevent accidental deletion
- [x] All PII removed within 30 days (immediate in MVP)
- [x] Data export capability (future: allow user to download data before deletion)
- [x] Audit trail of deletion event
- [x] No way to recover account after deletion
- [x] Terms and Privacy Policy explicitly mention deletion process

---

## 4. Data Models & Types

### 4.1 Authentication DTOs

**File:** `src/types.ts` (add these types)

```typescript
// ============================================================================
// Authentication Types
// ============================================================================

/**
 * DTO for user registration request
 */
export interface RegisterUserRequestDTO {
  email: string;
  password: string;
  acceptTerms: boolean;
}

/**
 * DTO for user registration response
 */
export interface RegisterUserResponseDTO {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * DTO for user login request
 */
export interface LoginUserRequestDTO {
  email: string;
  password: string;
}

/**
 * DTO for user login response
 */
export interface LoginUserResponseDTO {
  message: string;
  user: {
    id: string;
    email: string;
  };
  redirectTo: string;
}

/**
 * DTO for password reset request
 */
export interface ForgotPasswordRequestDTO {
  email: string;
}

/**
 * DTO for password reset response
 */
export interface ForgotPasswordResponseDTO {
  message: string;
}

/**
 * DTO for password reset confirmation request
 */
export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

/**
 * DTO for password reset confirmation response
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * DTO for account deletion request
 */
export interface DeleteAccountRequestDTO {
  confirmationText: string;
}

/**
 * DTO for account deletion response
 */
export interface DeleteAccountResponseDTO {
  message: string;
}

/**
 * Generic error response DTO
 */
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string[] | string>;
}

/**
 * User info extracted from session
 */
export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}
```

---

### 4.2 Database Schema Changes

**Note:** Supabase Auth manages the `auth.users` table automatically. No custom users table needed.

**Existing Tables:**
- `flashcards` - Already has `user_id` column (references auth.users.id)
- `audit_logs` - Already has `user_id` column (nullable)

**No schema migrations required** - existing structure supports authentication.

**Foreign Key Consideration:**
- `flashcards.user_id` should reference `auth.users.id`
- However, Supabase Auth tables are in a separate schema
- Use application-level constraint checking instead of DB foreign key

---

### 4.3 Validation Schemas

**File:** `src/lib/validation/authSchemas.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Reusable Field Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const simplePasswordSchema = z
  .string()
  .min(1, 'Password is required');

// ============================================================================
// Form Schemas
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms and conditions to register',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const deleteAccountSchema = z.object({
  confirmationText: z.literal('DELETE', {
    errorMap: () => ({
      message: 'Please type DELETE to confirm account deletion',
    }),
  }),
});

// ============================================================================
// Type Inference
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
```

---

## 5. Security Considerations

### 5.1 OWASP Top 10 Compliance

#### 5.1.1 A01 - Broken Access Control

**Mitigation:**
- Middleware enforces authentication on all protected routes
- API endpoints validate user session
- User can only access their own data (user_id check in queries)
- Admin operations require service role key (environment variable)

#### 5.1.2 A02 - Cryptographic Failures

**Mitigation:**
- HTTPS enforced (redirect HTTP to HTTPS in production)
- Passwords hashed with bcrypt (handled by Supabase)
- Session tokens are JWTs (signed and encrypted)
- Cookies marked as Secure, HttpOnly, SameSite=Lax

#### 5.1.3 A03 - Injection

**Mitigation:**
- All queries use Supabase client (parameterized queries)
- No raw SQL exposed to user input
- Zod validation on all inputs
- Content-Type validation on API endpoints

#### 5.1.4 A07 - Identification and Authentication Failures

**Mitigation:**
- Strong password requirements enforced
- Rate limiting on login attempts (5 per 15 minutes)
- Session timeout (7 days with refresh)
- Logout invalidates session tokens
- No user enumeration (generic error messages)

#### 5.1.5 A05 - Security Misconfiguration

**Mitigation:**
- Environment variables for sensitive config
- No credentials in source code
- Error messages don't reveal stack traces in production
- Supabase RLS (Row Level Security) policies enabled

---

### 5.2 Rate Limiting Strategy

#### 5.2.1 Endpoint Limits

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|------------------|
| POST /api/auth/login | 5 attempts | 15 minutes | Return 429, display "Too many attempts" |
| POST /api/auth/register | 10 attempts | 1 hour | Return 429, display "Too many registrations" |
| POST /api/auth/forgot-password | 3 attempts | 1 hour | Return 429, display "Too many requests" |
| POST /api/auth/reset-password | 5 attempts | 1 hour | Return 429, display "Too many attempts" |

#### 5.2.2 Implementation

**Method:** Audit logs + time-based queries

**Example:**
```typescript
async function checkRateLimit(
  supabase: SupabaseClient,
  action: string,
  identifier: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('action', `${action}:${identifier}`)
    .gte('occurred_at', windowStart);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Fail open
  }
  
  return (data?.length || 0) < limit;
}
```

**Future Enhancement:** Use Redis for distributed rate limiting in production.

---

### 5.3 XSS and CSRF Protection

#### 5.3.1 XSS Prevention

**Measures:**
- React escapes all user inputs by default
- No `dangerouslySetInnerHTML` usage in auth components
- Content-Security-Policy header (future)
- HttpOnly cookies prevent JS access to tokens

#### 5.3.2 CSRF Prevention

**Measures:**
- SameSite=Lax on cookies
- State-changing operations require POST (not GET)
- Custom CSRF token in forms (future enhancement)
- Supabase validates origin header

---

### 5.4 Data Privacy (GDPR)

#### 5.4.1 User Rights

**Implemented:**
- Right to access: User can view their data (flashcards list)
- Right to rectification: User can edit flashcards
- Right to erasure: User can delete account
- Right to be informed: Terms and Privacy Policy

**Future:**
- Right to data portability: Export all data as JSON
- Right to restrict processing: Pause account without deletion

#### 5.4.2 Legal Pages

**Required Pages:**

**Terms of Service** (`/legal/terms`)
- Account creation and usage terms
- User responsibilities
- Termination conditions
- Limitation of liability
- Governing law

**Privacy Policy** (`/legal/privacy`)
- Data collected (email, flashcards, usage analytics)
- Purpose of data collection
- Data storage and security
- Third-party services (Supabase, hosting)
- User rights (access, rectification, erasure)
- Cookie usage
- Contact information for data requests

**Implementation:**
- Static Astro pages with markdown content
- Links in footer of all auth pages
- Required checkbox on registration form

---

## 6. Migration Strategy

### 6.1 Phased Implementation

#### Phase 1: Core Authentication (Week 1)
- [ ] Create auth API endpoints (register, login, logout)
- [ ] Implement auth service layer
- [ ] Create auth form components (LoginForm, RegisterForm)
- [ ] Build auth pages (login, register)
- [ ] Update middleware for session management
- [ ] Test registration and login flow

#### Phase 2: Session Management (Week 1)
- [ ] Implement token refresh in middleware
- [ ] Add route protection logic
- [ ] Create AppLayout with navigation
- [ ] Update existing pages to use AppLayout
- [ ] Test session expiration and refresh

#### Phase 3: Password Recovery (Week 2)
- [ ] Implement forgot-password API endpoint
- [ ] Implement reset-password API endpoint
- [ ] Create ForgotPasswordForm and ResetPasswordForm components
- [ ] Build forgot-password and reset-password pages
- [ ] Configure Supabase email templates
- [ ] Test email delivery and reset flow

#### Phase 4: Account Deletion (Week 2)
- [ ] Implement delete-account API endpoint
- [ ] Create DeleteAccountModal component
- [ ] Add delete account button to user menu
- [ ] Update UserMenu component
- [ ] Test deletion flow and GDPR compliance

#### Phase 5: Migration & Cleanup (Week 2-3)
- [ ] Remove DEFAULT_USER constant
- [ ] Update flashcard service to use userId parameter
- [ ] Update all flashcard API endpoints
- [ ] Migrate existing test data (assign to test user)
- [ ] Update all React components to pass userId
- [ ] Test all flashcard operations with real users

#### Phase 6: Security Hardening (Week 3)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add audit logging for all auth events
- [ ] Configure HTTPS redirect in production
- [ ] Review and test error messages (no info leakage)
- [ ] Conduct security audit (manual testing)

#### Phase 7: Legal & Compliance (Week 3)
- [ ] Write Terms of Service
- [ ] Write Privacy Policy
- [ ] Create legal pages (/legal/terms, /legal/privacy)
- [ ] Add cookie consent banner (if required by jurisdiction)
- [ ] Test account deletion GDPR compliance

---

### 6.2 Data Migration

#### 6.2.1 Existing Flashcard Data

**Current State:**
- Flashcards exist with `user_id = DEFAULT_USER`

**Migration Options:**

**Option A: Delete Test Data**
- Simple, clean start
- Suitable if no production users exist yet

**Option B: Assign to Test User**
- Create a test user account
- Update `user_id` for existing flashcards
- Suitable for preserving test data

**SQL Migration (Option B):**
```sql
-- Create test user in Supabase Auth first via UI or API
-- Then update flashcards:

UPDATE flashcards
SET user_id = 'new-test-user-id'
WHERE user_id = '00647a8c-3e04-4f84-8e59-ef4900413931';
```

#### 6.2.2 Rollback Plan

**If migration fails:**
1. Revert middleware changes (restore PUBLIC access)
2. Restore DEFAULT_USER constant
3. Revert flashcard service changes
4. Keep auth pages but don't enforce protection
5. Debug issues in staging environment
6. Re-attempt migration after fixes

---

### 6.3 Testing Strategy

#### 6.3.1 Manual Testing Checklist

**Registration:**
- [ ] Can register with valid email and password
- [ ] Cannot register with invalid email format
- [ ] Cannot register with weak password
- [ ] Cannot register without accepting terms
- [ ] Cannot register with duplicate email
- [ ] Receives confirmation email (if email verification enabled)

**Login:**
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] Cannot login with non-existent email
- [ ] Redirects to dashboard after successful login
- [ ] Redirects to intended page if `redirect` param exists
- [ ] Session persists across page refreshes

**Logout:**
- [ ] Can logout from user menu
- [ ] Redirects to login page after logout
- [ ] Cannot access protected pages after logout
- [ ] Session cookies are cleared

**Password Reset:**
- [ ] Can request password reset
- [ ] Receives reset email (check inbox)
- [ ] Reset link works and loads reset-password page
- [ ] Can set new password with valid token
- [ ] Cannot reuse expired or used token
- [ ] Can login with new password after reset

**Account Deletion:**
- [ ] Can initiate account deletion from user menu
- [ ] Must type "DELETE" to confirm
- [ ] All flashcards are soft deleted
- [ ] User is logged out after deletion
- [ ] Cannot login with deleted account credentials
- [ ] Audit log records deletion event

**Session Management:**
- [ ] Session expires after configured timeout
- [ ] Session is automatically refreshed when active
- [ ] Accessing protected page while logged out redirects to login
- [ ] Accessing login while logged in redirects to dashboard

**Rate Limiting:**
- [ ] 5 failed login attempts trigger rate limit (15 min block)
- [ ] 3 password reset requests trigger rate limit (1 hour block)
- [ ] Rate limit message is displayed correctly

#### 6.3.2 Automated Testing

**Unit Tests:**
- Auth service methods (register, login, etc.)
- Validation schemas (Zod)
- Password strength calculation
- Rate limiting logic

**Integration Tests:**
- API endpoint responses
- Middleware session validation
- Database queries with user_id filter
- Email delivery (mock)

**E2E Tests (Future):**
- Full registration flow
- Full login flow
- Password reset flow
- Account deletion flow

---

### 6.4 Deployment Checklist

**Pre-Deployment:**
- [ ] Environment variables configured in production
- [ ] Supabase project configured (auth settings, email templates)
- [ ] HTTPS enabled on hosting
- [ ] Legal pages published (terms, privacy)
- [ ] Email sending configured and tested (Supabase SMTP)

**Deployment:**
- [ ] Deploy backend code (API routes, middleware)
- [ ] Deploy frontend code (auth pages, components)
- [ ] Run database migrations (if any)
- [ ] Test auth flow in production environment

**Post-Deployment:**
- [ ] Monitor error logs for auth failures
- [ ] Monitor audit logs for unusual activity
- [ ] Test all user stories (US-001 through US-004)
- [ ] Conduct security review
- [ ] Announce new auth system to users (if applicable)

**Rollback Procedure:**
- Keep previous deployment available
- If critical issues found, revert to previous version
- Disable auth requirement temporarily if needed
- Fix issues in staging, re-deploy

---

## 7. Appendix

### 7.1 File Structure Summary

**New Files:**
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   └── DeleteAccountModal.tsx
│   ├── ui/
│   │   ├── PasswordStrengthIndicator.tsx
│   │   └── FormField.tsx
│   ├── AppNavigation.astro
│   └── UserMenu.tsx
├── layouts/
│   ├── AuthLayout.astro
│   └── AppLayout.astro
├── lib/
│   ├── services/
│   │   └── authService.ts
│   └── validation/
│       └── authSchemas.ts
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── register.ts
│   │       ├── login.ts
│   │       ├── logout.ts
│   │       ├── forgot-password.ts
│   │       ├── reset-password.ts
│   │       └── delete-account.ts
│   ├── legal/
│   │   ├── terms.astro
│   │   └── privacy.astro
│   ├── login.astro
│   ├── register.astro
│   ├── forgot-password.astro
│   └── reset-password.astro
```

**Modified Files:**
```
src/
├── middleware/
│   └── index.ts (enhanced with session validation)
├── db/
│   └── supabase.client.ts (remove DEFAULT_USER)
├── lib/
│   └── services/
│       ├── flashcardService.ts (add userId parameter)
│       └── auditLogService.ts (add auth events)
├── pages/
│   ├── dashboard.astro (use AppLayout, pass userId)
│   ├── generate.astro (use AppLayout)
│   ├── accept.astro (use AppLayout)
│   └── flashcards/
│       ├── index.astro (use AppLayout)
│       └── new.astro (use AppLayout)
├── env.d.ts (add Locals interface)
└── types.ts (add auth DTOs)
```

---

### 7.2 API Reference Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/login` | No | Authenticate user and create session |
| POST | `/api/auth/logout` | Yes | End user session |
| POST | `/api/auth/forgot-password` | No | Request password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| POST | `/api/auth/delete-account` | Yes | Delete user account (GDPR) |

---

### 7.3 User Flow Diagrams

#### 7.3.1 Registration Flow

```
User visits /register
  ↓
Fills form (email, password, confirm, accept terms)
  ↓
Submits form → POST /api/auth/register
  ↓
Server validates input
  ↓
[Success] → Creates user in Supabase Auth
  ↓
Sends confirmation email (if enabled)
  ↓
Returns success response
  ↓
Frontend shows success message
  ↓
Redirects to /login after 2 seconds
  ↓
User logs in
```

#### 7.3.2 Login Flow

```
User visits /login (or redirected from protected page)
  ↓
Fills form (email, password)
  ↓
Submits form → POST /api/auth/login
  ↓
Server validates credentials with Supabase Auth
  ↓
[Success] → Creates session
  ↓
Sets session cookies (access + refresh tokens)
  ↓
Logs event in audit_logs
  ↓
Returns success response
  ↓
Frontend redirects to dashboard (or redirect param)
  ↓
Middleware validates session on subsequent requests
```

#### 7.3.3 Password Reset Flow

```
User visits /login → clicks "Forgot password?"
  ↓
Redirects to /forgot-password
  ↓
Fills form (email)
  ↓
Submits form → POST /api/auth/forgot-password
  ↓
Server calls Supabase resetPasswordForEmail()
  ↓
Supabase sends email with reset link
  ↓
Frontend shows success message (always, for security)
  ↓
User checks email → clicks reset link
  ↓
Link opens /reset-password?token=...
  ↓
User fills form (new password, confirm)
  ↓
Submits form → POST /api/auth/reset-password
  ↓
Server validates token and updates password
  ↓
[Success] → Invalidates old sessions
  ↓
Returns success response
  ↓
Frontend shows success message
  ↓
Redirects to /login after 2 seconds
  ↓
User logs in with new password
```

#### 7.3.4 Account Deletion Flow

```
User logged in → opens user menu
  ↓
Clicks "Delete Account"
  ↓
DeleteAccountModal opens
  ↓
User reads warning → types "DELETE"
  ↓
Clicks "Delete Account" button
  ↓
POST /api/auth/delete-account
  ↓
Server validates confirmation text
  ↓
Soft deletes all user flashcards
  ↓
Logs deletion event in audit_logs
  ↓
Hard deletes user from Supabase Auth
  ↓
Clears session cookies
  ↓
Returns success response
  ↓
Frontend redirects to goodbye page
  ↓
User cannot log in again (account gone)
```

---

### 7.4 Environment Configuration

**Development (.env.development):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Production (.env.production):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**Astro Config (astro.config.mjs):**
- No changes required
- Existing server output mode supports auth
- Middleware runs on all requests

---

## Document End

This technical specification provides a comprehensive blueprint for implementing the authentication system in WordRepeater AI. All components, flows, and security measures are designed to integrate seamlessly with the existing Astro 5 + Supabase architecture while meeting the requirements outlined in US-001, US-002, US-003, and US-004.

**Next Steps:**
1. Review specification with team
2. Estimate implementation time (suggested: 3 weeks)
3. Begin Phase 1 implementation
4. Conduct code reviews at each phase
5. Deploy to staging for testing
6. Deploy to production after successful testing

**Contact for Questions:**
- Technical clarifications: Review this document
- PRD questions: Refer to `.ai/prd.md`
- Implementation support: Team lead or senior developer

