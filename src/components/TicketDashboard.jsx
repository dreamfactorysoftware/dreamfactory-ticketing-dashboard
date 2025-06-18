import React, { useEffect, useState } from 'react'
import { useTickets } from '../context/TicketContext'
import TicketList from './TicketList'
import TicketForm from './TicketForm'
import TicketDetails from './TicketDetails'
import ErrorMessage from './ErrorMessage'
import LoadingSpinner from './LoadingSpinner'
import { Plus } from 'lucide-react'

const TicketDashboard = () => {
  const { 
    loading, 
    error, 
    isFormOpen, 
    editingTicket, 
    openForm, 
    closeForm,
    clearError,
    loadTickets
  } = useTickets()
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    loadTickets()
  }, [])

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket)
  }

  const handleBackToList = () => {
    setSelectedTicket(null)
  }

  if (selectedTicket) {
    return (
      <TicketDetails 
        ticket={selectedTicket} 
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
          <p className="text-gray-600 mt-1">
            Manage your support tickets and track their progress
          </p>
        </div>
        <button
          onClick={openForm}
          className="btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          <Plus className="h-5 w-5" />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={clearError}
        />
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Ticket List */}
      <TicketList onViewDetails={handleViewDetails} />

      {/* Ticket Form Modal */}
      {(isFormOpen || editingTicket) && (
        <TicketForm 
          isOpen={isFormOpen || !!editingTicket}
          onClose={closeForm}
          ticket={editingTicket}
        />
      )}
    </div>
  )
}

export default TicketDashboard 