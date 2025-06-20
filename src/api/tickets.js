// Configuration from environment variables
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/v2' // Use proxy in development
  : import.meta.env.VITE_DF_API_BASE_URL // Use direct URL in production
const API_KEY = import.meta.env.VITE_DF_API_KEY
const DB_SERVICE = import.meta.env.VITE_DF_DB_SERVICE || 'pgsqlTDAtest'
const TABLE_NAME = import.meta.env.VITE_DF_TABLE_NAME || 'tickets'

// API request function for DreamFactory
const apiRequest = async (endpoint, options = {}) => {
  // Check if API base URL is available
  if (!API_BASE_URL) {
    throw new Error('DreamFactory API base URL is required. Please set VITE_DF_API_BASE_URL environment variable.')
  }
  
  // Check if API key is available
  if (!API_KEY) {
    throw new Error('DreamFactory API key is required. Please set VITE_DF_API_KEY environment variable.')
  }

  const url = `${API_BASE_URL}${endpoint}`
  
  const headers = {
    'Accept': 'application/json',
    'X-DreamFactory-Api-Key': API_KEY,
  }

  // Only add Content-Type for POST/PUT/PATCH requests
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
    headers['Content-Type'] = 'application/json'
  }

  const config = {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit', // Explicitly set credentials to avoid CORS issues
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    return response.json()
  } catch (error) {
    // If it's a CORS error, provide more helpful debugging info
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`CORS Error: Unable to connect to ${API_BASE_URL}. Please check if CORS is enabled for your domain on the DreamFactory server.`)
    }
    throw error
  }
}

// Helper function to normalize ticket data from DreamFactory response
const normalizeTicket = (ticket) => {
  // Ensure we have valid dates, use current timestamp as fallback
  const now = new Date().toISOString()
  
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority || 'medium',
    requester_id: ticket.requester_id,
    assigned_to_id: ticket.assigned_to_id,
    category_id: ticket.category_id,
    created_at: ticket.created_at || now,
    updated_at: ticket.updated_at || ticket.created_at || now,
  }
}

// Helper function to normalize comment data from DreamFactory response
const normalizeComment = (comment) => {
  return {
    id: comment.id,
    ticket_id: comment.ticket_id,
    user_id: comment.user_id,
    comment: comment.comment,
    created_at: comment.created_at || new Date().toISOString(),
  }
}

// Helper function to normalize user data from DreamFactory response
const normalizeUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
    created_at: user.created_at,
  }
}

// TICKET API FUNCTIONS

export const getTickets = async () => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}`)
  const tickets = response.resource.map(normalizeTicket)
  return tickets
}

export const createTicket = async (ticketData) => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}`, {
    method: 'POST',
    body: JSON.stringify({
      resource: [ticketData]
    })
  })
  
  const createdTicket = response.resource[0]
  
  // If the response doesn't include all fields, fetch the complete ticket
  if (!createdTicket.created_at || !createdTicket.updated_at) {
    const completeTicket = await getTicketById(createdTicket.id)
    return completeTicket
  }
  
  return normalizeTicket(createdTicket)
}

export const updateTicket = async (id, updateData) => {
  // Try with PUT method first (DreamFactory often prefers PUT over PATCH)
  try {
    const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
    
    // If response only contains ID, fetch the complete updated ticket
    if (response && Object.keys(response).length <= 2) {
      const completeTicket = await getTicketById(id)
      return completeTicket
    }
    
    return normalizeTicket(response)
  } catch (putError) {
    console.log('PUT failed, trying PATCH:', putError.message)
    
    // If PUT fails, try PATCH without resource wrapper first
    try {
      const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      // If response only contains ID, fetch the complete updated ticket
      if (response && Object.keys(response).length <= 2) {
        const completeTicket = await getTicketById(id)
        return completeTicket
      }
      
      return normalizeTicket(response)
    } catch (patchError) {
      console.log('PATCH (simple) failed, trying with resource wrapper:', patchError.message)
      
      // Last resort: try PATCH with resource wrapper
      const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resource: [updateData]
        })
      })
      
      // Response might be wrapped in resource array
      const updatedTicket = response.resource ? response.resource[0] : response
      
      // If response only contains ID, fetch the complete updated ticket
      if (updatedTicket && Object.keys(updatedTicket).length <= 2) {
        const completeTicket = await getTicketById(id)
        return completeTicket
      }
      
      return normalizeTicket(updatedTicket)
    }
  }
}

export const deleteTicket = async (id) => {
  await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}/${id}`, {
    method: 'DELETE'
  })
  
  return { success: true }
}

// Helper function to get ticket status options
export const getTicketStatusOptions = () => [
  { value: 'open', label: 'Open', color: 'bg-red-100 text-red-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
]

// Helper function to get priority options
export const getPriorityOptions = () => [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
]

// COMMENT API FUNCTIONS

export const getTicketComments = async (ticketId) => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/ticket_comments?filter=ticket_id=${ticketId}`)
  
  const comments = response.resource
    .map(normalizeComment)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  return comments
}

export const createComment = async (commentData) => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/ticket_comments`, {
    method: 'POST',
    body: JSON.stringify({
      resource: [commentData]
    })
  })
  
  const createdComment = response.resource[0]
  
  // Ensure we return complete comment data
  const completeComment = {
    id: createdComment.id,
    ticket_id: commentData.ticket_id,
    user_id: commentData.user_id,
    comment: commentData.comment,
    created_at: createdComment.created_at || new Date().toISOString()
  }
  
  return normalizeComment(completeComment)
}

// Auto-assignment helper: Assign ticket to first agent who comments
export const createCommentWithAutoAssignment = async (commentData, currentUser) => {
  // First, create the comment
  const comment = await createComment(commentData)
  
  // Check if the commenter is an agent and if the ticket is unassigned
  if (currentUser && currentUser.role === 'agent') {
    // Get the current ticket to check assignment status
    const ticket = await getTicketById(commentData.ticket_id)
    
    // If ticket is not assigned, assign it to the commenting agent
    if (!ticket.assigned_to_id) {
      await updateTicket(commentData.ticket_id, { 
        assigned_to_id: currentUser.id 
      })
    }
  }
  
  return comment
}

export const getAllComments = async () => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/ticket_comments`)
  const comments = response.resource.map(normalizeComment)
  return comments
}

// USER API FUNCTIONS

export const getUsers = async () => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/users`)
  const users = response.resource.map(normalizeUser)
  return users
}

export const getUserById = async (userId) => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/users/${userId}`)
  return normalizeUser(response)
}

// Helper function to get a single ticket by ID
export const getTicketById = async (ticketId) => {
  const response = await apiRequest(`/${DB_SERVICE}/_table/${TABLE_NAME}/${ticketId}`)
  return normalizeTicket(response)
} 