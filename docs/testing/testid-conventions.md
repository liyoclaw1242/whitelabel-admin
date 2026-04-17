# data-testid Conventions

Stable selectors for Playwright E2E tests. All `data-testid` values are **lowercase, hyphenated**, following the pattern `{component}-{element}`.

## Auth

| Element | `data-testid` |
|---------|---------------|
| Login email input | `login-email` |
| Login password input | `login-password` |
| Login submit button | `login-submit` |
| Login error message | `login-error` |
| Loading spinner / state | `loading-state` |
| Error state container | `error-state` |

## Navigation

| Element | `data-testid` |
|---------|---------------|
| Home nav link | `nav-home` |
| Dashboard nav link | `nav-dashboard` |
| Users nav link | `nav-users` |
| Theme Editor nav link | `nav-theme-editor` |
| User menu trigger | `user-menu` |
| Logout button | `logout-button` |

## Permissions

| Element | `data-testid` |
|---------|---------------|
| Permission-granted content wrapper | `permission-{name}` (e.g. `permission-users.read`) |

## Rules

1. **Format**: `{component}-{element}` — lowercase, hyphen-separated.
2. **Dynamic segments**: use the route or permission name as-is (e.g. `nav-theme-editor`, `permission-users.read`).
3. **No test-only markup**: `data-testid` is acceptable on production elements. Don't add wrapper divs just for testid; attach to the nearest semantic element.
4. **Stability**: these IDs are a contract between FE and QA. Renaming requires updating both the component and the Playwright selectors.
