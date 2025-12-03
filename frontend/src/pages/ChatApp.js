import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Users, MessageCircle, Plus, LogOut, Send, Edit3, Trash2, ThumbsUp, MessageCirclePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = 'https://chatapp-3uny.onrender.com/api';
const SOCKET_URL = 'https://chatapp-3uny.onrender.com';

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const observerRef = useRef(null);


  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });

    socketRef.current.on('newMessage', (message) => {
      if (message.channelId === currentChannel) {
        setMessages(prev => [...prev, message]);
      }
    });

    socketRef.current.on('presence', (users) => setOnlineUsers(users));

    socketRef.current.on('typing', (data) => {
      setTypingUsers(data.users);
    });

    setupChat();

    return () => socketRef.current?.disconnect();
  }, []);


  const observerCallback = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMoreMessages && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingMore, currentChannel]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [observerCallback]);


  const setupChat = async () => {
    try {
      const res = await axios.get(`${API_BASE}/channels`, { withCredentials: true });
      setChannels(res.data);

      if (res.data.length === 0) {
        await axios.post(`${API_BASE}/channels`, { name: 'general' }, { withCredentials: true });
      }

      const channelsRes = await axios.get(`${API_BASE}/channels`, { withCredentials: true });
      const firstChannel = channelsRes.data[0];
      if (firstChannel) joinChannel(firstChannel._id);

    } catch (error) {
      console.error('Setup failed:', error);
    }
  };


  const joinChannel = async (channelId) => {
    try {
      await axios.post(`${API_BASE}/channels/${channelId}/join`, {}, { withCredentials: true });

      setCurrentChannel(channelId);
      socketRef.current.emit('join', { userId: user.id, channelId });

      setPage(1);
      setHasMoreMessages(true);
      setMessages([]);

      const res = await axios.get(`${API_BASE}/messages/${channelId}?page=1&limit=30`, { 
        withCredentials: true 
      });

      setMessages(res.data.messages || res.data);
      setHasMoreMessages(res.data.hasNextPage || (res.data.length === 30));

      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      toast.error('Failed to join channel');
    }
  };

 
  const loadMoreMessages = async () => {
    if (!currentChannel || !hasMoreMessages || loadingMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await axios.get(`${API_BASE}/messages/${currentChannel}?page=${nextPage}&limit=30`, { 
        withCredentials: true 
      });
      
      const newMessages = res.data.messages || res.data;

      setMessages(prev => [...newMessages, ...prev]);
      setPage(nextPage);
      setHasMoreMessages(res.data.hasNextPage || (newMessages.length === 30));

    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChannel) return;

    try {
      const res = await axios.post(
        `${API_BASE}/messages`,
        { channelId: currentChannel, text: newMessage },
        { withCredentials: true }
      );

      const newMsg = {
        ...res.data,
        channelId: currentChannel   
      };

    
      setMessages(prev => [...prev, newMsg]);

   
      socketRef.current.emit("sendMessage", {
        message: newMsg,
        channelId: currentChannel
      });

      setNewMessage("");

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 10);

    } catch (error) {
      toast.error("Failed to send message");
    }
  };


  const handleTyping = useCallback(() => {
    if (currentChannel) {
      socketRef.current.emit('typing', { userId: user.id, channelId: currentChannel });
    }
  }, [user.id, currentChannel]);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 
  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">

  
      <div className="w-80 bg-slate-800/90 backdrop-blur-xl border-r border-slate-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">

          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TeamChat
          </h1>

          <div className="flex space-x-2">
            <button 
              onClick={() => {
                const name = prompt('Channel name:');
                if (name) axios.post(`${API_BASE}/channels`, { name }, { withCredentials: true });
              }}
              className="p-2 hover:bg-purple-500/20 rounded-xl"
            >
              <Plus className="w-6 h-6" />
            </button>

            <button onClick={logout} className="p-2 hover:bg-red-500/20 rounded-xl">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4 space-y-1">
          {channels.map((channel) => (
            <div
              key={channel._id}
              onClick={() => joinChannel(channel._id)}
              className={`p-4 cursor-pointer hover:bg-slate-700/50 border-l-4 transition-all group ${
                currentChannel === channel._id 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 font-bold shadow-lg' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold truncate">#{channel.name}</span>
                <span className="text-xs bg-slate-600 px-3 py-1 rounded-full font-mono">
                  {channel.members?.length || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

  
      <div className="flex-1 flex flex-col">
        
        {currentChannel ? (
          <>
        
            <div className="bg-slate-800/90 p-6 border-b border-slate-700 flex items-center justify-between">

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">
                    #{channels.find(c => c._id === currentChannel)?.name}
                  </h2>
                  <p className="text-slate-400">
                    {onlineUsers.length} online
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                className="p-3 hover:bg-slate-700/50 rounded-2xl"
              >
                <Users className="w-6 h-6" />
              </button>
            </div>

        
            <div className="flex-1 overflow-auto p-8 space-y-4 bg-slate-900/20">

              <div ref={observerRef} className="w-full h-20"></div>

              {loadingMore && (
                <div className="w-full text-center">Loading older messages...</div>
              )}

              {messages.map((message, idx) => (
                <div 
                  key={message._id || idx}
                  className={`flex ${
                    message.sender?.id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className={`max-w-md p-5 rounded-3xl border ${
                    message.sender?.id === user.id
                      ? "bg-gradient-to-r from-purple-600/90 to-pink-600/90"
                      : "bg-white/10"
                  }`}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{message.sender?.name}</span>
                      <span className="text-xs">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-lg">{message.text}</p>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />

            </div>

         
            <div className="bg-slate-800/90 p-6 border-t border-slate-700">
              <div className="relative">

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  onFocus={handleTyping}
                  placeholder="Type your message..."
                  className="w-full p-4 pl-14 pr-20 bg-white/10 border border-slate-600 rounded-3xl"
                />

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl"
                >
                  <Send className="w-6 h-6" />
                </button>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            Loading...
          </div>
        )}

      </div>


      {showOnlineUsers && (
        <div className="w-80 bg-slate-800/95 border-l border-slate-700">
          <div className="p-6 border-b">
            <h3 className="text-xl font-black">Online ({onlineUsers.length})</h3>
          </div>

          <div className="p-6 space-y-3">
            {onlineUsers.map((uid, idx) => (
              <div key={idx} className="p-4 bg-slate-700/50 rounded-xl">
                {uid === user.id ? "You" : `User ${idx + 1}`}
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}

