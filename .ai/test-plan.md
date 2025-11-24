# Test Plan

## 1. Introduction and Testing Objectives

The goal of testing is to ensure the high quality and reliability of the Word Repeater application, which combines dynamic Astro pages, interactive React components, and integration with a Supabase-based backend. Testing aims to confirm the functional correctness, stability of the integration, performance, security, and accessibility of the application.

## 2. Testing Scope

- **UI Functionality**: Tests for the user interface, responsiveness, and accessibility of components (Dashboard, flashcards, AI generation views, forms).
- **Business Logic**: Tests for hooks (e.g., `useAcceptFlashcard`, `useFlashcardList`), services, and form validation.
- **API Integration**: REST endpoint tests, including authentication, flashcard management, AI generation, updates, and deletion.
- **API Mocking**: Controlled testing environment using service worker-based request interception.
- **Security**: Authorization tests, input data validation, and XSS/CSRF vulnerability tests.
- **Performance**: Load tests for critical operations, Web Vitals monitoring, and API performance benchmarking.
- **Accessibility**: Automated WCAG compliance testing and screen reader compatibility.
- **Visual Regression**: Detecting unintended visual changes in UI components.
- **Type Safety**: Verification of TypeScript type correctness and API contract compliance.

## 3. Test Types

- **Unit Tests**: Tests of individual functions, hooks, and components using Vitest.
- **Integration Tests**: Verification of interactions between components, services, and APIs (e.g., communication with Supabase, REST endpoints).
- **Component Tests**: Testing React components with React Testing Library and MSW for API mocking.
- **E2E Tests**: End-to-end user journey testing using Playwright.
- **Visual Regression Tests**: Screenshot comparison testing with Playwright.
- **Performance Testing**:
  - Web Vitals monitoring with Lighthouse
  - Load testing with k6
  - API performance testing with autocannon
- **Accessibility Testing**: Automated WCAG compliance checks using axe-core integrated with Playwright.
- **Type Testing**: TypeScript type correctness verification with tsd.
- **Security Testing**: Security audits, vulnerability checks, authorization and session validation.

## 4. Test Scenarios for Key Functionalities

- **AI Flashcard Generation**:
  - Verification of flashcard acceptance and rejection.
  - Testing the correctness of communication with the AI generation API.
  - Testing incorrect responses and exception handling.
  - Mocking AI responses with MSW for consistent test results.
- **Flashcard Management (Creation, Editing, Deleting)**:
  - Testing of manual flashcard creation forms.
  - Verification of field validation (e.g., maximum length, non-empty text).
  - Testing of flashcard editing and soft-deleting.
  - Visual regression tests for form components.
- **Dashboard View**:
  - Testing of the flashcard count display and CTA interaction.
  - Loading, API error handling, and view responsiveness tests.
  - Accessibility testing with screen readers and keyboard navigation.
  - Visual snapshot testing for consistent UI rendering.
- **Authentication and Sessions**:
  - Registration, login, and password reset tests.
  - Validation of correct session flow and token management.
  - Security testing for protected routes and API endpoints.
- **UI Component Integration**:
  - Responsiveness tests of implemented components such as ErrorToast, Loader, and Pagination.
  - User interaction tests with buttons and forms.
  - Accessibility compliance testing (WCAG 2.1 AA).
  - Visual regression testing for Shadcn/ui components.
- **API Performance**:
  - Load testing for concurrent users during flashcard generation.
  - Response time benchmarking for CRUD operations.
  - Database query performance under stress conditions.

## 5. Test Environment

- **Local development environment**: Launching the application using Astro and the Supabase server in test mode.
- **CI/CD Environment**: Test pipeline implemented, for example, by GitHub Actions, with automatic running of unit, integration, and e2e tests.
- **Test Database**: A separate Supabase instance with test data and rollback mechanisms.
- **Browsers**: Compatibility tests in major browsers (Chrome, Firefox, Edge).

## 6. Testing Tools

### Core Testing Framework

- **Vitest**: Primary framework for unit and integration testing (optimized for Vite/Astro ecosystem).
- **@vitest/ui**: Visual test runner interface for better developer experience.

### Component Testing

- **React Testing Library**: For testing component interactions and rendering.
- **@testing-library/user-event**: For simulating realistic user interactions.
- **@testing-library/jest-dom**: For enhanced DOM assertions.

### E2E and Visual Testing

- **Playwright**: End-to-end testing framework with multi-browser support.
- **@axe-core/playwright**: Integrated accessibility testing within E2E tests.
- **Playwright Visual Comparisons**: Built-in screenshot comparison for visual regression testing.

### API Mocking

- **MSW (Mock Service Worker)**: Network-level API mocking for both tests and development.
  - Works seamlessly with Vitest and Playwright
  - Provides realistic request/response handling

### Performance Testing

- **Lighthouse**: Web Vitals and core performance metrics.
- **@vercel/speed-insights**: Real-time performance monitoring (optional).
- **k6**: Modern load testing framework for stress and performance testing.
- **autocannon**: HTTP benchmarking tool for API performance testing.

### Static Analysis

- **TypeScript**: Built-in type checking and static analysis.
- **ESLint**: Code quality and pattern enforcement.
- **@typescript-eslint/eslint-plugin**: TypeScript-specific linting rules.

### Type Testing

- **tsd**: TypeScript definition testing to ensure API type correctness.

### Accessibility

- **axe-core**: Automated WCAG compliance testing.
- **Lighthouse Accessibility Audits**: Additional accessibility metrics.

### CI/CD Integration

- **GitHub Actions**: Automated test pipeline.
- **Playwright Test Reports**: HTML reports for test results visualization.

## 7. Test Schedule

### Phase 1: Environment Preparation (1 week)

- Configuring Vitest for unit and integration testing.
- Setting up Playwright for E2E testing.
- Configuring MSW for API mocking.
- Setting up CI/CD pipeline with GitHub Actions.
- Preparing test database (Supabase test instance).
- Creating seed data for consistent testing.

### Phase 2: Unit and Integration Testing (2-3 weeks)

- Developing unit tests for utilities and services using Vitest.
- Testing React hooks (`useAcceptFlashcard`, `useFlashcardList`, etc.).
- Component testing with React Testing Library and MSW.
- API integration testing with mocked Supabase responses.
- Type testing with tsd for critical API contracts.

### Phase 3: E2E and UI Testing (2 weeks)

- Automation of user scenarios using Playwright:
  - Registration and login flows
  - Flashcard generation and acceptance
  - Dashboard navigation and interactions
  - Flashcard CRUD operations
- Visual regression testing with Playwright snapshots.
- Cross-browser testing (Chromium, Firefox, WebKit).
- Responsive design testing across different viewport sizes.

### Phase 4: Accessibility Testing (1 week)

- Automated WCAG 2.1 AA compliance testing with axe-core.
- Keyboard navigation testing.
- Screen reader compatibility verification.
- Color contrast and focus indicator validation.

### Phase 5: Performance and Security Testing (1-2 weeks)

- Web Vitals monitoring with Lighthouse.
- Load testing with k6:
  - Concurrent user simulations
  - Flashcard generation under load
  - Database performance under stress
- API performance benchmarking with autocannon.
- Security audit:
  - Authentication and authorization testing
  - Input validation and XSS/CSRF prevention
  - Rate limiting verification

### Phase 6: Bug Reporting and Fixing (Continuous)

- Collecting test reports from all phases.
- Prioritizing and fixing bugs based on severity.
- Regression testing after fixes.
- Maintaining test suites as features evolve.

## 8. Test Acceptance Criteria

### Unit and Integration Tests

- 100% of critical unit tests must pass.
- Minimum 80% code coverage for business logic and services.
- All React hooks must have comprehensive test coverage.
- All API integration tests with MSW must pass.

### E2E Tests

- No critical bugs in Playwright E2E test scenarios.
- All user journey tests must pass across all supported browsers (Chromium, Firefox, WebKit).
- Visual regression tests must show no unexpected UI changes.

### Performance

- Lighthouse Performance score ≥ 90.
- Core Web Vitals within acceptable ranges:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- Load testing: System must handle at least 50 concurrent users without degradation.
- API response times: 95th percentile < 500ms for CRUD operations.

### Accessibility

- Lighthouse Accessibility score ≥ 95.
- Zero critical accessibility violations detected by axe-core.
- WCAG 2.1 Level AA compliance confirmed.
- All interactive elements must be keyboard accessible.

### Security

- All authentication and authorization tests must pass.
- No XSS or CSRF vulnerabilities detected.
- Rate limiting properly enforced on all API endpoints.
- Sensitive data properly protected and not exposed in logs.

### Type Safety

- TypeScript compilation with zero errors.
- All tsd type tests must pass.
- No use of `any` type in critical business logic.

### Deployment Criteria

- All critical and high-priority bugs must be fixed before production deployment.
- All automated tests in CI/CD pipeline must pass.
- Performance benchmarks must meet or exceed targets.
- Security audit completed with no critical findings.

## 9. Roles and Responsibilities

- **QA Engineers**: Create, execute, and maintain all test plans. Report bugs and verify fixes.
- **Developers**: Support bug diagnosis and implement fixes.
- **DevOps/CI/CD Engineers**: Ensure test environment stability and pipeline integration.
- **Project Manager**: Monitor test progress and manage risk.

## 10. Bug Reporting Procedures

- Use a bug management tool (e.g., Jira, GitHub Issues) to report, track, and monitor bugs.
- Each bug must include:
  - Problem description
  - Steps for reproducing
  - Expected vs. actual results
  - Priority and user impact
  - Screenshots or video recordings (for UI issues)
  - Browser and environment information
- Regular bug reviews and communication between QA and development teams to ensure prompt corrective action.
- Automated test failure reports from CI/CD pipeline linked to issue tracker.

## 11. Recommended Testing Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
});
```

### MSW Setup

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/flashcards", () => {
    return HttpResponse.json({ data: [], total: 0 });
  }),
];
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

### Accessibility Testing Example

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Dashboard should be accessible", async ({ page }) => {
  await page.goto("/dashboard");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Load Testing Example (k6)

```javascript
// k6/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const res = http.get("http://localhost:4321/api/flashcards");
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
```

## 12. Dependencies and Package Installation

```json
{
  "devDependencies": {
    "@axe-core/playwright": "^4.9.0",
    "@playwright/test": "^1.48.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitest/ui": "^2.0.0",
    "msw": "^2.0.0",
    "tsd": "^0.30.0",
    "vitest": "^2.0.0"
  }
}
```

**Additional Tools (not npm packages):**

- **k6**: Install via Docker or native binary
- **Lighthouse**: Available in Chrome DevTools or as CLI tool
- **autocannon**: `npm install -g autocannon` for API benchmarking

---

This test plan is a comprehensive document that will ensure the high quality and stability of the Word Repeater application by systematically testing each key functionality in accordance with the project requirements and the specifics of the technology stack used (Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui).

The updated plan reflects modern testing best practices for 2025, with optimized tooling that integrates seamlessly with the Vite-based Astro ecosystem, providing efficient, reliable, and comprehensive test coverage across all application layers.
