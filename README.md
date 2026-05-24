# AI Placement Prep Tracker 🚀

**🌍 Live Demo:** [https://ai-prep-tracker-lyart.vercel.app/](https://ai-prep-tracker-lyart.vercel.app/)

A comprehensive, AI-powered dashboard designed for software engineering students and professionals to track their tech placement preparation. This platform centralizes Data Structures & Algorithms (DSA) tracking, contest performance, project management, and interview preparation with advanced AI tooling.

![Dashboard Preview](./dashboard.png)

## ✨ Key Features

### 📊 Core Tracking Modules
- **DSA Problem Tracker**: Log your LeetCode, Codeforces, and CodeChef problems. Tag them by topic, difficulty, and status.
- **Analytics & Heatmaps**: Visualize your progress with a GitHub-style daily activity heatmap, Recharts-powered topic distribution pie charts, and weekly velocity bar charts.
- **Project Kanban Board**: Drag-and-drop Kanban board to manage your portfolio projects from `Idea` -> `In Progress` -> `Completed` -> `Deployed`.
- **Contest Logger**: Track your contest ratings across multiple platforms over time.
- **Resume Manager**: Upload and version-control your ATS-friendly resume PDFs via Vercel Blob.

### 🤖 Google Gemini AI Integrations
Powered by the `@google/generative-ai` SDK (`gemini-3.5-flash` and `gemini-3.1-pro`):
- **AI Mock Interviewer**: A streaming chat interface that acts as a strict FAANG interviewer. It asks medium-hard DSA questions, evaluates your approach, and scores your performance out of 10.
- **AI Question Bank**: Generate custom practice questions tailored to specific topics complete with hidden hints.
- **AI Roadmap Generator**: Input your target company (e.g., Google), role, and timeline (e.g., 3 months). The AI generates a customized, week-by-week study curriculum with checkbox tracking.
- **Weak Topic Analyzer**: Scans your DSA logs to identify your lowest-performing topics and generates a targeted 7-day practice plan to fix the gap.
- **Resume Bullet Generator**: Instantly generate high-impact, action-verb-driven resume bullet points for your projects based on their description and tech stack.

### 🎨 Modern UI/UX
- Built with **shadcn/ui** and **Tailwind CSS**.
- Fully responsive design.
- **Dark/Light Mode** toggle.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Google OAuth)
- **Storage**: Vercel Blob
- **Charts/Data Vis**: Recharts
- **Drag & Drop**: @dnd-kit/core
- **AI**: Google Generative AI SDK

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/DEVANGDIXIT04/AI-Prep-Tracker.git
cd AI-Prep-Tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
# Database
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your_random_secret_string"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Vercel Blob (for Resumes)
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Setup the Database
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
npx prisma generate
```

### 5. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment
This project is optimized for deployment on **Vercel**. 
1. Import the repository into Vercel.
2. Add your `.env` variables in the Vercel project settings.
3. Deploy! (Don't forget to update your Google OAuth Authorized URIs with your new live Vercel domain).
