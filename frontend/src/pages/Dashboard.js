import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../services/healthApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { StatsCard } from '../components/StatsCard';
import { RiskBadge } from '../components/ui/risk-badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  Activity, 
  FileText, 
  Plus,
  TrendingUp,
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, recordsData] = await Promise.all([
          healthApi.getStats(token),
          healthApi.getRecords(token)
        ]);
        setStats(statsData);
        setRecentRecords(recordsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="dashboard">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-slate-600">
              Here's an overview of your health journey
            </p>
          </motion.div>

          {/* Stats Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatsCard
                title="Total Assessments"
                value={stats?.total_assessments || 0}
                subtitle="All time"
                icon={FileText}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatsCard
                title="Low Risk"
                value={stats?.risk_distribution?.low || 0}
                subtitle="assessments"
                icon={HeartPulse}
                className="border-l-4 border-l-emerald-500"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatsCard
                title="Moderate Risk"
                value={stats?.risk_distribution?.moderate || 0}
                subtitle="assessments"
                icon={Activity}
                className="border-l-4 border-l-amber-500"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatsCard
                title="High Risk"
                value={stats?.risk_distribution?.high || 0}
                subtitle="assessments"
                icon={TrendingUp}
                className="border-l-4 border-l-red-500"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latest Assessment */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-heading">Latest Assessment</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/history')}
                  >
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {stats?.latest_assessment ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {stats.latest_assessment.full_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {formatDate(stats.latest_assessment.created_at)}
                          </p>
                        </div>
                        <RiskBadge level={stats.latest_assessment.risk_level} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 uppercase">BMI</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {stats.latest_assessment.bmi}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stats.latest_assessment.bmi_category}
                          </p>
                        </div>
                        {stats.latest_assessment.blood_sugar_level && (
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">Blood Sugar</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {stats.latest_assessment.blood_sugar_level}
                            </p>
                            <p className="text-xs text-slate-500">mg/dL</p>
                          </div>
                        )}
                        {stats.latest_assessment.blood_pressure_systolic && (
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">Blood Pressure</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {stats.latest_assessment.blood_pressure_systolic}/{stats.latest_assessment.blood_pressure_diastolic}
                            </p>
                            <p className="text-xs text-slate-500">mmHg</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Conditions Detected:</p>
                        <ul className="space-y-1">
                          {stats.latest_assessment.conditions?.slice(0, 3).map((condition, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button 
                        onClick={() => navigate(`/report/${stats.latest_assessment.id}`)}
                        className="w-full bg-primary hover:bg-primary-dark"
                        data-testid="view-latest-report-btn"
                      >
                        View Full Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <HeartPulse className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No assessments yet</p>
                      <Button 
                        onClick={() => navigate('/assess')}
                        className="mt-4 bg-primary hover:bg-primary-dark"
                      >
                        Start Your First Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => navigate('/assess')}
                    className="w-full bg-primary hover:bg-primary-dark justify-start"
                    data-testid="new-assessment-btn"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Health Assessment
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/history')}
                    className="w-full justify-start"
                    data-testid="view-history-btn"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Report History
                  </Button>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Reports</h4>
                    {recentRecords.length > 0 ? (
                      <ul className="space-y-2">
                        {recentRecords.map((record) => (
                          <li key={record.id}>
                            <button
                              onClick={() => navigate(`/report/${record.id}`)}
                              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 truncate">
                                  {formatDate(record.created_at)}
                                </span>
                                <RiskBadge level={record.risk_level} size="small" showIcon={false} />
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No reports yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
