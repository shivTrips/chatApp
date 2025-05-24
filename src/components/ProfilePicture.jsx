import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ProfilePicture.css';

const ProfilePicture = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { user, setUser } = useAuth();

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
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('http://localhost:5000/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update user state with new avatar
      setUser(prev => ({
        ...prev,
        avatar: response.data.avatar
      }));

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      userData.avatar = response.data.avatar;
      localStorage.setItem('user', JSON.stringify(userData));

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="profile-picture"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => fileInputRef.current?.click()}
    >
      <img 
        src={user?.avatar || "/avatar.png"} 
        alt="Profile" 
        className={isUploading ? 'uploading' : ''}
      />
      {isHovered && (
        <div className="overlay">
          <span>Change Picture</span>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProfilePicture; 