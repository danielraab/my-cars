export const resources = {
  en: {
    translation: {
      brand: {
        name: 'my-car',
        tagline: 'Everything about your car, in one place.',
      },
      language: {
        label: 'Language',
        de: 'Deutsch',
        en: 'English',
      },
      navigation: {
        label: 'Application navigation',
        open: 'Open navigation',
        close: 'Close navigation',
        dashboard: 'Dashboard',
        cars: 'Cars',
        refuels: 'Refuels',
        repairs: 'Repairs',
        tickets: 'Tickets',
        profile: 'Profile',
      },
      landing: {
        eyebrow: 'Your digital garage',
        title: 'Keep every journey under control.',
        description:
          'Track costs, refuels, repairs, and tickets across all your cars.',
        login: 'Sign in',
        openApp: 'Open dashboard',
        visualLabel: 'Drive · Track · Know',
        cards: {
          expenses: {
            title: 'Expenses',
            description: 'See where your running costs go.',
          },
          refuels: {
            title: 'Refuels',
            description: 'Follow fuel prices and consumption.',
          },
          repairs: {
            title: 'Repairs',
            description: 'Keep service and repair history together.',
          },
          tickets: {
            title: 'Tickets',
            description: 'Record parking and traffic tickets.',
          },
        },
      },
      login: {
        eyebrow: 'Welcome back',
        title: 'Sign in to my-car',
        description:
          'Choose your identity provider or receive a secure sign-in link by email.',
        descriptionMagicLink: 'Receive a secure sign-in link by email.',
        methodsLoading: 'Loading sign-in options…',
        methodsErrorTitle: 'Sign-in options unavailable',
        methodsError:
          'We could not load the available sign-in options. Please try again.',
        methodsRetry: 'Try again',
        oidc: 'Continue with identity provider',
        divider: 'or',
        emailLabel: 'Email address',
        emailPlaceholder: 'you@example.com',
        magicLink: 'Email me a sign-in link',
        sending: 'Sending link…',
        acceptedTitle: 'Check your inbox',
        accepted:
          'If the address can receive a sign-in link, it is on its way. You can close this page.',
        invalidEmail: 'Enter a valid email address.',
        unavailable: 'Sign-in is currently unavailable. Please try again.',
        back: 'Back to the welcome page',
        securityLabel: 'Secure · Passwordless',
      },
      shell: {
        account: 'Signed in as {{email}}',
        logout: 'Sign out',
        loggingOut: 'Signing out…',
        logoutError: 'Sign-out failed. Please try again.',
      },
      unavailable: {
        eyebrow: 'Coming next',
        title: '{{feature}} is not available yet',
        description:
          'This area is prepared and will be added in a later rewrite slice.',
      },
      sessionError: {
        title: 'We could not check your session',
        description:
          'The server may be temporarily unavailable. Your sign-in state has not been changed.',
        retry: 'Try again',
      },
      internal: {
        fallbackProbe: 'English fallback',
      },
    },
  },
  de: {
    translation: {
      brand: {
        name: 'my-car',
        tagline: 'Alles rund ums Auto an einem Ort.',
      },
      language: {
        label: 'Sprache',
        de: 'Deutsch',
        en: 'English',
      },
      navigation: {
        label: 'Anwendungsnavigation',
        open: 'Navigation öffnen',
        close: 'Navigation schließen',
        dashboard: 'Übersicht',
        cars: 'Autos',
        refuels: 'Tankvorgänge',
        repairs: 'Reparaturen',
        tickets: 'Strafzettel',
        profile: 'Profil',
      },
      landing: {
        eyebrow: 'Deine digitale Garage',
        title: 'Behalte jede Fahrt unter Kontrolle.',
        description:
          'Verwalte Kosten, Tankvorgänge, Reparaturen und Strafzettel für all deine Autos.',
        login: 'Anmelden',
        openApp: 'Übersicht öffnen',
        visualLabel: 'Fahren · Erfassen · Verstehen',
        cards: {
          expenses: {
            title: 'Ausgaben',
            description: 'Sieh, wofür deine laufenden Kosten entstehen.',
          },
          refuels: {
            title: 'Tankvorgänge',
            description: 'Verfolge Kraftstoffpreise und Verbrauch.',
          },
          repairs: {
            title: 'Reparaturen',
            description: 'Behalte Wartungen und Reparaturen zusammen.',
          },
          tickets: {
            title: 'Strafzettel',
            description: 'Erfasse Park- und Verkehrsverstöße.',
          },
        },
      },
      login: {
        eyebrow: 'Willkommen zurück',
        title: 'Bei my-car anmelden',
        description:
          'Wähle deinen Identitätsanbieter oder erhalte einen sicheren Anmeldelink per E-Mail.',
        descriptionMagicLink: 'Erhalte einen sicheren Anmeldelink per E-Mail.',
        methodsLoading: 'Anmeldeoptionen werden geladen…',
        methodsErrorTitle: 'Anmeldeoptionen nicht verfügbar',
        methodsError:
          'Die verfügbaren Anmeldeoptionen konnten nicht geladen werden. Bitte versuche es erneut.',
        methodsRetry: 'Erneut versuchen',
        oidc: 'Mit Identitätsanbieter fortfahren',
        divider: 'oder',
        emailLabel: 'E-Mail-Adresse',
        emailPlaceholder: 'du@beispiel.de',
        magicLink: 'Anmeldelink per E-Mail senden',
        sending: 'Link wird gesendet…',
        acceptedTitle: 'Prüfe dein Postfach',
        accepted:
          'Wenn die Adresse einen Anmeldelink empfangen kann, ist er unterwegs. Du kannst diese Seite schließen.',
        invalidEmail: 'Gib eine gültige E-Mail-Adresse ein.',
        unavailable:
          'Die Anmeldung ist derzeit nicht verfügbar. Bitte versuche es erneut.',
        back: 'Zurück zur Startseite',
        securityLabel: 'Sicher · Passwortlos',
      },
      shell: {
        account: 'Angemeldet als {{email}}',
        logout: 'Abmelden',
        loggingOut: 'Abmeldung läuft…',
        logoutError: 'Abmeldung fehlgeschlagen. Bitte versuche es erneut.',
      },
      unavailable: {
        eyebrow: 'Demnächst',
        title: '{{feature}} ist noch nicht verfügbar',
        description:
          'Dieser Bereich ist vorbereitet und folgt in einem späteren Abschnitt der Neuentwicklung.',
      },
      sessionError: {
        title: 'Deine Sitzung konnte nicht geprüft werden',
        description:
          'Der Server ist möglicherweise vorübergehend nicht erreichbar. Dein Anmeldestatus wurde nicht geändert.',
        retry: 'Erneut versuchen',
      },
      internal: {},
    },
  },
} as const
