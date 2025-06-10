# TaskFlow - Eisenhower Matrix Kanban Board

A modern, intuitive Kanban board application that implements the Eisenhower Matrix methodology for task prioritization and productivity management.

## Features

- **Eisenhower Matrix Integration**: Organize tasks by urgency and importance
- **Real-time Collaboration**: Live updates across multiple users via Supabase
- **Drag & Drop Interface**: Intuitive task management with smooth animations
- **Default Boards**: Every user gets three default boards (Work, Personal, Home)
- **Board Reordering**: Drag and drop boards to customize their order in the sidebar
- **Multiple Boards**: Create and manage additional project boards
- **Inline Editing**: Edit board titles, column names, and task details directly
- **User Authentication**: Secure login with Supabase Auth
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Beautiful UI**: Modern design with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Drag & Drop**: @hello-pangea/dnd
- **State Management**: React Hooks & Context

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
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Setup

The application includes Supabase migrations that will create the necessary tables:
- `boards` - Project boards
- `columns` - Board columns
- `tasks` - Individual tasks

Run the migrations:
```bash
npx supabase db push
```

## Usage

1. **Sign up/Login**: Create an account or sign in
2. **Create Boards**: Add new project boards
3. **Organize Tasks**: Use the four Eisenhower Matrix quadrants:
   - Urgent & Important (Do First)
   - Important, Not Urgent (Schedule)
   - Urgent, Not Important (Delegate)
   - Neither Urgent nor Important (Eliminate)
4. **Drag & Drop**: Move tasks between columns and reorder them
5. **Inline Editing**: Click on any text to edit boards, columns, or tasks
6. **Real-time Updates**: See changes from other users instantly

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── KanbanBoard.tsx # Main board component
│   ├── TaskCard.tsx    # Individual task cards
│   └── BoardSidebar.tsx # Board navigation
├── hooks/              # Custom React hooks
├── contexts/           # React contexts (Auth)
├── integrations/       # Supabase integration
├── pages/              # Page components
└── lib/                # Utilities
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/75115513-59ec-46fa-b6ef-d4eb707b1e8a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
