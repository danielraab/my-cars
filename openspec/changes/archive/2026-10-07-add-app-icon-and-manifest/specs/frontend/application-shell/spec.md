## ADDED Requirements

### Requirement: Product is named "My cars"
The frontend SHALL name the product "My cars" wherever a user sees the
product name: the document title, the header brand, and every localized string
that names the product. The name SHALL be the same in every supported locale.

#### Scenario: Tab title
- **WHEN** a user opens any route of the frontend
- **THEN** the browser tab title is "My cars"

#### Scenario: Header brand in German
- **WHEN** a user views the public header with the German locale selected
- **THEN** the brand next to the icon reads "My cars"

#### Scenario: Localized text that names the product
- **WHEN** a user opens the login screen in English
- **THEN** its heading reads "Sign in to My cars" and no visible text contains "my-car"

### Requirement: Browser tab shows the brand icon
The frontend SHALL declare the brand icon (the header's brand mark: the gauge
glyph in the brand navy on the brand lime tile) as the document's favicon, as a
scalable image with a raster fallback, and SHALL set the document theme color
to the brand navy `#142721`.

#### Scenario: Favicon is declared
- **WHEN** a browser loads the frontend's `index.html`
- **THEN** the document links a scalable favicon and a raster favicon, and both URLs resolve to image files in the build

#### Scenario: Legacy favicon probe
- **WHEN** a browser requests `/favicon.ico`
- **THEN** it receives an icon image, not the frontend's `index.html`

### Requirement: Frontend is installable as an app
The frontend SHALL link a web app manifest that names the app "My cars"
(`name` and `short_name`), uses `display` `standalone`, `start_url` `/home`,
scope `/`, and the brand navy as `theme_color` and `background_color`. It
SHALL list the brand icon at 192 px and 512 px with purpose `any`, and at
512 px with purpose `maskable`. It SHALL NOT register a service worker.

#### Scenario: Manifest content
- **WHEN** a browser fetches the manifest linked from `index.html`
- **THEN** it is valid JSON with the name, display, start URL, scope, colors and icons above, and every icon URL resolves to a PNG of the declared size

#### Scenario: Installed app is launched while signed out
- **WHEN** a user without a session launches the installed app
- **THEN** it opens `/home`, which leads to login with `/home` as the post-login destination

#### Scenario: Maskable icon survives cropping
- **WHEN** a launcher crops the maskable icon to a circle of 80 % of its width
- **THEN** the whole gauge glyph remains visible and the area outside the glyph is the brand lime

#### Scenario: No service worker
- **WHEN** the production frontend is loaded
- **THEN** no service worker is registered for the origin

### Requirement: iOS home-screen icon
The frontend SHALL declare a 180 px opaque PNG of the brand icon as the
`apple-touch-icon`, because iOS does not use the manifest's icons.

#### Scenario: Added to the iOS home screen
- **WHEN** a user adds the app to the home screen in Safari on iOS
- **THEN** the home-screen icon is the brand icon, not a screenshot of the page
