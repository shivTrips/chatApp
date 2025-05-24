import { useState } from "react";
import "./chatList.css"

const ChatList = ({ users, selectedUser, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='chatList'>
      <div className="search">
        <div className="searchbar">
          <img src="./search.png" alt="" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredUsers.map(user => (
        <div 
          key={user._id}
          className={`item ${selectedUser?._id === user._id ? 'selected' : ''}`}
          onClick={() => onSelectUser(user)}
        >
          <img src={user.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user.username}</span>
            <p className={user.status}>{user.status}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatList