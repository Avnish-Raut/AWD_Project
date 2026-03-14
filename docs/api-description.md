# API Description — Smart Event Management Platform
**Base URL:** `http://localhost:3000/api`  
**Auth:** JWT Bearer Token (obtained from `/auth/login`)

---

## Table of Contents
1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Events](#3-events)
4. [Files](#4-files)
5. [Registrations](#5-registrations)
6. [Reports](#6-reports)
7. [Logs](#7-logs)
8. [Statistics](#8-statistics)

---

## 1. Auth

### POST `/auth/register`
Create a new user account.
- **Auth:** Public
- **Body:** `{ "username": "john", "email": "john@example.com", "password": "secret123", "role": "ORG" }`

### POST `/auth/login`
Login and receive a JWT token.
- **Auth:** Public
- **Body:** `{ "email": "john@example.com", "password": "secret123" }`
- **Response:** `{ "access_token": "<JWT>" }`

### POST `/auth/forgot-password`
Request a password reset email.
- **Auth:** Public
- **Body:** `{ "email": "john@example.com" }`

### POST `/auth/reset-password`
Reset password using token.
- **Auth:** Public
- **Body:** `{ "token": "<token>", "password": "newpassword123" }`

### GET `/auth/profile`
Get the current logged-in user's authentication profile.
- **Auth:** Any logged-in user

---

## 2. Users

### GET `/users/me`
Get the full profile details of the currently logged-in user.
- **Auth:** Any logged-in user

### PATCH `/users/me`
Update the logged-in user's profile information.
- **Auth:** Any logged-in user
- **Body:** `{ "username": "new_name", "phone": "12345" }` *(all fields optional)*

### POST `/users/me/avatar`
Upload a profile picture (max 5MB).
- **Auth:** Any logged-in user
- **Body:** `multipart/form-data` with `file` field.

### DELETE `/users/me/avatar`
Remove the currently uploaded profile picture.
- **Auth:** Any logged-in user

### DELETE `/users/me`
Permanently delete/deactivate the logged-in user's account.
- **Auth:** Any logged-in user

### GET `/users`
List all users with optional pagination and searching.
- **Auth:** ADMIN only
- **Query Params:** `?search=term&skip=0&take=10`

### GET `/users/:id`
Get a specific user's details.
- **Auth:** ADMIN only

### PATCH `/users/:id/role`
Update a specific user's role.
- **Auth:** ADMIN only
- **Body:** `{ "role": "ADMIN" | "ORG" | "USER" }`

### DELETE `/users/:id`
Deactivate (soft-delete) a specific user.
- **Auth:** ADMIN only

### POST `/users/:id/reactivate`
Reactivate a soft-deleted user.
- **Auth:** ADMIN only

---

## 3. Events

### GET `/events/admin/list`
List all events without scope restrictions (including drafts/cancelled).
- **Auth:** ADMIN only
- **Query Params:** `?search=&skip=&take=`

### GET `/events`
List all published, non-cancelled events.
- **Auth:** Public
- **Query Params:** `?search=&location=&date_from=&date_to=`

### GET `/events/:id`
Get details of a single event.
- **Auth:** Public

### POST `/events`
Create a new event.
- **Auth:** ORG only
- **Body:** `{ "title": "Tech Talk", "description": "Desc", "event_date": "2026-03-15T18:00:00.000Z", "location": "Room A101", "capacity": 30 }`

### GET `/events/my/events`
List all events created by the logged-in organizer.
- **Auth:** ORG only

### GET `/events/my/user-events`
List all events the logged-in participant is registered for.
- **Auth:** USER only

### PATCH `/events/:id`
Update an event's details.
- **Auth:** ORG only (own event)

### PATCH `/events/:id/publish`
Publish an event to public view.
- **Auth:** ORG only (own event)

### DELETE `/events/:id`
Cancel an event (Admin or Organizer of the event).
- **Auth:** ORG (own) or ADMIN

### GET `/events/:id/participants`
View the confirmed participant list for an event.
- **Auth:** ORG only (own event)

---

## 4. Files

### POST `/events/:eventId/files`
Upload a document/file for an event (max 5MB).
- **Auth:** ORG only (own event)
- **Body:** `multipart/form-data` with `file` field.

### GET `/events/:eventId/files/:fileId`
Download a specific file for an event.
- **Auth:** ORG (own event) or Registered Participant

---

## 5. Registrations

### POST `/events/:id/register`
Register the logged-in user for an event.
- **Auth:** Any logged-in user

### DELETE `/events/:id/cancel-registration`
Cancel the logged-in user's registration for an event.
- **Auth:** Any logged-in user

---

## 6. Reports

### POST `/:id/report/generate`
Trigger a long-running background task to generate an event report.
- **Auth:** ORG only (own event)

### GET `/reports/:id`
Check the generation status or retrieve a specific report.
- **Auth:** ORG (own report) or ADMIN

### GET `/reports`
List all reports in the system.
- **Auth:** ADMIN only

---

## 7. Logs

### GET `/logs`
Retrieve system logs (pagination and level filtering).
- **Auth:** ADMIN only
- **Query Params:** `?level=INFO|WARN|ERROR&userId=1&limit=100&offset=0`

---

## 8. Statistics

### GET `/statistics/admin`
Retrieve overall system statistics (user counts, event counts, registration metrics).
- **Auth:** ADMIN only
