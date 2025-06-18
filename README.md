# Ticketing Dashboard

A modern React ticketing dashboard with full CRUD functionality built for DreamFactory. Features ticket management, multi-user support, and real-time commenting.

## Features

- Complete ticket management (Create, Read, Update, Delete)
- Multi-user support with role-based permissions (Requesters and Agents)
- Real-time commenting system with auto-assignment
- Modern, responsive UI with Tailwind CSS
- DreamFactory API integration
- Netlify deployment ready

## User Roles

The app supports different user roles:

- **Requesters**: Can create tickets and view their own tickets
- **Agents**: Can view all tickets, comment, and get auto-assigned when they comment on unassigned tickets

Use the user dropdown in the top-right to switch between different users for testing.

## Database Schema

The app works with these DreamFactory database tables:

- `tickets` - Main tickets table
- `users` - User management  
- `ticket_comments` - Comments on tickets
- `categories` - Ticket categories

## Deployment

### Build for Production
```bash
npm run build
```

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- DreamFactory API