**TeamChat** is a full-stack real-time chat application built with the **MERN stack** (MongoDB, Express.js, React, Node.js) and **Socket.IO** for live messaging. Features Slack/Discord-style UI with infinite scroll pagination, typing indicators, and online presence.

## ✨ Features

- **Real-time Messaging** - Instant message delivery with Socket.IO
- **Infinite Scroll Pagination** - Load older messages by scrolling up
- **Channel Management** - Create/join multiple chat channels
- **Online Presence** - Live user status indicators
- **Typing Indicators** - See who's typing in real-time
- **Modern UI/UX** - Glassmorphism design with 100+ animations
- **JWT Authentication** - Secure user sessions with cookies
- **Responsive Design** - Mobile + Desktop optimized

## 🛠 Tech Stack

| Frontend | Backend | Database | Real-time | Styling |
|----------|---------|----------|-----------|---------|
| React 18 | Node.js 20 | MongoDB | Socket.IO | Tailwind CSS |
| Lucide React | Express.js | Mongoose | | React Hot Toast |
| Axios | CORS | | | Vite |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm/yarn

**Backend:**
cd backend

npm install
nodemon server.js


**Frontend:**
cd frontend
npm install
npm start


### 2. Environment Variables

**backend/.env:**
PORT=5000
MONGO_URI=mongodb://localhost:27017/teamchat
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development


**frontend/.env:**
API_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000


## Project Structure

teamchat/
├── backend/
│ ├── models/ # User, Channel, Message schemas
│ ├── routes/ # auth, channels, messages
│ ├── middleware/ # auth middleware
│ └── server.js # Express + Socket.IO
├── frontend/
│ ├── src/
│ │ ├── components/ # ChatApp.jsx
│ │ ├── contexts/ # AuthContext.jsx
│ │ └── App.jsx
└── README.md



##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/channels` | List channels |
| `POST` | `/api/channels` | Create channel |
| `POST` | `/api/channels/:id/join` | Join channel |
| `POST` | `/api/messages` | Send message |
| `GET` | `/api/messages/:id?page=1&limit=30` | Paginated messages |

##  Socket.IO Events


Client → Server: join, sendMessage, typing
Server → Client: newMessage, presence, typing





## 🎮 Demo Flow

1. **Login** → JWT cookie stored
2. **Auto-join** → Creates 'general' channel
3. **Chat** → Real-time messages + typing
4. **Scroll up** → Infinite pagination loads history
5. **Multi-tab** → Live presence updates




