import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/chatApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Send,
  MessageCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  Bot,
  User,
  Clock,
  History
} from 'lucide-react';

const HealthChat = () => {
  const { token, user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const data = await chatApi.getSessions(token);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const session = await chatApi.getSession(sessionId, token);
      setCurrentSession(session);
      setMessages(session.messages || []);
      setEmergencyAlert(session.emergency_detected);
    } catch (err) {
      console.error('Failed to load session:', err);
      toast.error('Failed to load chat session');
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setEmergencyAlert(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Optimistically add user message
    const tempUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatApi.sendMessage(
        userMessage,
        currentSession?.id,
        token
      );

      // Update session and messages
      if (!currentSession) {
        setCurrentSession({ id: response.session_id });
        loadSessions(); // Refresh session list
      }

      // Add assistant message
      setMessages(prev => [...prev, response.message]);

      if (response.emergency_alert) {
        setEmergencyAlert(true);
        toast.error('Emergency detected! Please seek immediate medical help.', {
          duration: 10000
        });
      }
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await chatApi.deleteSession(sessionId, token);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        startNewChat();
      }
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete conversation');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-20 pb-4" data-testid="health-chat-page">
        <div className="max-w-7xl mx-auto px-4 h-[calc(100vh-6rem)]">
          <div className="flex gap-4 h-full">
            {/* Sidebar - Chat Sessions */}
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-72 flex-shrink-0"
              >
                <Card className="h-full flex flex-col">
                  <div className="p-4 border-b">
                    <Button 
                      onClick={startNewChat}
                      className="w-full bg-primary hover:bg-primary-dark"
                      data-testid="new-chat-btn"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Conversation
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wide px-2 mb-2">
                        Recent Conversations
                      </p>
                      {sessions.length > 0 ? (
                        <div className="space-y-1">
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => loadSession(session.id)}
                              className={`w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors group ${
                                currentSession?.id === session.id ? 'bg-primary/10 border border-primary/20' : ''
                              }`}
                              data-testid={`session-${session.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {session.emergency_detected && (
                                      <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                    )}
                                    <span className="text-sm font-medium text-slate-700 truncate">
                                      {formatDate(session.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {session.messages?.length || 0} messages
                                  </p>
                                </div>
                                <span
                                  onClick={(e) => deleteSession(session.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity cursor-pointer"
                                  role="button"
                                  tabIndex={0}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No conversations yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </motion.div>
            )}

            {/* Main Chat Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col"
            >
              <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-semibold text-slate-900">
                        Health Assistant
                      </h2>
                      <p className="text-xs text-slate-500">
                        AI-powered health chat with context awareness
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>

                {/* Emergency Alert */}
                <AnimatePresence>
                  {emergencyAlert && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert className="m-4 border-red-500 bg-red-50" data-testid="chat-emergency-alert">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertTitle className="text-red-800 font-semibold">
                          Emergency Detected
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                          Based on your message, this may be a medical emergency. 
                          Please seek immediate medical attention or call emergency services.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                          <Bot className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="font-heading font-semibold text-slate-900 mb-2">
                          Start a Health Conversation
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md">
                          I'm your AI health assistant. Ask me about your symptoms, 
                          health concerns, or wellness tips. I have access to your 
                          health records to provide personalized guidance.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                          {[
                            'What do my recent health results mean?',
                            'I have a headache, what should I do?',
                            'Tips for better sleep'
                          ].map((prompt, i) => (
                            <button
                              key={i}
                              onClick={() => setInputMessage(prompt)}
                              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                          
                          <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                            <div className={`p-3 rounded-2xl ${
                              msg.role === 'user' 
                                ? 'bg-primary text-white rounded-br-md' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                            } ${msg.emergency_flag ? 'border-red-300 bg-red-50' : ''}`}>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${
                              msg.role === 'user' ? 'justify-end' : ''
                            }`}>
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-400">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                          </div>

                          {msg.role === 'user' && (
                            <div className="flex-shrink-0 order-2">
                              <div className="p-2 bg-primary rounded-full">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-white">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your health question..."
                      disabled={sending}
                      className="flex-1"
                      data-testid="chat-input"
                    />
                    <Button 
                      type="submit" 
                      disabled={!inputMessage.trim() || sending}
                      className="bg-primary hover:bg-primary-dark"
                      data-testid="send-message-btn"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    This chat provides health information only and does not replace professional medical advice.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthChat;
