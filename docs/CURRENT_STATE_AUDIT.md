# Current State Audit

## Overview
The CredentialVerify frontend is currently a React 19 application built with Vite and Tailwind CSS v4. It functions as a demonstrative prototype using entirely client-side state and hard-coded mock data. 

## Technical Stack
- **Framework:** React 19
- **Build Tool:** Vite 6
- **Routing:** Custom state-based routing (`currentScreen` in `AppContext.tsx`), lacking URL history or direct linking.
- **Package Manager:** bun
- **State Management:** React Context API (`AppContext.tsx`)
- **Styling System:** Tailwind CSS v4 with Lucide React for icons.
- **Data Fetching:** Mock promises in `src/services/verificationService.ts`.

## Key Findings

1. **Mock Data:** Located in `src/services/mockData.ts` (47KB). Includes users, candidates, cases, audit logs.
2. **Dashboard Metrics:** Hardcoded or derived directly from the mock array state in memory.
3. **Frontend Services:** Located in `src/services/` (`dossierService.ts`, `exportService.ts`, `verificationService.ts`).
4. **Navigation:** Relies on `navigateTo()` updating a string in `AppContext`. A browser refresh resets the user to the Dashboard.
5. **Role Checks:** Demonstrative. Users can switch roles instantly via the UI without actual authentication.
6. **Tests:** No testing framework or test files are currently present in the repository. Linting is configured via `tsc --noEmit`.
7. **Incomplete Interactions:** 
   - Refreshing loses the current screen.
   - Form submissions update local memory state only.
   - File uploads are simulated and do not persist to a storage backend.
   - Authoritative source checks are hardcoded to return mock responses.

## Conclusion
The frontend UI is visually complete and functionally demonstrative. The immediate next steps are to introduce a real routing library (React Router), standardize the demo dataset, and begin stripping out the mock services in preparation for the real backend API.
