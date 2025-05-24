import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import "./list.css"
import UserInfo from "./userInfo/userInfo"

const List = () => {
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();

  // Fetch the other user
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/other', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setOtherUser(response.data);
      } catch (error) {
        console.error('Error fetching other user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOtherUser();
  }, [user.userId]);

  // Listen for user status changes
  useEffect(() => {
    if (socket && otherUser) {
      socket.on('user_status_change', ({ userId, status }) => {
        if (userId === otherUser._id) {
          setOtherUser(prev => ({ ...prev, status }));
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('user_status_change');
      }
    };
  }, [socket, otherUser]);

  if (loading) {
    return <div className="list">Loading...</div>;
  }

  return (
    <div className='list'>
      <UserInfo user={user} />
      {otherUser && (
        <div className="other-user">
          <img src={otherUser.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{otherUser.username}</span>
            <p className={otherUser.status || 'offline'}>{otherUser.status || 'offline'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;