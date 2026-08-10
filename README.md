# ⏳ TimeForge – AI-Powered Productivity & Study Management Platform

TimeForge is an **AI-powered productivity and study management platform** designed to help students manage tasks, schedules, study plans, and daily productivity workflows in one place.

The platform combines a modern responsive interface with AI-powered assistance to provide **smart recommendations, personalized study support, and contextual guidance** based on the user's academic and productivity needs.

##  Key Features

*  **Study Management** – Organize study plans, subjects, exams, assignments, and daily tasks.
*  **Smart Scheduling** – Create and manage personalized study schedules and timetables.
*  **AI-Powered Assistance** – Provides smart recommendations and personalized assistance for study and productivity workflows.
*  **AI Support** – Users can interact with the AI for contextual guidance and study-related assistance.
*  **Productivity Tracking** – Track tasks, study progress, and completion status through the dashboard.
*  **JWT Authentication** – Secure user authentication and protected application resources.
*  **REST APIs** – Backend APIs for communication between the frontend and application services.
*  **Performance Optimization** – Designed for smooth interaction and efficient application performance.
*  **Responsive UI** – Modern interface that works across different screen sizes.
*  **Frontend–Backend Integration** – Smooth communication between the frontend and backend services.

##  AI Integration

TimeForge uses AI to make study and productivity management more personalized.

The AI can work with information such as:

* Student study requirements
* Pending tasks
* Exam and assignment information
* Study schedules
* Academic planning information
* User-specific productivity needs

Based on this context, the system can provide:

* Personalized study recommendations
* Contextual assistance
* Study planning support
* Revision guidance
* Productivity suggestions

The project integrates Google's Generative AI capabilities through the `@google/genai` package.

##  Architecture

TimeForge follows a **frontend–backend architecture**.

```text
                    ┌──────────────────────┐
                    │       User           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │                      │
                    │  UI Components       │
                    │  Study Management     │
                    │  Scheduling           │
                    │  Dashboard            │
                    └──────────┬───────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Backend Services   │
                    │                      │
                    │ Authentication       │
                    │ Business Logic       │
                    │ API Handling         │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │      Redis       │      │    AI Service    │
        │                  │      │                  │
        │ Caching /        │      │ AI-powered       │
        │ Performance      │      │ recommendations  │
        └──────────────────┘      └──────────────────┘
```

### Architecture Flow

1. The user interacts with the React frontend.
2. Frontend requests are sent through REST APIs.
3. JWT authentication is used to secure protected operations.
4. Backend services process the application logic.
5. Redis can be used for performance optimization and fast data access.
6. AI services process relevant study/productivity context and generate personalized assistance.
7. The response is returned to the frontend and displayed to the user.

##  Tech Stack

| Technology               | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| **Java**                 | Backend development                      |
| **Spring Boot**          | REST APIs and backend services           |
| **React**                | Frontend development                     |
| **TypeScript**           | Type-safe frontend development           |
| **MySQL**                | Data persistence                         |
| **Redis**                | Caching and performance optimization     |
| **JWT**                  | Authentication and authorization         |
| **REST APIs**            | Frontend-backend communication           |
| **Grok API**             | AI-powered assistance                    |
| **Google TTS**           | Text-to-speech functionality             |
| **Google Generative AI** | AI-powered study/productivity assistance |
| **Git**                  | Version control                          |

##  Project Structure

```text
Time_Forge/
│
├── public/              # Static assets
│
├── src/                 # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── context/        # React application context
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility/library code
│   ├── pages/          # Application pages
│   ├── services/       # Service/API related logic
│   └── test/           # Test files
│
├── server/             # Server-side functionality
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

The repository currently contains dedicated `src`, `server`, `public`, and configuration directories.

##  Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/tanusingh04/Time_Forge.git
cd Time_Forge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add the required API configuration.

```env
GOOGLE_API_KEY=your_google_api_key
```

Add other project-specific credentials required by the backend and AI services.

### 4. Start the development server

```bash
npm run dev
```

The project uses Vite for development and also includes build, lint, and test scripts.

##  Use Cases

TimeForge can be used by students to:

* Plan daily and weekly study schedules
* Organize assignments and exams
* Track study progress
* Get personalized study recommendations
* Manage productivity tasks
* Receive AI-powered academic assistance
* Improve consistency in study routines

##  Future Enhancements

* Calendar synchronization
* Cloud-based data persistence
* Advanced productivity analytics
* Smart notifications and reminders
* More personalized AI recommendations
* Advanced study-plan optimization

##  Project

**TimeForge – AI-Powered Productivity & Study Management Platform**

Built with a focus on **AI integration, backend APIs, authentication, performance optimization, and a smooth frontend experience**.

---

