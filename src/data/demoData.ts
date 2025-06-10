import { Task } from '@/components/KanbanBoard';
import { Column } from '@/integrations/supabase/types';

export const demoTasks: Record<string, Task[]> = {
  'todo': [
    {
      id: '1',
      title: 'Design new landing page',
      description: 'Create wireframes and mockups for the new homepage',
      importance: true,
      urgency: false,
      assignee: 'John Doe',
      tags: ['design', 'frontend']
    },
    {
      id: '2', 
      title: 'Fix critical bug in payment system',
      description: 'Users cannot complete purchases',
      importance: true,
      urgency: true,
      assignee: 'Jane Smith',
      tags: ['bug', 'critical', 'backend']
    }
  ],
  'in-progress': [
    {
      id: '3',
      title: 'Update social media content',
      description: 'Post daily updates on Twitter and LinkedIn',
      importance: false,
      urgency: true,
      assignee: 'Bob Wilson',
      tags: ['marketing', 'social']
    }
  ],
  'review': [
    {
      id: '4',
      title: 'Organize team meeting notes',
      description: 'Sort and file meeting notes from last quarter',
      importance: false,
      urgency: false,
      assignee: 'Alice Brown',
      tags: ['admin', 'organization']
    }
  ],
  'done': [
    {
      id: '5',
      title: 'Set up development environment',
      description: 'Configure local development setup',
      importance: true,
      urgency: false,
      assignee: 'Tech Lead',
      tags: ['setup', 'development']
    }
  ]
};

export const demoColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    position: 0,
    board_id: 'demo-board',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'in-progress',
    title: 'In Progress', 
    position: 1,
    board_id: 'demo-board',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'review',
    title: 'Review',
    position: 2,
    board_id: 'demo-board',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'done',
    title: 'Done',
    position: 3,
    board_id: 'demo-board',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
