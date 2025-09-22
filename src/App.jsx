import { useState, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import * as yup from 'yup'

// Character limits
const NAME_MAX_LENGTH = 20
const MESSAGE_MAX_LENGTH = 500
const NAME_MIN_LENGTH = 2
const MESSAGE_MIN_LENGTH = 1

// validation schema
const schema = yup.object({
  userName: yup.string().trim().required('Name required').min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  messageInput: yup.string().trim().required('Message required').min(MESSAGE_MIN_LENGTH).max(MESSAGE_MAX_LENGTH),
})

function App() {
  const [connection, setConnection] = useState(null)
  const [messages, setMessages] = useState([])
  const [userName, setUserName] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize SignalR connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5002/chatHub')
      .withAutomaticReconnect()
      .build()

    setConnection(newConnection)
  }, [])

  // Start connection
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          setConnected(true)
          console.log('Connected to SignalR')
        })
        .catch(err => {
          console.error('Connection failed: ', err)
          setConnected(false)
        })

      connection.on('ReceiveMessage', (user, message) => {
        setMessages(prev => [...prev, { 
          user, 
          message, 
          id: Date.now()
        }])
      })

      connection.onreconnected(() => setConnected(true))
      connection.onclose(() => setConnected(false))
    }
  }, [connection])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (messageInput.trim() && userName.trim() && connection) {
      try {
        await connection.invoke('SendMessage', userName.trim(), messageInput)
        setMessageInput('')
      } catch (err) {
        console.error('Send failed: ', err)
      }
    }
  }

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  // Chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="absolute inset-4 border-4 border-white/20 rounded-3xl pointer-events-none"></div>
      <div className="absolute inset-8 border-2 border-white/10 rounded-2xl pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="absolute -inset-2 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl blur-sm"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-white/40 to-white/20 rounded-xl"></div>
        
        <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl h-[600px] flex flex-col border border-white/50">
          
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white p-4 rounded-t-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <h1 className="text-xl font-bold text-center relative z-10">💬 Chat Room</h1>
            <p className="text-center text-sm opacity-90 relative z-10">
              {userName.trim() ? `Welcome, ${userName}! 🎉` : 'Enter your name to start chatting 👋'}
            </p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 relative">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent)]"></div>
            
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8 relative z-10">
                <div className="text-6xl mb-4">💭</div>
                <p className="text-lg">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.user === userName.trim() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs lg:max-w-md relative group">
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-lg border transition-transform duration-200 hover:scale-105 ${
                          msg.user === userName.trim()
                            ? 'bg-blue-600 text-white rounded-br-md border-blue-300'
                            : 'bg-gray-600 text-white rounded-bl-md border-gray-400'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1 font-medium">
                          {msg.user} {msg.user === userName.trim() ? '(You)' : ''}
                        </div>
                        <div className="break-words">{msg.message}</div>
                      </div>
                      
                      <div
                        className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                          msg.user === userName.trim()
                            ? 'right-0 translate-x-1 bg-blue-600'
                            : 'left-0 -translate-x-1 bg-gray-600'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm rounded-b-xl">
            <div className="space-y-3">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name..."
                  className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/90"
                  maxLength="20"
                />
                <span className="flex items-center text-gray-600 font-medium">says:</span>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, sendMessage)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/90"
                  maxLength="500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || !userName.trim() || !connected}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Send 🚀
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                connected 
                  ? 'text-green-700 bg-green-100 border border-green-200' 
                  : 'text-red-700 bg-red-100 border border-red-200'
              }`}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App