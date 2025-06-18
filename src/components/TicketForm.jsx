import React, { useState, useEffect } from 'react'
import { useTickets } from '../context/TicketContext'
import { useUser } from '../context/UserContext'
import { getTicketStatusOptions } from '../api/tickets'
import { X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const TicketForm = ({ isOpen, onClose, ticket = null }) => {
  const { addTicket, editTicket, loading } = useTickets()
  const { currentUser } = useUser()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open'
  })
  const [errors, setErrors] = useState({})

  const statusOptions = getTicketStatusOptions()
  const isEditing = !!ticket

  // Initialize form data when ticket prop changes
  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        status: ticket.status || 'open'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'open'
      })
    }
    setErrors({})
  }, [ticket])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long'
    }

    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (isEditing) {
        await editTicket(ticket.id, formData)
      } else {
        // Prepare ticket data with auto-assignment logic
        const ticketData = {
          ...formData,
          requester_id: currentUser?.id,
        }

        // Auto-assignment logic: If current user is an agent, assign to them
        if (currentUser && (currentUser.role === 'agent' || currentUser.role === 'admin')) {
          ticketData.assigned_to_id = currentUser.id
        }
        // If customer creates ticket, assigned_to_id remains null (will be assigned when first agent comments)

        await addTicket(ticketData)
      }
      onClose()
    } catch (error) {
      // Error handling is done in the context
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: 'open'
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter ticket title..."
              disabled={loading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe the issue or request in detail..."
              disabled={loading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Status Field */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={`input-field ${errors.status ? 'border-red-500' : ''}`}
              disabled={loading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{isEditing ? 'Update Ticket' : 'Create Ticket'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TicketForm 