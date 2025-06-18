import React, { useState, useEffect } from 'react'
import { useTickets } from '../context/TicketContext'
import { useUser } from '../context/UserContext'
import { getTicketStatusOptions, getTicketComments, createCommentWithAutoAssignment } from '../api/tickets'
import { Edit2, Trash2, Calendar, Clock, MessageCircle, Eye, ChevronDown, ChevronUp, Send } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import ConfirmDialog from './ConfirmDialog'

const TicketCard = ({ ticket, onViewDetails, isCommentsExpanded, onToggleComments }) => {
  const { editTicket, removeTicket, setEditingTicket, loading, loadTickets } = useTickets()
  const { currentUser, getUserRole } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState(ticket.status)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // Comments state - simplified since expansion is managed by parent
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  
  const statusOptions = getTicketStatusOptions()
  const currentStatus = statusOptions.find(s => s.value === ticket.status) || statusOptions[0]

  // Load only comment count on mount
  useEffect(() => {
    loadCommentCount()
  }, [ticket.id])

  // Reset state when ticket changes
  useEffect(() => {
    setCommentsLoaded(false)
    setComments([])
    setCommentCount(0)
    setNewComment('')
  }, [ticket.id])

  // Load comments when expanded
  useEffect(() => {
    if (isCommentsExpanded && !commentsLoaded) {
      loadCommentsExpanded()
    }
  }, [isCommentsExpanded, commentsLoaded])

  const loadCommentCount = async () => {
    try {
      const fetchedComments = await getTicketComments(ticket.id)
      setCommentCount(fetchedComments.length)
    } catch (error) {
      console.error('Error loading comment count:', error)
      setCommentCount(0)
    }
  }

  const loadCommentsExpanded = async () => {
    setCommentsLoading(true)
    try {
      const fetchedComments = await getTicketComments(ticket.id)
      setComments(fetchedComments)
      setCommentCount(fetchedComments.length)
      setCommentsLoaded(true)
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleCommentsToggle = () => {
    onToggleComments()
    // If expanding and not loaded, comments will be loaded by useEffect
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    try {
      setSubmittingComment(true)
      const commentData = {
        ticket_id: ticket.id,
        user_id: currentUser.id,
        comment: newComment.trim(),
      }

      // Use the auto-assignment version of createComment
      const createdComment = await createCommentWithAutoAssignment(commentData, currentUser)
      
      // Add the new comment with proper timestamp if missing
      const commentWithProperData = {
        ...createdComment,
        created_at: createdComment.created_at || new Date().toISOString()
      }
      
      setComments(prev => [...prev, commentWithProperData])
      setCommentCount(prev => prev + 1)
      setNewComment('')
      
      // Reload tickets to reflect any assignment changes
      await loadTickets()
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Invalid date'
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCommentDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid comment date string:', dateString)
      return 'Invalid date'
    }
    
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getUserRoleDisplay = (userId) => {
    return getUserRole(userId)
  }

  const handleStatusUpdate = async () => {
    if (editStatus !== ticket.status) {
      try {
        setUpdating(true)
        await editTicket(ticket.id, { status: editStatus })
      } catch (error) {
        console.error('Error updating ticket status:', error)
      } finally {
        setUpdating(false)
      }
    }
    setIsEditing(false)
  }

  const handleEdit = () => {
    setEditingTicket(ticket)
  }

  const handleDelete = async () => {
    try {
      await removeTicket(ticket.id)
    } catch (error) {
      console.error('Error deleting ticket:', error)
    }
    setShowDeleteConfirm(false)
  }

  const handleCancelEdit = () => {
    setEditStatus(ticket.status)
    setIsEditing(false)
  }

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.color : 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {ticket.title}
            </h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="truncate">
                Created {formatDate(ticket.created_at)}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => onViewDetails(ticket)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={handleEdit}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="Edit ticket"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete ticket"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {ticket.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Status */}
          <div className="flex items-center">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading || updating}
                  className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  {updating ? <LoadingSpinner size="sm" /> : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.color} hover:opacity-80 transition-opacity`}
                title="Click to edit status"
              >
                {currentStatus.label}
              </button>
            )}
          </div>

          {/* Comment Count - Clickable */}
          <button
            onClick={handleCommentsToggle}
            className="flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors"
            title={`${commentCount} comments - Click to ${isCommentsExpanded ? 'hide' : 'show'}`}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            <span>{commentCount} Comment{commentCount !== 1 ? 's' : ''}</span>
            {isCommentsExpanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </button>

          {/* Last Updated */}
          {ticket.updated_at !== ticket.created_at && (
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              <span>Updated {formatDate(ticket.updated_at)}</span>
            </div>
          )}
        </div>

        {/* Expandable Comments Section */}
        {isCommentsExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                {/* Recent Comments */}
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Recent Comments {comments.length > 3 && `(${Math.min(3, comments.length)} of ${comments.length})`}
                    </h4>
                    {comments.slice(-3).map((comment) => {
                      const user = getUserRoleDisplay(comment.user_id)
                      const isAgent = user.role === 'agent'
                      
                      return (
                        <div key={comment.id} className="flex space-x-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isAgent ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{formatCommentDate(comment.created_at)}</p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                          </div>
                        </div>
                      )
                    })}
                    {comments.length > 3 && (
                      <button
                        onClick={() => onViewDetails(ticket)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View all {comments.length} comments →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No comments yet.</p>
                )}

                {/* Quick Comment Form */}
                <form onSubmit={handleSubmitComment} className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a quick comment..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => onViewDetails(ticket)}
                      type="button"
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      View full conversation
                    </button>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="btn-primary text-xs px-3 py-1 flex items-center disabled:opacity-50"
                    >
                      {submittingComment ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Post
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={loading}
        variant="danger"
      />
    </>
  )
}

export default TicketCard 