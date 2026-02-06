# Giterdone API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
Most endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### User Registration
**POST** `/auth/register/`

Register a new user with either password or passkey authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "auth_method": "password",  // or "passkey"
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "auth_method": "password",
    "totp_enabled": false,
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  },
  "tokens": {
    "refresh": "...",
    "access": "..."
  },
  "message": "User registered successfully."
}
```

---

### Password Login
**POST** `/auth/login/password/`

Login with email and password. Include TOTP code if 2FA is enabled.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "totp_code": "123456"  // Optional, required if TOTP enabled
}
```

**Response (200):**
```json
{
  "user": { ... },
  "tokens": {
    "refresh": "...",
    "access": "..."
  },
  "message": "Login successful."
}
```

---

### Passkey Login
**POST** `/auth/login/passkey/`

Login with passkey (WebAuthn).

**Request Body:**
```json
{
  "email": "user@example.com",
  "credential_response": { ... }
}
```

**Response (200):**
```json
{
  "user": { ... },
  "tokens": {
    "refresh": "...",
    "access": "..."
  },
  "message": "Login successful."
}
```

---

### Refresh Token
**POST** `/auth/token/refresh/`

Get a new access token using the refresh token.

**Request Body:**
```json
{
  "refresh": "..."
}
```

**Response (200):**
```json
{
  "access": "...",
  "refresh": "..."  // New refresh token (rotation enabled)
}
```

---

### User Profile
**GET** `/auth/profile/` 🔒

Get the authenticated user's profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "auth_method": "password",
  "totp_enabled": false,
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

---

## TOTP 2FA Endpoints

### Enroll TOTP
**POST** `/auth/totp/enroll/` 🔒

Generate TOTP secret and QR code for enrollment.

**Response (200):**
```json
{
  "qr_code": "data:image/png;base64,...",
  "secret": "BASE32SECRET",
  "message": "Scan the QR code with your authenticator app, then verify with a code."
}
```

---

### Verify TOTP
**POST** `/auth/totp/verify/` 🔒

Verify and enable TOTP 2FA.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "TOTP 2FA enabled successfully."
}
```

---

### Disable TOTP
**POST** `/auth/totp/disable/` 🔒

Disable TOTP 2FA after verification.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "TOTP 2FA disabled successfully."
}
```

---

## Account Recovery Endpoints

### Request Account Recovery
**POST** `/auth/recovery/request/`

Request account recovery link (works for both password and passkey accounts).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, a recovery link has been sent."
}
```

---

### Confirm Account Recovery
**POST** `/auth/recovery/confirm/`

Confirm account recovery and set new authentication method.

**Request Body:**
```json
{
  "token": "recovery_token",
  "new_auth_method": "password",  // or "passkey"
  "password": "NewPassword123!",  // Required if new_auth_method is "password"
  "password_confirm": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Account recovered. Authentication method set to password.",
  "user": { ... }
}
```

---

### Enroll Passkey
**POST** `/auth/passkey/enroll/` 🔒

Enroll a passkey credential (WebAuthn).

**Request Body:**
```json
{
  "credential_response": { ... }
}
```

**Response (200):**
```json
{
  "message": "Passkey enrolled successfully."
}
```

---

## Todo Endpoints

### List Todos
**GET** `/todos/` 🔒

Get all todos for the authenticated user, sorted by priority (descending) then created_at (descending).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Complete project",
    "description": "Finish the Giterdone application",
    "completed": false,
    "priority": 10,
    "due_date": "2026-02-01T10:00:00Z",
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  }
]
```

---

### Create Todo
**POST** `/todos/` 🔒

Create a new todo.

**Request Body:**
```json
{
  "title": "Complete project",
  "description": "Finish the Giterdone application",
  "priority": 10,
  "due_date": "2026-02-01T10:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Complete project",
  "description": "Finish the Giterdone application",
  "completed": false,
  "priority": 10,
  "due_date": "2026-02-01T10:00:00Z",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

---

### Get Todo
**GET** `/todos/{id}/` 🔒

Retrieve a specific todo by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Complete project",
  "description": "Finish the Giterdone application",
  "completed": false,
  "priority": 10,
  "due_date": "2026-02-01T10:00:00Z",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

---

### Update Todo
**PATCH** `/todos/{id}/` 🔒

Update a todo (partial update).

**Request Body:**
```json
{
  "completed": true,
  "priority": 5
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Complete project",
  "description": "Finish the Giterdone application",
  "completed": true,
  "priority": 5,
  "due_date": "2026-02-01T10:00:00Z",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:30:00Z"
}
```

---

### Delete Todo
**DELETE** `/todos/{id}/` 🔒

Delete a todo.

**Response (200):**
```json
{
  "message": "Todo deleted successfully."
}
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "error": "Error message",
  "field_name": ["Field-specific error"]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

---

## Notes

🔒 = Requires authentication (JWT token)

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all IDs
- Priority is an integer (higher = higher priority)
- Todos are automatically sorted by priority (descending) then created_at (descending)
- Each user can only access their own todos
