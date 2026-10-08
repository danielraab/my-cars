## MODIFIED Requirements

### Requirement: Frontend is served with SPA fallback
The system SHALL serve the embedded frontend build for any `GET` request
outside `/api/`: the matching static file if the path corresponds to one,
or `index.html` otherwise, so client-side routes resolve on a direct
navigation or hard refresh. Every response that serves `index.html` SHALL
carry the same document, including any configured analytics snippet.

#### Scenario: Static asset request
- **WHEN** `GET` is called for a path outside `/api/` that matches a file
  in the embedded frontend build other than `index.html`
- **THEN** that file's bytes are returned with status `200`

#### Scenario: Client-side route request
- **WHEN** `GET` is called for a path outside `/api/` that matches no file
  in the embedded frontend build
- **THEN** the frontend's `index.html` document is returned with status
  `200`, identical to the response for `GET /`

## ADDED Requirements

### Requirement: Configured analytics snippet is included in index.html
The system SHALL accept an optional operator-provided HTML snippet in the
`ANALYTICS_SNIPPET` environment variable. When it is non-empty, every
response that serves `index.html` SHALL contain the snippet verbatim,
inserted immediately before the document's first `</head>`, for every
visitor alike. When it is unset or empty, `index.html` SHALL be served byte
for byte as embedded.

#### Scenario: Snippet configured
- **WHEN** `ANALYTICS_SNIPPET` is set to
  `<script defer src="https://stats.example/script.js" data-website-id="abc"></script>`
  and `GET /` is called
- **THEN** the response status is `200`, the body is the embedded
  `index.html` with that snippet inserted immediately before `</head>`, and
  the `Content-Length` matches the returned body

#### Scenario: Snippet on every route serving index.html
- **WHEN** `ANALYTICS_SNIPPET` is set and `GET` is called for `/`,
  `/index.html`, or a client-side route such as `/cars/1`
- **THEN** each response body contains the snippet exactly once

#### Scenario: No snippet configured
- **WHEN** `ANALYTICS_SNIPPET` is unset or empty and `GET /` is called
- **THEN** the response body equals the embedded `index.html`, byte for byte

#### Scenario: Snippet absent outside index.html
- **WHEN** `ANALYTICS_SNIPPET` is set and a request is made under `/api/`
  or for another static file
- **THEN** the response body does not contain the snippet

### Requirement: Unusable analytics snippet configuration fails startup
The system SHALL refuse to start when `ANALYTICS_SNIPPET` is non-empty but
the embedded frontend has no `index.html` or it contains no `</head>`,
reporting the reason
without printing the snippet. When a snippet is in use, startup SHALL log
that one is configured, without its contents.

#### Scenario: index.html without a head end tag
- **WHEN** `ANALYTICS_SNIPPET` is non-empty and the embedded `index.html`
  has no `</head>`
- **THEN** the backend exits at startup with an error naming
  `ANALYTICS_SNIPPET` and the missing `</head>`

#### Scenario: Embedded frontend without index.html
- **WHEN** `ANALYTICS_SNIPPET` is non-empty and the embedded frontend build
  contains no `index.html`
- **THEN** the backend exits at startup with an error naming
  `ANALYTICS_SNIPPET` and the missing `index.html`

#### Scenario: Snippet contents not logged
- **WHEN** the backend starts with a non-empty `ANALYTICS_SNIPPET`
- **THEN** the startup log states that an analytics snippet is configured
  and does not contain the snippet's text
