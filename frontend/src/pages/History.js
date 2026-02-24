import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../services/healthApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { RiskBadge } from '../components/ui/risk-badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';
import { 
  Search, 
  FileText, 
  Calendar,
  ArrowRight,
  Plus,
  Filter
} from 'lucide-react';

const History = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await healthApi.getRecords(token);
        setRecords(data);
        setFilteredRecords(data);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  useEffect(() => {
    let filtered = records;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.conditions.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (riskFilter !== 'all') {
      filtered = filtered.filter(record => record.risk_level === riskFilter);
    }
    
    setFilteredRecords(filtered);
  }, [searchTerm, riskFilter, records]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      
      <main className="pt-24 pb-16" data-testid="history-page">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Report History
              </h1>
              <p className="mt-1 text-slate-600">
                View all your past health assessments
              </p>
            </div>
            <Button 
              onClick={() => navigate('/assess')}
              className="bg-primary hover:bg-primary-dark"
              data-testid="new-assessment-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div 
            className="flex flex-col md:flex-row gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="risk-filter"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </motion.div>

          {/* Records List */}
          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/report/${record.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{record.full_name}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.created_at)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                BMI: {record.bmi} ({record.bmi_category})
                              </span>
                              {record.blood_sugar_level && (
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                  Sugar: {record.blood_sugar_level} mg/dL
                                </span>
                              )}
                              {record.blood_pressure_systolic && (
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                  BP: {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <RiskBadge level={record.risk_level} />
                          <Button variant="ghost" size="sm">
                            View
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                      
                      {record.conditions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Conditions</p>
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {record.conditions.slice(0, 2).join(' • ')}
                            {record.conditions.length > 2 && ` +${record.conditions.length - 2} more`}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No records found</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || riskFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start your first health assessment to see records here'}
              </p>
              {!searchTerm && riskFilter === 'all' && (
                <Button 
                  onClick={() => navigate('/assess')}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Start Assessment
                </Button>
              )}
            </motion.div>
          )}

          {/* Summary Stats */}
          {records.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-6 bg-white rounded-xl border border-slate-100"
            >
              <h4 className="font-semibold text-slate-800 mb-4">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                  <p className="text-sm text-slate-500">Total Records</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {records.filter(r => r.risk_level === 'low').length}
                  </p>
                  <p className="text-sm text-slate-500">Low Risk</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {records.filter(r => r.risk_level === 'moderate').length}
                  </p>
                  <p className="text-sm text-slate-500">Moderate Risk</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {records.filter(r => r.risk_level === 'high').length}
                  </p>
                  <p className="text-sm text-slate-500">High Risk</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default History;
