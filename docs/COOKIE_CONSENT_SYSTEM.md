# Cookie Consent System Documentation

This document explains the implementation of the GDPR/CCPA compliant Cookie Consent system in the HOME SALOON application.

## 1. Overview

The system consists of a centralized Context (`CookieConsentContext`) that manages user consent state, local storage persistence, and script injection. UI components including a Banner, Preferences Modal, and Policy Page provide the necessary user interface.

## 2. Architecture

### Core Components

*   **`src/contexts/CookieConsentContext.tsx`**: The brain of the system.
    *   **State Management**: `consent` (object), `hasConsented` (boolean), `isBannerOpen` (boolean).
    *   **Persistence**: Saves consent to `localStorage` with a timestamp and version.
    *   **Expiration**: Automatically invalidates consent after 365 days.
    *   **Script Control**: `useEffect` hook monitors `consent` changes and executes relevant scripts (Analytics, Marketing) only when approved.

*   **`src/components/cookie/CookieBanner.tsx`**:
    *   **First-time visit**: Appears automatically via `AnimatePresence`.
    *   **Controls**: "Accept All", "Reject All" (safely keeps Necessary true), "Customize".
    *   **Behavior**: Non-blocking (visually) but persistent until choice is made.

*   **`src/components/cookie/CookiePreferencesModal.tsx`**:
    *   **Granular Control**: Toggle individual categories (Functional, Analytics, Marketing).
    *   **Strictly Necessary**: Always enabled and disabled for editing.

*   **`src/pages/footer_pages/CookiePolicy.tsx`**:
    *   **Detailed information**: Explains what cookies are used via accordions/cards.
    *   **Management**: Provides a button to reopen the Preferences Modal.

### Categories

1.  **Strictly Necessary**: Required for the app to function (Auth, Security). Cannot be disabled.
2.  **Functional**: Preferences like language or region.
3.  **Analytics**: Anonymous usage data (Google Analytics, etc.).
4.  **Marketing**: Ad targeting and retargeting (Facebook Pixel, etc.).

## 3. How to Add New Cookies / Scripts

To integrate a new third-party script (e.g., Google Analytics or Facebook Pixel), you must add the loading logic inside the `useEffect` in `src/contexts/CookieConsentContext.tsx`.

### Example: Adding Google Analytics

1.  Open `src/contexts/CookieConsentContext.tsx`.
2.  Locate the `useEffect` that handles script logic (commented as `// 2. Logic to handle third-party scripts...`).
3.  Add your script injection code inside the appropriate block:

```typescript
  // src/contexts/CookieConsentContext.tsx

  useEffect(() => {
    if (!hasConsented) return;

    if (consent.analytics) {
      console.log('Enabling Analytics Cookies...');
      // INSERT YOUR SCRIPT HERE
      // Example:
      // const script = document.createElement('script');
      // script.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
      // script.async = true;
      // document.head.appendChild(script);
      // ... initialization code ...
    }

    if (consent.marketing) {
       // Enable Marketing Scripts (e.g. Meta Pixel)
    }

  }, [consent, hasConsented]);
```

**Important**: Ensure you do NOT load these scripts anywhere else in your application (e.g., `index.html`). They must be controlled by this Context to ensure compliance.

## 4. User Flow

1.  **New User**: Sees the `CookieBanner` at the bottom.
2.  **Choice**:
    *   **Accept All**: Enablse all categories -> Scripts load -> Banner closes.
    *   **Reject All**: Disables all non-necessary categories -> Banner closes.
    *   **Customize**: Opens `CookiePreferencesModal`. User toggles specific categories and saves.
3.  **Returning User**: Consent is read from `localStorage`. If valid (not expired), banner is hidden. Scripts load based on saved preferences.
4.  **Changing Consent**: User clicks "Cookie Settings" in the Footer or "Manage Cookie Preferences" on the Cookie Policy page to reopen the modal.

## 5. Security & Expiration

*   Consent expires after **365 days** (configurable via `EXPIRY_DAYS` in context).
*   Consent versioning is implemented (`version: '1.0'`). If you change your policy significantly, increment this version in the Context to force a re-consent prompt for all users.
