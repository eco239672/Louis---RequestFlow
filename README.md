# Louis – RequestFlow

## Overview

Louis – RequestFlow is an internal mobile request-management application for company teams. An employee creates a request and chooses the department responsible for handling it. A manager of that department can review the request and approve or reject it. The employee then sees the current result of the request.

The app is designed to work on Windows, Android, and iOS. It keeps data available while a device is offline and synchronizes changes with a separate cloud backend when a connection is available. The cloud project is independent from the company e-shop and serves only RequestFlow.

## Available features

- .NET MAUI application that can be opened in Visual Studio;
- local SQLite storage on every device;
- creation of requests while offline;
- department selection before a request is created, such as Purchasing, Marketing, or IT Support;
- unique request ID, local reference, UTC timestamp, traffic-light priority, and status;
- request states: waiting for manager approval, approved, rejected, in progress, on hold, resolved, completed, or cancelled;
- queue of unsent changes and synchronization through the cloud API;
- automatic refresh of the selected department every 15 seconds while the app is open;
- stable ordering: red, then yellow, then green priority, followed by the oldest request first;
- role-based workflow: only an assigned manager can approve or reject requests for their department.

## Run locally

1. In Visual Studio Installer, install the **.NET Multi-platform App UI development** workload and an SDK version supported by your Visual Studio installation.
2. Open `Loius.Requests.sln` in Visual Studio.
3. Restore NuGet packages and run either the Windows Machine or Android Emulator profile.

## Cloud synchronization

The separate **Louis – RequestFlow** cloud backend runs on Neon in the EU region. It is not connected to the e-shop project.

- The server function is implemented in `backend/src/index.ts`.
- Shared requests are stored in the `work_requests` table.
- When a connection is available, the app sends pending changes and downloads the current requests for the department being viewed.
- The mobile app provides a **Synchronization settings** screen for entering the cloud connection details and the user's phone number.

## User and phone administration

The cloud includes an administrator interface at `/admin`. The administrator creates a user record with the employee's full name, role, department, and phone number, in that order. Roles are Employee, Manager, and Administrator.

Each employee is shown on the main administrator page and has a separate editable card. The administrator can update the employee's details or permanently remove the employee record. Removing an employee also removes their device authorization; previously created requests remain in the system as workflow history.

When a person first opens the mobile app, they enter their phone number. The cloud matches that number with the administrator-created user record, links the device to that person, and loads the assigned role and department. The phone cannot grant itself manager permissions.

Administrator access is protected by a separate administrator access key stored in the database only as a hash. Phone numbers are personal data: they are visible only in the administrator interface and are not shown to ordinary app users.

## Project structure

- `src/Loius.Requests.App` – the .NET MAUI mobile and desktop application;
- `backend/src/index.ts` – cloud API, synchronization, authorization, and administrator routes;
- `backend/src/admin-dashboard-page.ts` – administrator employee list;
- `backend/src/admin-employee-page.ts` – reusable individual employee card;
- `backend/src/admin-ui.ts` – shared administrator interface styles and browser logic.

Employee cards are generated from cloud data, so the source code does not grow when new employees are added. When an employee is removed, their cloud user and device-authorization data are removed as well.

## Security and production considerations

The current solution uses phone-based device enrollment and role validation in the cloud. Before a wider production rollout, the recommended next step is to add individual authenticated user accounts and a managed method for issuing or resetting administrator access.

Do not store cloud access keys, administrator keys, or phone lists in the repository. Keep them in the cloud configuration and give administrator access only to trusted people in the company.

## Planned improvements

- push notifications for a manager when a new request needs a decision and for an employee when it is approved or rejected;
- authenticated sign-in and account recovery for larger deployments;
- audit log for administrator changes;
- routine dependency and security updates.
