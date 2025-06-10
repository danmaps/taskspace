# TaskSpace - Eisenhower Matrix Kanban Board

A modern, intuitive Kanban board application that implements the Eisenhower Matrix methodology for task prioritization and productivity management.

## Features

- **Eisenhower Matrix Integration**: Organize tasks by urgency and importance with four dedicated quadrants
- **Default Boards**: Every new user gets three default boards (Work, Personal, Home) with pre-configured Eisenhower Matrix columns
- **Real-time Collaboration**: Live updates across multiple users via Supabase real-time subscriptions
- **Drag & Drop Interface**: Intuitive task management with smooth animations using @hello-pangea/dnd
- **Board Management**: Create, edit, delete, and reorder boards with position-based ordering
- **Multiple Boards**: Create unlimited additional project boards beyond the defaults
- **Inline Editing**: Edit board titles, column names, and task details directly in place
- **Task Management**: Create tasks with title, description, importance/urgency flags, assignee, due dates, and tags
- **User Authentication**: Secure login with Supabase Auth and row-level security
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Beautiful UI**: Modern design with Tailwind CSS and shadcn/ui components
- **Database Migrations**: Automated database setup with proper schema evolution

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Drag & Drop**: @hello-pangea/dnd
- **State Management**: React Hooks, Context API, TanStack Query
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd matrix-kanban-flow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Setup

The application includes comprehensive Supabase migrations that automatically set up the database schema:

- **Migration 1**: Creates core tables (`boards`, `columns`, `tasks`) with proper relationships and RLS policies
- **Migration 2**: Adds importance/urgency boolean fields for Eisenhower Matrix functionality  
- **Migration 3**: Creates default boards for existing users and sets up automatic board creation for new users
- **Migration 4**: Adds position fields for drag-and-drop board ordering
- **Migration 5**: Updates default board creation to include proper positioning

### Database Tables

- `boards` - Project boards with user ownership and positioning
- `columns` - Board columns representing Eisenhower Matrix quadrants
- `tasks` - Individual tasks with importance/urgency flags, descriptions, assignees, due dates, and tags
- `profiles` - User profiles linked to authentication

### Running Migrations

```bash
npx supabase db push
```

## Usage

1. **Sign up/Login**: Create an account or sign in with Supabase Auth
2. **Default Boards**: Start with pre-created Work, Personal, and Home boards
3. **Eisenhower Matrix**: Each board has four columns:
   - **Do First** (Urgent & Important) - Critical tasks requiring immediate attention
   - **Schedule** (Important, Not Urgent) - Important tasks to plan and schedule
   - **Delegate** (Urgent, Not Important) - Tasks that can be delegated to others
   - **Eliminate** (Neither Urgent nor Important) - Tasks to consider removing
4. **Task Management**:
   - Create tasks with rich details (title, description, assignee, due date, tags)
   - Mark tasks as important and/or urgent to categorize them properly
   - Drag and drop tasks between columns and reorder within columns
5. **Board Management**:
   - Create additional boards beyond the three defaults
   - Rename boards and columns using inline editing
   - Reorder boards in the sidebar
6. **Real-time Collaboration**: See changes from other users instantly via Supabase real-time subscriptions

## Project Structure

```bash
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui component library
│   ├── AddTaskDialog.tsx # Task creation modal
│   ├── BoardSidebar.tsx # Board navigation sidebar
│   ├── KanbanBoard.tsx # Main board component with drag & drop
│   └── TaskCard.tsx    # Individual task cards
├── hooks/              # Custom React hooks
│   ├── useBoards.ts    # Board CRUD operations
│   ├── useColumns.ts   # Column management
│   ├── useKanbanBoard.ts # Main board data hook with real-time updates
│   ├── useTasks.ts     # Task operations
│   └── use-*.ts        # Additional utility hooks
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication provider
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── pages/              # Page components
│   ├── Auth.tsx        # Authentication page
│   ├── Index.tsx       # Main application page
│   └── NotFound.tsx    # 404 page
├── lib/                # Utilities and configuration
│   └── utils.ts        # Common utility functions
└── main.tsx            # Application entry point
supabase/
├── config.toml         # Supabase configuration
└── migrations/         # Database schema migrations
    ├── 20250610161000-create-kanban-tables.sql
    ├── 20250610162000-add-importance-urgency-fields.sql
    ├── 20250610163000-create-default-boards.sql
    ├── 20250610164000-add-board-position.sql
    └── 20250610165000-update-default-boards-with-position.sql
```

## Development

### Package Manager
This project uses Bun as the package manager for faster installation and execution.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Getting Started Locally

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Set up environment variables (see Installation section above)

# Start development server
npm run dev
```

## Technologies Used

This project is built with:

- **Framework**: Vite + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Drag & Drop**: @hello-pangea/dnd
- **State Management**: TanStack Query + React Context
- **Forms**: React Hook Form + Zod validation

## Deployment

This project can be deployed to any platform that supports Node.js applications:

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Deploy with build command `npm run build`
- **Railway**: Deploy with automatic Dockerfile detection
- **Supabase**: Use Supabase hosting for full-stack deployment

Make sure to set up your environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.
