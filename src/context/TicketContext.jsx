import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { getTickets, createTicket, updateTicket, deleteTicket } from '../api/tickets'

// Initial state
const initialState = {
  tickets: [],
  loading: false,
  error: null,
  isFormOpen: false,
  editingTicket: null,
}

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_TICKETS: 'SET_TICKETS',
  SET_ERROR: 'SET_ERROR',
  ADD_TICKET: 'ADD_TICKET',
  UPDATE_TICKET: 'UPDATE_TICKET',
  DELETE_TICKET: 'DELETE_TICKET',
  OPEN_FORM: 'OPEN_FORM',
  CLOSE_FORM: 'CLOSE_FORM',
  SET_EDITING_TICKET: 'SET_EDITING_TICKET',
}

// Reducer function
const ticketReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    case ACTIONS.SET_TICKETS:
      return { ...state, tickets: action.payload, loading: false, error: null }
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    case ACTIONS.ADD_TICKET:
      return { 
        ...state, 
        tickets: [action.payload, ...state.tickets],
        isFormOpen: false,
        loading: false,
        error: null
      }
    case ACTIONS.UPDATE_TICKET:
      return {
        ...state,
        tickets: state.tickets.map(ticket => 
          ticket.id === action.payload.id ? action.payload : ticket
        ),
        editingTicket: null,
        loading: false,
        error: null
      }
    case ACTIONS.DELETE_TICKET:
      return {
        ...state,
        tickets: state.tickets.filter(ticket => ticket.id !== action.payload),
        loading: false,
        error: null
      }
    case ACTIONS.OPEN_FORM:
      return { ...state, isFormOpen: true, editingTicket: null }
    case ACTIONS.CLOSE_FORM:
      return { ...state, isFormOpen: false, editingTicket: null }
    case ACTIONS.SET_EDITING_TICKET:
      return { ...state, editingTicket: action.payload, isFormOpen: false }
    default:
      return state
  }
}

// Create context
const TicketContext = createContext()

// Custom hook to use the context
export const useTickets = () => {
  const context = useContext(TicketContext)
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider')
  }
  return context
}

// Provider component
export const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ticketReducer, initialState)

  // Load tickets on mount
  useEffect(() => {
    loadTickets()
  }, [])

  // Action creators
  const loadTickets = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      const tickets = await getTickets()
      dispatch({ type: ACTIONS.SET_TICKETS, payload: tickets })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const addTicket = async (ticketData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      const newTicket = await createTicket(ticketData)
      dispatch({ type: ACTIONS.ADD_TICKET, payload: newTicket })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const editTicket = async (id, updateData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      const updatedTicket = await updateTicket(id, updateData)
      dispatch({ type: ACTIONS.UPDATE_TICKET, payload: updatedTicket })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const removeTicket = async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      await deleteTicket(id)
      dispatch({ type: ACTIONS.DELETE_TICKET, payload: id })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const openForm = () => {
    dispatch({ type: ACTIONS.OPEN_FORM })
  }

  const closeForm = () => {
    dispatch({ type: ACTIONS.CLOSE_FORM })
  }

  const setEditingTicket = (ticket) => {
    dispatch({ type: ACTIONS.SET_EDITING_TICKET, payload: ticket })
  }

  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
  }

  const value = {
    ...state,
    loadTickets,
    addTicket,
    editTicket,
    removeTicket,
    openForm,
    closeForm,
    setEditingTicket,
    clearError,
  }

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  )
} 