# Frontend Overview

This frontend is a React-based single-page application (SPA) that provides an interface for browsing researchers, visualizing research networks, and managing data through an admin panel. It integrates with the Express.js backend API for data persistence and authentication.

## Contents
[Directory Overview](#directory-overview)\
[Component Interaction](#component-interaction)\
[Routing Structure](#routing-structure)\
[Key Features](#key-features)\
[Library Overview](#library-overview)

## Directory Overview

```
research-app/
└── src/
    ├── components/          # Reusable UI components
    │   ├── adminComponents/ # Admin-specific components
    │   ├── global/          # Shared components (Footer, DarkMode, etc.)
    │   ├── userComponents/  # User-facing components
    │   └── utils/           # Utility components (Pagination, etc.)
    ├── hooks/               # Custom React hooks
    ├── pages/               # Page-level components
    │   ├── admin/           # Admin panel pages
    │   └── users/           # User-facing pages
    ├── services/            # API service layer
    ├── App.js               # Main application component with routing
    ├── App.css              # Global styles
    └── index.js             # Application entry point
```

### Key Directories

**`/components`** — Reusable UI components organized by context

- **`adminComponents/`** — Admin dashboard components for managing researchers, tags, and scraping jobs
- **`userComponents/`** — Public-facing components for browsing and visualizing research data
- **`global/`** — Shared components used across both admin and user interfaces
- **`utils/`** — Helper components like pagination and network data builders

**`/pages`** — Top-level page components that compose smaller components

- **`admin/`** — Administrative interface pages
- **`users/`** — Public user interface pages

**`/services`** — API client layer that communicates with the backend

**`/hooks`** — Custom React hooks for state management and side effects

**`/utils`** — Helper functions for network graph building and configuration

## Routing Structure

The application uses React Router v6 with two main route contexts:

### User Routes (`/*`)
Accessible to all users. Provides research browsing and network visualization.

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home.js` | Landing page with hero section and research network visualization |
| `/login` | `Signup.js` | Combined login/signup page with email verification |
| `/researchers` | `BrowseProfiles.js` | Browse researchers with filtering by research areas and skills |
| `/researchers/:id` | `ResearcherProfile.js` | Individual researcher profile with publications |
| `/edit-profile` | `EditProfile.js` | Edit user profile (research areas, skills, contact info) |
| `/logout` | `Logout.js` | User logout |
| `*` | `NotFound.js` | 404 page |

### Admin Routes (`/admin/*`)
Requires authentication and admin privileges. Protected routes for administrative functions.

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `Dashboard.js` | Admin overview with statistics and quick actions |
| `/admin/researchers` | `Researchers.js` | Manage researchers (CRUD operations) |
| `/admin/users` | `Users.js` | Manage user accounts and permissions |
| `/admin/publications` | `Publications.js` | View and manage publications |
| `/admin/data` | `Scraper.js` | Data scraping manager with tabs for dashboard, create job, logs, and tags |

## Component Interaction

The following diagram shows how components are organized and interact:

```mermaid
graph TD;
    A[App.js] --> B[Router]
    B --> C1[User Routes]
    B --> C2[Admin Routes]
    
    C1 --> D1[NavBar]
    C1 --> D2[UserPanel]
    C1 --> D3[Footer]
    C1 --> D4[Signup]
    C1 --> X[Global]
    
    C2 --> D4[Signup]
    C2 --> E1[AdminNavBar]
    C2 --> E2[AdminPanel]
    C2 --> E3[Footer]
    C2 --> X

    D2 --> F1[Home.js]
    D2 --> F2[BrowseProfiles.js]
    D2 --> F3[ResearcherProfile.js]
    
    E2 --> G1[Dashboard.js]
    E2 --> G2[Researchers.js]
    E2 --> G3[Scraper.js]
    E2 --> G4[Users.js]
    E2 --> G5[Publications.js]

    G1 --> H1[AdminNavBar.js]
    G3 --> H2[CreateScrapingJob.js]
    G3 --> H3[MostRecentJob.js]
    G3 --> H4[ScrapeControls.js]
    G3 --> H5[TagManager.js]

    X --> U1[Utils]
    X --> U2[Hooks]
    X --> U3[Services]
    X --> U4[Styles]
    
    
    style A fill:#3b82f6
    style B fill:#8b5cf6
    style C1 fill:#10b981
    style C2 fill:#f59e0b  
```

## Key Features

## Library Overview
