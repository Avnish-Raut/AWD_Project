# API Description — Smart Event Management Platform
**Base URL:** `http://localhost:3000/api`  
**Auth:** JWT Bearer Token (obtained from `/auth/login`)

---

## Table of Contents
1. [Auth](#1-auth)
2. [Events](#2-events)
3. [Registrations](#3-registrations-inside-events)
4. [How to Test with Postman](#4-how-to-test-with-postman)

---

## 1. Auth

### POST `/auth/register`
Create a new user account.

- **Auth:** Public
- **Body:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123",
  "role": "ORG"
}
```
> `role` is optional. Accepted values: `USER` (default), `ORG`. `ADMIN` cannot be self-registered.

- **Response `201`:**
```json
{ "message": "User registered", "user_id": 1 }
```
- **Errors:** `409` email already registered

---

### POST `/auth/login`
Login and receive a JWT token.

- **Auth:** Public
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
- **Response `200`:**
```json
{ "access_token": "<JWT>" }
```
- **Errors:** `401` invalid credentials

> Use this token as `Authorization: Bearer <token>` on all protected endpoints.

---

## 2. Events

### GET `/events`
List all published, non-cancelled events.

- **Auth:** Public
- **Query Params:** `?search=keyword` — filters by title, description, or location
- **Response `200`:** Array of events with organizer info and registration count

---

### GET `/events/:id`
Get details of a single event.

- **Auth:** Public
- **Response `200`:** Event object
- **Errors:** `404` event not found

---

### POST `/events`
Create a new event.

- **Auth:** ORG only
- **Body:**
```json
{
  "title": "Tech Talk 2026",
  "description": "A deep dive into modern web development.",
  "event_date": "2026-03-15T18:00:00.000Z",
  "location": "Room A101",
  "capacity": 30
}
```
> `description` is optional. Event is created as unpublished by default.

- **Response `201`:** Created event object
- **Errors:** `401` no token, `403` not an organizer

---

### GET `/events/my/events`
List all events created by the logged-in organizer (all statuses).

- **Auth:** ORG only
- **Response `200`:** Array of own events with registration count

---

### PATCH `/events/:id`
Update event details. All fields are optional.

- **Auth:** ORG (own event only)
- **Body (all optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "event_date": "2026-03-20T18:00:00.000Z",
  "location": "New Location",
  "capacity": 50
}
```
- **Response `200`:** Updated event object
- **Errors:** `403` not your event, `400` event is cancelled, `404` not found

---

### PATCH `/events/:id/publish`
Publish an event so participants can see and register for it.

- **Auth:** ORG (own event only)
- **Body:** None
- **Response `200`:** Updated event object with `is_published: true`
- **Errors:** `403` not your event, `400` event is cancelled

---

### GET `/events/:id/participants`
View the confirmed participant list for an event.

- **Auth:** ORG (own event only)
- **Response `200`:**
```json
[
  {
    "reg_id": 1,
    "registered_at": "2026-03-02T10:00:00.000Z",
    "status": "CONFIRMED",
    "user": { "user_id": 2, "username": "john", "email": "john@example.com" }
  }
]
```
- **Errors:** `403` not your event

---

### DELETE `/events/:id`
Cancel an event (sets `is_cancelled: true`, unpublishes it).

- **Auth:** ORG (own event) or ADMIN (any event)
- **Body:** None
- **Response `200`:** Updated event object
- **Errors:** `403` not authorised, `400` already cancelled

---

## 3. Registrations (inside Events)

### POST `/events/:id/register`
Register the logged-in user for a published event.

- **Auth:** Any logged-in user
- **Body:** None
- **Response `201`:** Registration object
- **Errors:**
  - `400` event not published
  - `400` event is cancelled
  - `400` event is fully booked (capacity reached)
  - `409` already registered

---

### DELETE `/events/:id/register`
Cancel the logged-in user's registration for an event.

- **Auth:** Any logged-in user
- **Body:** None
- **Response `200`:** Updated registration with `status: CANCELLED`
- **Errors:** `404` no active registration found

---

## Requirements Covered

| Requirement | Feature |
|---|---|
| R11 | Event creation |
| R12 | Registration cancellation |
| R13 | Event listing |
| R14 | Event registration |
| R15 | Capacity enforcement |
| R21 | Event cancellation (Admin/Organizer) |
| R24 | Participant list |
| R30 | Event editing |
| R33 | Event search (`?search=`) |

---

## 4. How to Test with Postman

### Step 1 — Setup Collection Variables

1. Open Postman → create a collection called **AWD-Project**
2. Go to the collection → **Variables** tab → add:

| Variable | Initial Value |
|---|---|
| `baseUrl` | `http://localhost:3000/api` |
| `orgToken` | *(leave empty)* |
| `participantToken` | *(leave empty)* |

---

### Step 2 — Auto-save Tokens on Login

On each login request, go to **Scripts → Post-response** and paste the corresponding script:

**Org Login:**
```javascript
pm.collectionVariables.set("orgToken", pm.response.json().access_token);
```

**Participant Login:**
```javascript
pm.collectionVariables.set("participantToken", pm.response.json().access_token);
```

---

### Step 3 — Set Authorization on Protected Requests

For each protected request:
1. Click **Authorization** tab
2. Set **Auth Type** → `Bearer Token`
3. Set **Token** → `{{orgToken}}` or `{{participantToken}}`

---

### Step 4 — Test Flow (in order)

```
1.  POST /auth/register        → Register organizer (role: "ORG")
2.  POST /auth/register        → Register participant (no role)
3.  POST /auth/login           → Login as organizer  → saves {{orgToken}}
4.  POST /auth/login           → Login as participant → saves {{participantToken}}
5.  POST /events               → Create event        [orgToken]
6.  GET  /events/my/events     → View own events     [orgToken]
7.  PATCH /events/1/publish    → Publish event       [orgToken]
8.  GET  /events               → Browse events       [public]
9.  GET  /events?search=tech   → Search events       [public]
10. GET  /events/1             → View event detail   [public]
11. PATCH /events/1            → Update event        [orgToken]
12. POST /events/1/register    → Register            [participantToken]
13. GET  /events/1/participants → View participants  [orgToken]
14. DELETE /events/1/register  → Cancel registration [participantToken]
15. DELETE /events/1           → Cancel event        [orgToken]
```

---

### Step 5 — Test Error Cases

| Test | Expected |
|---|---|
| Create event with `participantToken` | `403 Forbidden` |
| Register for unpublished event | `400 Bad Request` |
| Register twice for same event | `409 Conflict` |
| Register for cancelled event | `400 Bad Request` |
| Update another organizer's event | `403 Forbidden` |
| Access protected route without token | `401 Unauthorized` |

---

### Notes

- All `POST`/`PATCH` requests need **Body → raw → JSON** in Postman
- The `event_date` field must be a valid ISO 8601 string, e.g. `"2026-03-15T18:00:00.000Z"`
- Make sure the backend is running (`npm run start:dev`) before testing
- To assign `ADMIN` role, update directly in the database:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```
