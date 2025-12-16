import React, { useState, useEffect, useRef } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/providers/AuthContext';

export default function Chat({ channelId }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async (isInitial = false) => {
        if (!channelId) return;

        try {
            const params = new URLSearchParams({ channelId });
            if (!isInitial && lastMessageIdRef.current) {
                params.append('lastMessageId', lastMessageIdRef.current);
            }

            const res = await fetch(`/api/getMessages?${params}`);
            const data = await res.json();

            if (data.success) {
                if (isInitial) {
                    setMessages(data.messages);
                    if (data.messages.length > 0) {
                        lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
                    }
                } else {
                    // Only add new messages
                    if (data.messages.length > 0) {
                        setMessages(prev => [...prev, ...data.messages]);
                        lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
                    }
                }
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !user || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);
        setError(null);

        try {
            const res = await fetch('/api/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channelId,
                    message: messageText,
                    username: user.username || 'Anonymous'
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                const errorMsg = data.error || data.message || 'Failed to send message';
                console.error('Send message error:', errorMsg);
                throw new Error(errorMsg);
            }

            // Add the new message immediately for better UX
            setMessages(prev => [...prev, data.message]);
            lastMessageIdRef.current = data.message.id;
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            setNewMessage(messageText);
            const errorMessage = err.message || 'Failed to send message. Please try again.';
            setError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (!channelId) return;

        // Initial fetch
        fetchMessages(true);

        // Set up polling for new messages (every 1 second)
        pollIntervalRef.current = setInterval(() => {
            fetchMessages(false);
        }, 1000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [channelId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className='flex flex-col h-full'>
            {/* Chat Header */}
            <div className='p-4 border-b border-nyu-neutral-300'>
                <h2 className='text-xl font-bold text-nyu-primary-600'>Live Chat</h2>
                <p className='text-sm text-nyu-neutral-600 mt-1'>
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className='p-2 bg-red-50 border-b border-red-200'>
                    <p className='text-xs text-red-600'>{error}</p>
                </div>
            )}

            {/* Messages Area */}
            <div className='flex-1 overflow-y-auto p-4 space-y-3 bg-nyu-neutral-50'>
                {messages.length === 0 ? (
                    <div className='flex items-center justify-center h-full'>
                        <div className='text-center text-nyu-neutral-400'>
                            <p className='text-sm'>No messages yet. Be the first to chat!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={msg.id || index} className='flex flex-col'>
                            <div className='flex items-baseline gap-2 mb-1'>
                                <span className='font-semibold text-sm text-nyu-primary-600'>
                                    {msg.username || 'Anonymous'}
                                </span>
                                <span className='text-xs text-nyu-neutral-500'>
                                    {formatTime(msg.timestamp || msg.createdAt)}
                                </span>
                            </div>
                            <div className='bg-white rounded-lg px-3 py-2 shadow-sm border border-nyu-neutral-200'>
                                <p className='text-sm text-nyu-neutral-800 whitespace-pre-wrap break-words'>
                                    {msg.message || msg.text}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className='p-4 border-t border-nyu-neutral-300 bg-white'>
                {user ? (
                    <form onSubmit={sendMessage} className='flex gap-2'>
                        <Input
                            type='text'
                            placeholder='Type a message...'
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            maxLength={500}
                            className='flex-1'
                        />
                        <Button
                            type='primary'
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sending}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </Button>
                    </form>
                ) : (
                    <div className='text-center py-2'>
                        <p className='text-sm text-nyu-neutral-600'>
                            Please sign in to chat
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}



