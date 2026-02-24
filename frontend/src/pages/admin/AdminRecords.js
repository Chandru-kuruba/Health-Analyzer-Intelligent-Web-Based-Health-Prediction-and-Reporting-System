import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Filter } from 'lucide-react';

const AdminRecords = () => {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, [token, riskFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getHealthRecords(
        token, 
        0, 
        50, 
        riskFilter === 'all' ? '' : riskFilter
      );
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'destructive';
      case 'Moderate': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div data-testid="admin-records">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Health Records</h1>
        <p className="text-slate-600">View all health assessments and reports</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            All Health Records
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40" data-testid="risk-filter">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
                <SelectItem value="Moderate">Moderate Risk</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead>Patient</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Blood Pressure</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Emergency</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.full_name}</p>
                        <p className="text-sm text-slate-500">{record.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.age} / {record.gender}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.bmi}</p>
                        <p className="text-xs text-slate-500">{record.bmi_category}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.blood_pressure_systolic && record.blood_pressure_diastolic 
                        ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskColor(record.risk_level)}>
                        {record.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.emergency_alert && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(record.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {records.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              No health records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecords;
