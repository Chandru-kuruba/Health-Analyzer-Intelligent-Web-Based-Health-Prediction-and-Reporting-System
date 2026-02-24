import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { MessageCircle, AlertTriangle, Eye, User, Bot } from 'lucide-react';

const AdminChats = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [token, emergencyOnly]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getChatSessions(token, 0, 50, emergencyOnly);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewSessionDetails = async (sessionId) => {
    setSelectedSession(sessionId);
    setDetailsLoading(true);
    try {
      const data = await adminApi.getChatSessionDetails(sessionId, token);
      setSessionDetails(data);
    } catch (err) {
      console.error('Failed to load session details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div data-testid="admin-chats">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Chat Sessions</h1>
        <p className="text-slate-600">Monitor all health chat conversations</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            All Chat Sessions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="emergency-chat-filter"
              checked={emergencyOnly}
              onCheckedChange={setEmergencyOnly}
            />
            <Label htmlFor="emergency-chat-filter" className="flex items-center gap-1 cursor-pointer">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Emergency Only
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Emergency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">
                      {session.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.message_count} messages</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-slate-600">
                        {session.last_message_preview || 'No messages'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {session.emergency_detected && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(session.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewSessionDetails(session.id)}
                        data-testid={`view-session-${session.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {sessions.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              No chat sessions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat Session Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sessionDetails && (
            <div className="space-y-4">
              {/* User Info */}
              {sessionDetails.user && (
                <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {sessionDetails.user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{sessionDetails.user.name}</p>
                    <p className="text-sm text-slate-500">{sessionDetails.user.email}</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-4">
                  {sessionDetails.session?.messages?.map((msg, index) => (
                    <div
                      key={index}
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
                        <div className={`p-3 rounded-xl ${
                          msg.role === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-100 text-slate-700'
                        } ${msg.emergency_flag ? 'border-2 border-red-500' : ''}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 order-2">
                          <div className="p-2 bg-primary rounded-full">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChats;
