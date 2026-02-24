import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Image, 
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminOverview = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats(token);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats?.total_users || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Health Records', 
      value: stats?.total_health_records || 0, 
      icon: FileText, 
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    { 
      title: 'Image Analyses', 
      value: stats?.total_image_analyses || 0, 
      icon: Image, 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    { 
      title: 'Chat Sessions', 
      value: stats?.total_chat_sessions || 0, 
      icon: MessageCircle, 
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50'
    },
    { 
      title: 'High Risk Cases', 
      value: stats?.high_risk_cases || 0, 
      icon: TrendingUp, 
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      title: 'Emergency Alerts', 
      value: stats?.emergency_alerts || 0, 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
  ];

  // Prepare chart data
  const conditionData = Object.entries(stats?.condition_distribution || {})
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, count }));

  const COLORS = ['#2E86C1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  return (
    <div data-testid="admin-overview">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600">Monitor system health and user activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={stat.bgColor}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conditions Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Top Detected Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conditionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conditionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2E86C1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  No condition data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Risk Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.total_health_records > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Low Risk', value: stats?.high_risk_cases ? stats.total_health_records - stats.high_risk_cases : stats?.total_health_records || 0 },
                        { name: 'High Risk', value: stats?.high_risk_cases || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  No risk data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
