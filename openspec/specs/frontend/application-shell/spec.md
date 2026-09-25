# frontend / application-shell

## Purpose

Defines the public entry experience and authenticated browser shell that give
the static frontend a consistent, responsive frame for later parity screens.

## Requirements

### Requirement: Public landing presents the product entry points
The frontend SHALL provide a public landing route with a welcome message and
entry cards for expenses, refuels, repairs, and tickets, preserving the product
areas identified by `SCR-01`. For an unauthenticated visitor, each entry SHALL
lead through login while retaining its application-local destination. For an
authenticated visitor, each entry SHALL lead directly to that protected area.

#### Scenario: Anonymous visitor selects a product area
- **WHEN** an unauthenticated visitor selects the refuels entry on the landing page
- **THEN** the frontend opens login with `/refuels` as the post-login destination

#### Scenario: Authenticated visitor selects a product area
- **WHEN** an authenticated visitor selects the tickets entry on the landing page
- **THEN** the frontend navigates directly to `/tickets`

### Requirement: Protected routes use an authenticated application shell
The frontend SHALL place protected application routes inside a shared,
responsive shell that identifies the application, exposes navigation for the
dashboard, cars, refuels, repairs, tickets, and profile, provides logout and
language controls, and remains keyboard-operable at narrow and wide viewport
sizes. Feature routes not implemented by this change SHALL show an explicit
localized unavailable placeholder rather than a broken route or simulated
feature data.

#### Scenario: Authenticated user opens the shell on a narrow viewport
- **WHEN** an authenticated user opens a protected route at a narrow viewport width
- **THEN** the navigation remains reachable and operable without obscuring the route content

#### Scenario: User opens a deferred feature route
- **WHEN** an authenticated user follows a shell link to a feature not implemented in this change
- **THEN** the frontend shows a localized unavailable placeholder within the authenticated shell

### Requirement: Generated development content is not user-visible
The production frontend SHALL not display generated starter branding,
instructions, or development-tool controls.

#### Scenario: Production application is opened
- **WHEN** a user opens a production build
- **THEN** only product UI is visible and no generated starter or developer interface is rendered
