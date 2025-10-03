## Authentication Flow

1. **Send OTP**  
   - User sends email via `/sendOTP`.  
   - System validates email and sends OTP.  
   - OTP session token is saved in an HttpOnly cookie `otpSession` (10 min expiry).  

2. **Verify OTP**  
   - User submits OTP via `/verifyOTP`.  
   - System validates OTP and checks if user exists.  
     - **If exists**: generates **authToken** (15 min) and **refreshToken** (7 days) in cookies.  
     - **If not exists**: generates a short-lived `verifiedEmail` token (1 hour) for registration.  

3. **Register User**  
   - User fills registration form via `/registerUser`.  
   - System verifies `verifiedEmail` token, creates new user (`Student` or `Member`), and generates **authToken** + **refreshToken** cookies.  

4. **Check Login**  
   - `/checkLogin` checks `authToken` cookie and returns user info if valid.  
   - Returns `loggedIn: false` if token is missing, invalid, or user does not exist.  

5. **Logout**  
   - `/logoutUser` clears `authToken` and `refreshToken` cookies.  

---

## Endpoints & Status Codes

| Endpoint            | Method | Success Response | Failure Response |
|--------------------|--------|----------------|----------------|
| `/sendOTP`          | POST   | 200 `{ success: true, message: "OTP sent successfully" }` | 400/500 with `success: false` |
| `/verifyOTP`        | POST   | 200 `{ success: true, userExists: true/false, redirectTo: "/homepage" or "/register" }` | 400/500 with `success: false` |
| `/registerUser`     | POST   | 201 `{ success: true, user, redirectTo: "/homepage" }` | 400/500 with `success: false` |
| `/checkLogin`       | GET    | 200 `{ loggedIn: true, user, role, redirectTo: "/homepage" }` | 200 `{ loggedIn: false }` |
| `/logoutUser`       | POST   | 200 `{ success: true, message: "Logged out successfully" }` | N/A |

---

## Token Management

- **OTP Session Token** (`otpSession`): short-lived (10 min) token to validate email during OTP verification.  
- **Verified Email Token** (`verifiedEmail`): short-lived (1 hour) token for users who completed OTP verification but are yet to register.  
- **Auth Token** (`authToken`): JWT for authenticated session, stored in HttpOnly cookie, expires in 15 days.  
- **Refresh Token** (`refreshToken`): JWT to refresh auth token without logging in again, expires in 7 days.  

**Refresh Token Flow:**  
- If `authToken` expires, the client can call the refresh endpoint (`/refreshAccessToken`) with the `refreshToken` cookie.  
- If valid, a new `authToken` (and optionally a new `refreshToken`) is generated.  

---

## Cookies

| Cookie Name      | Purpose                                    | HttpOnly | Max Age       |
|-----------------|--------------------------------------------|----------|--------------|
| `otpSession`     | OTP session validation                     | Yes      | 10 min       |
| `verifiedEmail`  | Allow registration after OTP              | Yes      | 1 hour       |
| `authToken`      | Authenticated session                     | Yes      | 15 days      |
| `refreshToken`   | Refresh expired authToken                 | Yes      | 7 days       |

Authentication Flow Diagram
flowchart TD
    A[User enters email] --> B[POST /sendOTP]
    B --> C[Validate email]
    C -->|Valid| D[Send OTP via email]
    D --> E[Set otpSession cookie (10m)]
    C -->|Invalid| F[Return 400]

    E --> G[User enters OTP]
    G --> H[POST /verifyOTP]
    H --> I[Validate OTP]
    I -->|OTP valid & user exists| J[Generate authToken + refreshToken]
    I -->|OTP valid & user does NOT exist| K[Generate verifiedEmail token (1h)]
    I -->|OTP invalid| L[Return 400]

    J --> M[Set authToken + refreshToken cookies]
    K --> N[Redirect to /register]
    M --> O[Redirect to /homepage]

Token Lifecycle Diagram
flowchart TD
    A[otpSession] -->|10 min expiry| B[Expires or Verified]
    B -->|OTP verified| C[authToken + refreshToken set]
    C --> D[authToken: 15 days]
    C --> E[refreshToken: 7 days]
    D -->|authToken expires| F[Use refreshToken to get new authToken]
    E -->|refreshToken expires| G[User must login again]
    B -->|User registers| H[verifiedEmail token: 1h]
    H --> I[User completes registration]
    I --> C[authToken + refreshToken issued]



---

## Notes

- `role` is always required (`student` or `member`).  
- All email input is validated to ensure **institute domain only**.  
- Passwords are not used in this flow (OTP-based login).  
- Profile image is optional during registration; a default can be used.  

---

## Status Codes Summary

- **200 OK**: Success responses (OTP sent, user logged in, etc.)  
- **201 Created**: Successful registration  
- **400 Bad Request**: Missing or invalid input  
- **401 Unauthorized**: Token invalid or expired  
- **500 Internal Server Error**: Server issues, OTP send failure, DB errors  


# 💬 Social Content Schema & Relationships

This document outlines the core data structure (schemas) and the relationships between them for managing user-generated content, comments, and likes.

---



## 1. Post Schema

A **Post** represents the primary content created by a user.

| Field | Type | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `_id` | **String** | **Unique identifier for the Post.** | `P123` |
| `author` | **Reference (User)** | The user who created the post. | (User Object ID) |
| `content` | String | The main text content of the post. | `"Excited to share my first blog!"` |
| `attachments` | Array (String/URL) | Optional links to images, videos, or files. | `["url/img1.jpg", "url/vid2.mp4"]` |

---

## 2. Comment Schema

A **Comment** is content specifically attached to a Post.

| Field | Type | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `_id` | **String** | **Unique identifier for the Comment.** | `C456` |
| `postId` | **String** | **References the `_id` of the Post** this comment belongs to. | `P123` |
| `author` | **Reference (User)** | The user who wrote the comment. | (User Object ID) |
| `content` | String | The text content of the comment. | `"Awesome work! Keep it up."` |

---

## 3. Like Schema (Polymorphic Association)

A **Like** can be associated with *either* a Post or a Comment, using a **polymorphic association** pattern.

| Field | Type | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `user` | **Reference (User)** | The user who registered the like. | (User Object ID) |
| `targetType` | **String** | **Defines what content was liked** (`"Post"` or `"Comment"`). | `"Post"` or `"Comment"` |
| `targetId` | **String** | The `_id` of the Post or Comment that was liked. **Must match the `targetType`**. | `P123` or `C456` |

---

## 4. How They Work Together

| Action | Example | Schema(s) Used | Relationship Mechanism |
| :--- | :--- | :--- | :--- |
| **User A creates a Post** | Post is saved with `_id = P123` | **Post** | Unique identifier created. |
| **User B comments on the Post** | Comment is saved with `postId = P123` | **Comment** | Links the Comment directly to the Post. |
| **User C likes the Post** | Like is saved with `targetType = "Post"` and `targetId = P123` | **Like** | Links the Like to the Post. |
| **User D likes a Comment** | Comment has `_id = C456`. Like is saved with `targetType = "Comment"` and `targetId = C456` | **Like** | Links the Like to the Comment. |