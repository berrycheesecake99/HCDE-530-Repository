# MP2 — UW Walking Partner App — project context

Use this file for **what the app is**, **who it’s for**, **decisions already made**, and **what to demo by May 27**. Cursor rules live in `.cursorrules` in this folder.

**App name:** TBD (folder: `Mini Project 2`)

---

## Problem

UW students who have **late classes** or **work late on campus** often walk home **alone at night**. They want a **trusted walking partner**, not a ride-share or a dating match.

## Primary users

- **Students** — leaving campus late, heading toward home, dorms, or neighborhoods (e.g. U District, Ave).
- **Professors** and **campus police** — can join the same verified community (role badges visible on profiles).

## Onboarding (decided)

1. **Survey** — intent, comfort, safety expectations.
2. **Invite code** — required after survey; user becomes a `community_member`.
3. **Role** — `student`, `professor`, or `campus_police`.
4. Only then: **share meet-up locations** and use discovery/matching.

## Core experience (decided)

Pattern is like a **dating app** (browse, express interest, match), but purpose is **safety and coordination**:

- Post: **where** you’re meeting, **when** you leave, **where** you’re headed (area-level, not exact home address in v1 if possible).
- Discover compatible walk posts or people nearby in time and direction.
- **Match** → coordinate meet-up; **active walk** state optional for v1 demo.
- **Chat** — stretch; can use “matched” screen with meet-up details first.

## Safety and trust (all in scope for the product; phase for May 27)

| Feature | Notes |
|--------|--------|
| Block / report | Required UI; wire to backend when possible |
| Role badges | student / professor / campus_police |
| Share live location with a friend | Trusted contact, not necessarily match partner |
| Emergency / quick-help | Entry point on key screens |
| Post-walk rating | Feedback after completed walk |
| Route reminders | Copy: stay on public, well-lit paths |

For the **May 27** demo: build the **happy path** first; safety features can be **fully built** or **stubbed with clear “planned” labels**—never fake a working emergency flow.

## Tech (recommended default; not locked in)

- **Expo (React Native)** under `mobile/` — solo-friendly, one codebase for iOS/Android.
- **Firebase** — Auth, Firestore, invite-code validation.

User has not committed to stack yet; see `.cursorrules` for when to default vs ask.

## MVP for deadline — Wednesday, May 27, 2026

**Must demo:**

1. Survey → invite code → community access  
2. Profile with role badge  
3. Create a walk post (location, time, destination area)  
4. Browse / request / basic match  
5. Block or report affordance visible  

**Stretch:** chat, live location, emergency integration, full ratings.

## Class / repo

- **MP2**, **solo**, inside **HCDE 530 Repository** (`Mini Project 2/`).
- Do not mix with **Mini Project/** (MP1) or **Week 1/** (separate git repo).

## Demo script (~2 minutes)

1. New user completes **survey** and enters **invite code**.  
2. Sets **role** and a minimal **profile**.  
3. Creates a **walk post** (e.g. leaving Kane at 10:00 PM, toward U District).  
4. Second user (or mock) **browses**, sends **interest**, **matches**.  
5. Point out **safety** UI: badges, report, route reminder, emergency (built or labeled TODO).

## Privacy

- No real UW student PII in the repo.  
- Use **mock users and posts** for screenshots and submission.  
- Position as **UW-focused**; production would need proper email/verification policies.

---

Update this file when the app name, stack, or MP2 rubric requirements change.
