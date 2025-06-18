import React, { useState, useEffect } from 'react'
import { useTickets } from '../context/TicketContext'
import { useUser } from '../context/UserContext'
import TicketCard from './TicketCard'
import LoadingSpinner from './LoadingSpinner'

const TicketList = ({ onViewDetails }) => {
  const { tickets, loading } = useTickets()
  const { filterTicketsByUser, currentUser } = useUser()
  
  // Set initial filter based on user role
  const getInitialFilter = () => {
    if (currentUser?.role === 'customer') {
      return 'my_open'
    }
    return 'all'
  }
  
  const [filter, setFilter] = useState(getInitialFilter())
  const [expandedTicketId, setExpandedTicketId] = useState(null)
  
  // Update filter when user changes
  useEffect(() => {
    setFilter(getInitialFilter())
  }, [currentUser?.id])
  
  // Get filtered tickets based on current user and filter
  const filteredTickets = filterTicketsByUser(tickets, filter)

  // Count tickets by status for current user
  const allUserTickets = filterTicketsByUser(tickets, 'all')
  const statusCounts = allUserTickets.reduce((counts, ticket) => {
    counts[ticket.status] = (counts[ticket.status] || 0) + 1
    return counts
  }, {})

  // Update filter options based on user role
  const getFilterOptions = () => {
    if (currentUser?.role === 'customer') {
      // Customers only see their own tickets with simplified filters
      const openCount = allUserTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
      const closedCount = allUserTickets.filter(t => t.status === 'closed').length
      
      return [
        { value: 'my_open', label: `My Open Tickets (${openCount})` },
        { value: 'my_closed', label: `My Closed Tickets (${closedCount})` },
      ]
    } else {
      // Agents and admins see full ticket management options
      const openCount = (statusCounts.open || 0) + (statusCounts['in_progress'] || 0)
      
      const baseOptions = [
        { value: 'all', label: `All Tickets (${allUserTickets.length})` },
        { value: 'open', label: `Open (${openCount})` },
        { value: 'closed', label: `Closed (${statusCounts.closed || 0})` },
      ]

      if (currentUser?.role === 'agent') {
        // For agents, add "My Assigned" filter to see only tickets assigned to them
        const myAssignedCount = tickets.filter(t => t.assigned_to_id === currentUser.id && t.status !== 'closed').length
        baseOptions.splice(2, 0, { value: 'my_assigned', label: `My Assigned (${myAssignedCount})` })
      }
      
      return baseOptions
    }
  }

  const filterOptions = getFilterOptions()

  const handleToggleComments = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId)
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (allUserTickets.length === 0) {
    const noTicketsMessage = currentUser?.role === 'customer' 
      ? "You haven't created any tickets yet."
      : "No tickets available."

    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
        <p className="text-gray-500 mb-4">{noTicketsMessage}</p>
        {currentUser?.role === 'customer' && (
          <p className="text-gray-500">Get started by creating your first support ticket.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Role Info */}
      {currentUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Viewing as: {currentUser.name} ({currentUser.role})
              </p>
              <p className="text-xs text-blue-700">
                {currentUser.role === 'customer' && "You can see your tickets organized by status - open tickets include those in progress."}
                {currentUser.role === 'agent' && "You can see all tickets. 'Open' includes in-progress tickets. Use 'My Assigned' to see tickets assigned to you."}
                {currentUser.role === 'admin' && "You can see all tickets in the system. 'Open' includes in-progress tickets."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Ticket Grid */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {currentUser?.role === 'customer' 
              ? filter === 'my_open' 
                ? "You don't have any open tickets."
                : "You don't have any closed tickets."
              : "No tickets found for the selected filter."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredTickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onViewDetails={onViewDetails}
              isCommentsExpanded={expandedTicketId === ticket.id}
              onToggleComments={() => handleToggleComments(ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TicketList 