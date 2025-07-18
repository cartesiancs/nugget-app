import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ChatWidget from './components/ChatWidget'
import AddTestVideosButton from './components/AddTestVideosButton'
import LoginLogoutButton from './components/LoginLogoutButton'
import { AuthProvider } from './context/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Header with login/logout button */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Usuals.ai Editor
                </h1>
              </div>
              <LoginLogoutButton />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          
          <h1 className='text-5xl text-red-500 font-bold underline text-center mb-8'>
            Vite + React
          </h1>
          
          <div className="card text-center mb-8">
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.jsx</code> and save to test HMR
            </p>
          </div>
          
          <ChatWidget />
          
          {/* Stand-alone test button to push sample videos to timeline */}
          <div className="mt-6 text-center">
            <AddTestVideosButton />
          </div>
          
          <p className="read-the-docs text-center mt-8">
            Click on the Vite and React logos to learn more
          </p>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
