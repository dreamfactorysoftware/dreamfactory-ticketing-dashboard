import React, { createContext, useContext, useState, useEffect } from 'react'
import { getUsers, getUserById } from '../api/tickets'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load users on mount and set default user
  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
      
      // Set default user to Bob Johnson (agent with id: 2)
      const defaultUser = fetchedUsers.find(user => user.id === 2)
      
      if (defaultUser) {
        setCurrentUser(defaultUser)
      } else {
        // Fallback to first agent if Bob not found
        const firstAgent = fetchedUsers.find(user => user.role === 'agent')
        setCurrentUser(firstAgent || fetchedUsers[0])
      }
    } catch (err) {
      setError('Failed to load users')
      console.error('UserContext: Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const switchUser = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      const user = await getUserById(userId)
      setCurrentUser(user)
    } catch (err) {
      setError('Failed to switch user')
      console.error('Error switching user:', err)
    } finally {
      setLoading(false)
    }
  }

  const isAgent = () => {
    return currentUser && currentUser.role === 'agent'
  }

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin'
  }

  const isRequester = () => {
    return currentUser && currentUser.role === 'requester'
  }

  // Get user role display info from loaded users (synchronous)
  const getUserRole = (userId) => {
    if (!userId) {
      return { name: 'Unknown User', role: 'requester', department: null }
    }
    
    // If no users are loaded, trigger a reload (but return fallback for now)
    if (users.length === 0) {
      loadUsers() // This is async but we return fallback immediately
      return { name: `Loading User #${userId}`, role: 'requester', department: null }
    }
    
    const user = users.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return { name: `User #${userId}`, role: 'requester', department: null }
    }
    
    return {
      name: user.name || 'Unknown User',
      role: user.role || 'requester',
      department: user.department || null
    }
  }

  // Filter tickets based on user role and permissions
  const filterTicketsByUser = (tickets, filter = 'all') => {
    if (!currentUser || !tickets) return []

    let filteredTickets = [...tickets]

    // Role-based filtering - requesters only see their own tickets
    if (currentUser.role === 'requester') {
      // Requesters only see tickets they created (where they are the requester)
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.requester_id === currentUser.id
      )
      
      // Apply requester-specific filters
      if (filter === 'my_open') {
        filteredTickets = filteredTickets.filter(ticket => 
          ticket.status === 'open' || ticket.status === 'in_progress'
        )
      } else if (filter === 'my_closed') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === 'closed')
      }
    } else if (currentUser.role === 'agent') {
      // Agent-specific filtering
      switch (filter) {
        case 'all':
          // Agents can see all tickets
          break
        case 'open':
          // For agents, "open" includes both open and in_progress tickets
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.status === 'open' || ticket.status === 'in_progress'
          )
          break
        case 'my_assigned':
          // Agents only see tickets assigned to them (excluding closed)
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.assigned_to_id === currentUser.id && ticket.status !== 'closed'
          )
          break
        case 'closed':
          filteredTickets = filteredTickets.filter(ticket => ticket.status === 'closed')
          break
        default:
          // Apply standard status filter for any other filters
          if (filter !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === filter)
          }
          break
      }
    } else {
      // Admins see everything - apply standard status filters
      switch (filter) {
        case 'open':
          // For admins, "open" also includes in_progress tickets
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.status === 'open' || ticket.status === 'in_progress'
          )
          break
        case 'all':
          // No additional filtering needed
          break
        default:
          // Apply status filter for specific statuses
          if (filter !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === filter)
          }
          break
      }
    }

    return filteredTickets
  }

  const value = {
    currentUser,
    users,
    loading,
    error,
    switchUser,
    loadUsers,
    isAgent,
    isAdmin,
    isRequester,
    getUserRole,
    filterTicketsByUser,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export default UserContext 