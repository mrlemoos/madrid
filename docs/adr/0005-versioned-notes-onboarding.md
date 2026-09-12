# 5. Show versioned onboarding to every entitled user

Date: 2026-09-11

Status: Accepted

## Context

Madrid currently seeds a welcome note only for an empty vault. Existing users
therefore never see an introduction. That is the wrong boundary for a product
orientation: account age and vault contents do not say whether a user has seen
this onboarding.

## Decision

Show a short onboarding flow to every signed-in, entitled user after entitlement
and vault load, before their notes workspace. Users without Madrid Pro continue
to see pricing; signed-out visitors continue to see authentication.

Store the completed `onboarding_version` in `user_preferences`. Users with no
completed version, including existing users, see the current onboarding. Finishing
or skipping records the current version. Raising the current version deliberately
shows a later orientation to every user again.

The flow is a required-answer questionnaire, rather than an introductory
walkthrough. It records three choices that already exist in `user_preferences`:

1. App language, including following the device language.
2. Whether to show the existing writing activity and streak view.
3. Whether to enable the existing daily-note shortcut.

The shared `@getmadrid/design/questionnaire` component owns question order,
validation, keyboard navigation, progress, and focus. The onboarding component
owns persistence and the global skip action. Skipping is always available and
does not create a sample note or alter the user's vault.

## Consequences

- Raising the version to 3 shows the questionnaire to users who completed an
  earlier onboarding.
- Completion follows the user across browsers and Electron because it lives in
  their preferences, not local storage.
- A future onboarding needs only a version bump. It does not need a new
  first-run flag or migration of old accounts.
