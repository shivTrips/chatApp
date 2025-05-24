# Real-time Chat Application

A modern real-time chat application built with React, Node.js, and Socket.IO. This application allows users to communicate in real-time with features like instant messaging, user presence, and more.

## Project Structure

This is a monorepo containing both frontend and backend code:

- `/client` - React frontend application
- `/server` - Node.js backend server

## Deployment on Render

This project is set up for deployment on Render.com with two separate services:

### Backend Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Root Directory: `/server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add your environment variables (MONGODB_URI, JWT_SECRET, etc.)

### Frontend Deployment
1. Create another Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Root Directory: `/client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
   - Environment Variables: Add your environment variables (VITE_API_URL, etc.)

## Local Development

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Backend (.env in /server)
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (.env in /client)
```
VITE_API_URL=http://localhost:5000
```

## License

MIT 