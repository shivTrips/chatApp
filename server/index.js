const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Create two fixed users if they don't exist
const createInitialUsers = async () => {
  try {
    // Check if users exist
    const user1 = await User.findOne({ username: 'boyfriend' });
    const user2 = await User.findOne({ username: 'girlfriend' });

    if (!user1) {
      const hashedPassword1 = await bcrypt.hash('boy123', 10);
      await User.create({
        username: 'boyfriend',
        password: hashedPassword1,
        avatar: 'boy-avatar.png'
      });
    }

    if (!user2) {
      const hashedPassword2 = await bcrypt.hash('girl123', 10);
      await User.create({
        username: 'girlfriend',
        password: hashedPassword2,
        avatar: 'girl-avatar.png'
      });
    }

    console.log('Initial users created');
  } catch (error) {
    console.error('Error creating initial users:', error);
  }
};

createInitialUsers();

// Simplified login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Only allow these two users
    if (username !== 'boyfriend' && username !== 'girlfriend') {
      return res.status(400).json({ message: 'Invalid username' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get other user (for chat)
app.get('/api/users/other', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const otherUser = await User.findOne({ 
      username: currentUser.username === 'boyfriend' ? 'girlfriend' : 'boyfriend' 
    });
    
    if (!otherUser) {
      return res.status(404).json({ message: 'Other user not found' });
    }
    
    res.json({
      _id: otherUser._id,
      username: otherUser.username,
      avatar: otherUser.avatar
    });
  } catch (error) {
    console.error('Error fetching other user:', error);
    res.status(500).json({ message: 'Error fetching other user' });
  }
});

// Get messages between users
app.get('/api/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store user socket mappings
const userSockets = new Map();

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Store user's socket ID
  userSockets.set(socket.userId, socket.id);
  
  // Notify other user about online status
  socket.broadcast.emit('user_status_change', {
    userId: socket.userId,
    status: 'online'
  });

  // Handle private messages
  socket.on('private_message', async (messageData, callback) => {
    try {
      console.log('Received private message:', messageData);
      const { senderId, receiverId, content } = messageData;
      
      // Validate message data
      if (!senderId || !receiverId || !content) {
        console.error('Invalid message data:', messageData);
        callback({ error: 'Invalid message data' });
        return;
      }

      // Verify sender is the authenticated user
      if (senderId !== socket.userId) {
        console.error('Sender ID mismatch:', { senderId, socketUserId: socket.userId });
        callback({ error: 'Unauthorized' });
        return;
      }

      // Save message to database
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content.trim()
      });
      
      const savedMessage = await message.save();
      console.log('Message saved to database:', savedMessage);

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        console.log('Sending message to receiver:', receiverSocketId);
        io.to(receiverSocketId).emit('new_message', savedMessage);
      } else {
        console.log('Receiver is offline:', receiverId);
      }
      
      // Send back to sender
      console.log('Sending message back to sender');
      socket.emit('new_message', savedMessage);
      
      // Acknowledge successful message delivery
      callback(null, { success: true });
    } catch (error) {
      console.error('Error handling private message:', error);
      callback({ error: 'Error sending message' });
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      console.log('User disconnected:', socket.userId);
      userSockets.delete(socket.userId);
      // Notify other users about offline status
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

// Image upload endpoint
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the URL for the uploaded image
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Update user avatar endpoint
app.post('/api/users/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar if it exists and is not the default
    if (user.avatar && !user.avatar.includes('default-avatar.png')) {
      const oldAvatarPath = path.join(uploadsDir, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user's avatar
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ avatar: avatarUrl });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 