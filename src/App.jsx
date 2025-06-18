import React from 'react'
import { TicketProvider } from './context/TicketContext'
import { UserProvider } from './context/UserContext'
import Header from './components/Header'
import TicketDashboard from './components/TicketDashboard'

function App() {
  return (
    <UserProvider>
      <TicketProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TicketDashboard />
          </main>
        </div>
      </TicketProvider>
    </UserProvider>
  )
}

export default App 