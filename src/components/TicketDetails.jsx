import React, { useState, useEffect } from 'react'
import { ArrowLeft, MessageCircle, Send, User } from 'lucide-react'
import { getTicketComments, createCommentWithAutoAssignment } from '../api/tickets'
import { useTickets } from '../context/TicketContext'
import { useUser } from '../context/UserContext'
import LoadingSpinner from './LoadingSpinner'

const TicketDetails = ({ ticket, onBack }) => {
  const { editTicket, loadTickets } = useTickets()
  const { currentUser, getUserRole } = useUser()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ticket) {
      loadComments()
    }
  }, [ticket])

  const loadComments = async () => {
    try {
      setLoading(true)
      const fetchedComments = await getTicketComments(ticket.id)
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    try {
      setSubmitting(true)
      
      const commentData = {
        ticket_id: ticket.id,
        user_id: currentUser.id,
        comment: newComment.trim(),
      }

      // Use the auto-assignment version of createComment
      const createdComment = await createCommentWithAutoAssignment(commentData, currentUser)
      
      // Ensure the comment has all required fields
      const commentWithCompleteData = {
        id: createdComment.id,
        ticket_id: ticket.id, // Ensure we have the ticket_id
        user_id: currentUser.id, // Ensure we have the user_id
        comment: newComment.trim(), // Use the original comment text
        created_at: createdComment.created_at || new Date().toISOString()
      }
      
      setComments(prev => [...prev, commentWithCompleteData])
      setNewComment('')
      
      // Reload tickets to reflect any assignment changes
      await loadTickets()
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Invalid date'
    }
    
    return date.toLocaleString()
  }

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getUserRoleDisplay = (userId) => {
    return getUserRole(userId)
  }

  if (!ticket) return null

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </button>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {ticket.title}
              </h1>
              <p className="text-gray-600 mb-4">{ticket.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          {/* Assignment Information */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4 p-4 bg-gray-50 rounded-lg">
            {/* Requester */}
            {ticket.requester_id && (
              <div className="flex items-center">
                <span className="text-gray-500">Created by:</span>
                <span className="ml-2 font-medium">
                  {getUserRoleDisplay(ticket.requester_id).name}
                  <span className="text-xs text-gray-400 ml-1">
                    ({getUserRoleDisplay(ticket.requester_id).role})
                  </span>
                </span>
              </div>
            )}
            
            {/* Assigned To */}
            <div className="flex items-center">
              <span className="text-gray-500">Assigned to:</span>
              {ticket.assigned_to_id ? (
                <span className="ml-2 font-medium text-blue-600">
                  {getUserRoleDisplay(ticket.assigned_to_id).name}
                  <span className="text-xs text-blue-400 ml-1">
                    ({getUserRoleDisplay(ticket.assigned_to_id).role})
                  </span>
                </span>
              ) : (
                <span className="ml-2 text-orange-600 font-medium">Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {formatDate(ticket.created_at)}</span>
            <span>Updated: {formatDate(ticket.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>
        </div>

        {/* Comments List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const user = getUserRoleDisplay(comment.user_id)
                const isAgent = user.role === 'agent'

                return (
                  <div
                    key={comment.id}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-md ${isAgent ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-lg p-4 ${
                        isAgent 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isAgent ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                    {isAgent && (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white order-1 mr-3 mt-4">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    {!isAgent && (
                      <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white order-2 ml-3 mt-4">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t p-6">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment
              </label>
              <textarea
                id="comment"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TicketDetails 