import { useState } from 'react'

function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className='z-10'>
      {/* Floating chat button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}

      {/* Sliding sidebar */}
      <div className={`fixed top-0 right-0 h-screen w-96 max-w-full bg-[#0d0d0d] text-white transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} z-[1000] flex flex-col shadow-xl`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <h2 className="text-lg font-semibold">Chat</h2>
          <button
            className="text-white text-xl focus:outline-none"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Placeholder content */}
          <p className="text-gray-400">Welcome to the chat! Ask away.</p>
        </div>
        {/* Input area */}
        <form
          className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: wire API call / message send
          }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWidget 