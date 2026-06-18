# Auth-Gated App Testing Playbook (CareerOS Campus Intelligence)

Backend stores sessions in `user_sessions` collection. Users in `users` collection have:
- `user_id` (custom UUID)
- `email`
- `role` ∈ {super_admin, tpo, hod, coordinator}
- `college_id`
- `approved` (bool)

Pre-seeded demo accounts (no Google needed — use `/api/auth/dev-login`):

| Email | Role | college_id | approved |
| --- | --- | --- | --- |
| admin@careeros.app | super_admin | – | true |
| tpo@kmit.in | tpo | col_kmit_main | true |
| hod.cse@kmit.in | hod | col_kmit_main | true |
| coord@kmit.in | coordinator | col_kmit_main | true |
| tpo@vasavi.ac.in | tpo | col_vasavi_pending | false (pending approval demo) |

## Dev-login (for testing agent)
```
curl -i -X POST "$URL/api/auth/dev-login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tpo@kmit.in"}'
```
Returns Set-Cookie with `session_token`. Reuse the cookie on subsequent calls.

## Browser test (Playwright)
```python
await page.context.add_cookies([{
  "name":"session_token","value":TOKEN,
  "domain":"<host>","path":"/","httpOnly":True,"secure":True,"sameSite":"None"
}])
```

## Google OAuth flow (real users)
1. Frontend redirects to `https://auth.emergentagent.com/?redirect=<origin>/dashboard`
2. After Google, lands at `<origin>/dashboard#session_id=...`
3. Frontend extracts `session_id`, POSTs to `/api/auth/session` (credentials: include).
4. Backend calls Emergent's `/auth/v1/env/oauth/session-data`, stores session, sets cookie.
