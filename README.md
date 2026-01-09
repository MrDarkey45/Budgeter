# Budgeter

A personal budgeting application to track income, expenses, bills, and savings goals.

## Features

- **Transaction Tracking** - Log income and expenses with categories
- **Recurring Bills** - Set up monthly, quarterly, or yearly bills with due date reminders
- **Budget Limits** - Set monthly spending limits per category and track progress
- **Dashboard** - Overview of monthly income, expenses, savings, and upcoming bills
- **Reports** - Visualize spending by category and track trends over time
- **Dark Mode** - Toggle between light and dark themes
- **Search & Filtering** - Find transactions by description, category, date range, or type
- **Pagination & Sorting** - Handle large datasets efficiently

## Tech Stack

- **Frontend**: React, TypeScript, Material UI, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via sql.js)
- **Build Tools**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/budgeter.git
cd budgeter

# Install dependencies
npm install
```

### Running the Application

```bash
# Start both frontend and backend
npm run dev
```

Or run them separately:

```bash
# Backend only (http://localhost:3001)
npm run dev:server

# Frontend only (http://localhost:5173)
npm run dev:client
```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
budgeter/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript interfaces
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database models
│   │   └── db/             # Database setup
│   └── package.json
└── package.json            # Root workspace config
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category |
| GET | `/api/transactions` | List transactions (supports filters) |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/bills` | List recurring bills |
| POST | `/api/bills` | Create a recurring bill |
| POST | `/api/bills/:id/pay` | Record a bill payment |
| GET | `/api/budgets?month=YYYY-MM` | Get budgets for a month |
| POST | `/api/budgets` | Set a budget |
| GET | `/api/budgets/summary?month=YYYY-MM` | Get budget vs spending summary |
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/reports/spending` | Spending by category report |
| GET | `/api/reports/trends` | Monthly trends report |

## License

MIT
