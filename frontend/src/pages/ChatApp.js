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
  const [editingMessage, setEditingMessage] = useState(null);

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

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

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
      if (firstChannel) {
        await joinChannel(firstChannel._id);
      }
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
      setHasMoreMessages(res.data.hasNextPage || res.data.length === 30);
      
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
      setHasMoreMessages(res.data.hasNextPage || newMessages.length === 30);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChannel) return;

    try {
      const res = await axios.post(`${API_BASE}/messages`, {
        channelId: currentChannel,
        text: newMessage,
      }, { withCredentials: true });
      
      socketRef.current.emit('sendMessage', res.data);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = useCallback(() => {
    if (currentChannel) {
      socketRef.current.emit('typing', { userId: user.id, channelId: currentChannel });
    }
  }, [user.id, currentChannel]);

  const editMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.text);
  };

  const saveEdit = async () => {
   
    setEditingMessage(null);
    setNewMessage('');
  };

  const deleteMessage = (messageId) => {
   
    toast.success('Message deleted!');
  };

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
  
      <div className="w-80 bg-slate-800/90 backdrop-blur-xl border-r border-slate-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/50 transition-all duration-300">
          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TeamChat
          </h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                const name = prompt('Channel name:');
                if (name) axios.post(`${API_BASE}/channels`, { name }, { withCredentials: true });
              }}
              className="p-2 hover:bg-purple-500/20 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button onClick={logout} className="p-2 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4 space-y-1">
          {channels.map((channel) => (
            <div
              key={channel._id}
              onClick={() => joinChannel(channel._id)}
              className={`p-4 cursor-pointer hover:bg-slate-700/50 border-l-4 border-transparent transition-all duration-200 hover:scale-[1.02] group ${
                currentChannel === channel._id 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 font-bold shadow-lg' 
                  : 'hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                <span className="text-lg font-semibold truncate">#{channel.name}</span>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-slate-600 px-3 py-1 rounded-full font-mono">
                    {channel.members?.length || 0}
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="flex-1 flex flex-col">
        {currentChannel ? (
        <>
      
          <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700 p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-once">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  #{channels.find(c => c._id === currentChannel)?.name || 'general'}
                </h2>
                <p className="text-slate-400 flex items-center space-x-2">
                  <span className="animate-pulse">{onlineUsers.length} online</span>
                  {typingUsers.size > 0 && (
                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full animate-pulse">
                      {Array.from(typingUsers).slice(0, 2).join(', ')} typing...
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="p-3 hover:bg-slate-700/50 rounded-2xl transition-all duration-200 hover:scale-110 shadow-lg"
            >
              <Users className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8 space-y-4 bg-slate-900/20 backdrop-blur-xl">
      
            <div 
              ref={observerRef}
              className="w-full h-20 flex items-center justify-center opacity-0"
            />
            
            {loadingMore && (
              <div className="w-full flex justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl px-8 py-3 rounded-3xl border border-slate-700/50 flex items-center space-x-3 animate-pulse">
                  <div className="w-6 h-6 bg-purple-500/30 rounded-full animate-spin" />
                  <span className="text-slate-300 font-medium">Loading older messages...</span>
                </div>
              </div>
            )}

           
            {!hasMoreMessages && messages.length > 0 && (
              <div className="w-full text-center py-12">
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 flex flex-col shadow-2xl mx-auto max-w-md">
                  <MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-60" />
                  <p className="text-slate-400 text-lg font-medium">🏁 All {messages.length.toLocaleString()} messages loaded</p>
                </div>
              </div>
            )}

         
            {messages.map((message, idx) => (
              <div 
                key={message._id || idx} 
                className={`flex transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl ${
                  message.sender?.id === user.id ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'
                }`}
              >
                <div className={`max-w-md p-5 rounded-3xl shadow-2xl backdrop-blur-xl border border-slate-700/50 ${
                  message.sender?.id === user.id
                    ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      {message.sender?.name}
                    </span>
                    <div className="flex items-center space-x-2 opacity-75">
                      <span className="text-xs font-mono">
                        {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100">
                        <ThumbsUp className="w-4 h-4 hover:text-yellow-400 cursor-pointer transition-colors" />
                        <Edit3 className="w-4 h-4 hover:text-blue-400 cursor-pointer transition-colors" onClick={() => editMessage(message)} />
                        <Trash2 className="w-4 h-4 hover:text-red-400 cursor-pointer transition-colors" onClick={() => deleteMessage(message._id)} />
                      </div>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed break-words">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-slate-800/90 backdrop-blur-xl border-t border-slate-700 p-6 shadow-2xl">
            <div className="relative group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                onFocus={handleTyping}
                placeholder="Type your message... 👋"
                className="w-full p-6 pl-16 pr-20 text-lg bg-white/10 border border-slate-600 rounded-3xl focus:ring-4 focus:ring-purple-500/50 focus:border-transparent focus:outline-none transition-all duration-300 placeholder-slate-400 text-white resize-none backdrop-blur-xl hover:bg-white/20 group-hover:shadow-xl"
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <MessageCirclePlus className="w-5 h-5 text-slate-400 hover:text-purple-400 cursor-pointer" />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-110 hover:rotate-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="text-center space-y-6 animate-float">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-spin-slow">
                <MessageCircle className="w-20 h-20" />
              </div>
              <div>
                <h3 className="text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
                  Welcome to TeamChat
                </h3>
                <p className="text-xl text-slate-400">Loading your channels...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      
      {showOnlineUsers && (
        <div className="w-80 bg-slate-800/95 backdrop-blur-2xl border-l border-slate-700 shadow-2xl transform translate-x-0 transition-transform duration-300">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-black flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              <Users className="w-7 h-7" />
              Online ({onlineUsers.length})
            </h3>
          </div>
          <div className="p-6 space-y-3 max-h-screen overflow-auto">
            {onlineUsers.map((userId, idx) => (
              <div key={userId || idx} className="group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-2xl hover:bg-slate-600/50 transition-all duration-200 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <div className="w-6 h-6 bg-white/20 rounded-xl shadow-inner" />
                </div>
                <div>
                  <span className="font-bold text-lg">{userId === user.id ? 'You' : `User ${idx + 1}`}</span>
                  <p className="text-sm text-slate-400">Active now</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
