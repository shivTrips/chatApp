import { useEffect, useRef, useState } from "react"
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { useNavigate } from 'react-router-dom'
import ProfilePicture from '../ProfilePicture'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otherUser, setOtherUser] = useState(null)
  const socket = useSocket()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const endRef = useRef(null)
  const fileInputRef = useRef(null)

  // Fetch other user
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/other', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Other user fetched:', response.data);
        setOtherUser(response.data);
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };
    fetchOtherUser();
  }, []);

  // Fetch messages when other user is loaded
  useEffect(() => {
    const fetchMessages = async () => {
      if (otherUser) {
        setLoading(true)
        try {
          const response = await axios.get(`http://localhost:5000/api/messages/${otherUser._id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          console.log('Messages fetched:', response.data);
          setMessages(response.data)
        } catch (error) {
          console.error('Error fetching messages:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchMessages()
  }, [otherUser])

  // Listen for new messages
  useEffect(() => {
    if (socket && otherUser) {
      console.log('Setting up socket listener for messages');
      
      // Remove any existing listeners to prevent duplicates
      socket.off('new_message');
      
      socket.on('new_message', (message) => {
        console.log('New message received:', message);
        // Convert IDs to strings for comparison
        const messageSenderId = message.sender.toString();
        const messageReceiverId = message.receiver.toString();
        const currentUserId = user.id.toString();
        const otherUserId = otherUser._id.toString();

        if (
          (messageSenderId === currentUserId && messageReceiverId === otherUserId) ||
          (messageSenderId === otherUserId && messageReceiverId === currentUserId)
        ) {
          console.log('Adding message to chat');
          setMessages(prev => [...prev, message]);
        }
      });

      // Listen for socket errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('error');
      }
    }
  }, [socket, otherUser, user?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleEmoji = e => {
    setText(prev => prev + e.emoji)
    setOpen(false)
  }

  const sendMessage = async () => {
    if (!text.trim() || !otherUser || !user?.id) {
      console.log('Cannot send message:', { text: text.trim(), otherUser, userId: user?.id });
      return;
    }

    try {
      const messageData = {
        senderId: user.id,
        receiverId: otherUser._id,
        content: text.trim()
      }
      console.log('Sending message:', messageData);
      
      // Clear input immediately for better UX
      setText('');
      
      // Emit the message
      socket.emit('private_message', messageData, (error) => {
        if (error) {
          console.error('Error sending message:', error);
          // Optionally show error to user
        }
      });
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const imageUrl = response.data.url;
      
      // Send image as a message
      const messageData = {
        senderId: user.id,
        receiverId: otherUser._id,
        content: `[Image](${imageUrl})`
      };

      socket.emit('private_message', messageData, (error) => {
        if (error) {
          console.error('Error sending image:', error);
          alert('Failed to send image');
        }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  if (!otherUser) {
    return (
      <div className="chat-placeholder">
        <p>Loading chat...</p>
      </div>
    )
  }

  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <ProfilePicture />
          <div className="texts">
            <span>{otherUser?.username}</span>
            <p>{otherUser?.status || 'offline'}</p>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="center">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.toString() === user.id.toString();
            const isImage = message.content.startsWith('[Image](') && message.content.endsWith(')');
            const imageUrl = isImage ? message.content.slice(8, -1) : null;

            return (
              <div 
                key={message._id} 
                className={`message ${isOwnMessage ? 'own' : ''}`}
              >
                <div className="texts">
                  {isImage ? (
                    <img 
                      src={imageUrl} 
                      alt="Shared image" 
                      className="message-image"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <img 
            src="/camera.png" 
            alt="Send image" 
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        
        <div className="emoji">
          <img 
            src="/emoji.png" 
            alt="" 
            onClick={() => setOpen(prev => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        
        <button 
          className="sendButton" 
          onClick={sendMessage}
          disabled={!text.trim() || !user?.id}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat