# frontend / localization

## Purpose

Defines locale selection and complete German and English message availability
for every user-visible part of the static frontend.

## Requirements

### Requirement: Every user-facing message is available in German and English
The frontend SHALL ship German (`de`) and English (`en`) translations for every
user-facing message, including navigation, forms, validation, status,
unavailable-feature, and error content. Missing or unknown message keys SHALL
fall back to the English message rather than rendering an empty value.

#### Scenario: Login is shown in either supported locale
- **WHEN** a user opens the login route in German or English
- **THEN** every visible label, instruction, action, validation message, and status message is presented in the selected locale

#### Scenario: Translation is unavailable in the selected locale
- **WHEN** a message has no value in the selected locale
- **THEN** the frontend displays its English fallback value

### Requirement: Locale selection is deterministic and user-controlled
The frontend SHALL select a locale by preferring a previously saved supported
choice, then a German browser preference, and otherwise English. It SHALL offer
a language control on public and authenticated routes, apply a new choice
without a page reload, persist only the locale preference in browser storage,
and update the document language metadata.

#### Scenario: First visit uses German browser preference
- **WHEN** no locale has been saved and the browser's preferred language starts with `de`
- **THEN** the frontend renders German messages and identifies the document language as `de`

#### Scenario: User changes language
- **WHEN** a user changes the locale from German to English
- **THEN** visible messages and document language metadata change immediately and English remains selected on the next visit

#### Scenario: Saved locale is unsupported
- **WHEN** the saved locale is not `de` or `en` and the browser does not prefer German
- **THEN** the frontend uses English
