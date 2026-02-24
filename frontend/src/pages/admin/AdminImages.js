import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Image as ImageIcon, AlertTriangle, ExternalLink } from 'lucide-react';

const AdminImages = () => {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, [token, emergencyOnly]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getImageAnalyses(token, 0, 50, '', emergencyOnly);
      setAnalyses(data);
    } catch (err) {
      console.error('Failed to load analyses:', err);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Severe': return 'destructive';
      case 'Moderate': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div data-testid="admin-images">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Image Analyses</h1>
        <p className="text-slate-600">View all AI image analysis results</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            All Image Analyses
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="emergency-filter"
              checked={emergencyOnly}
              onCheckedChange={setEmergencyOnly}
            />
            <Label htmlFor="emergency-filter" className="flex items-center gap-1 cursor-pointer">
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
                  <TableHead>Preview</TableHead>
                  <TableHead>Detected Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Emergency</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell>
                      <a 
                        href={`${process.env.REACT_APP_BACKEND_URL}${analysis.image_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 rounded-lg overflow-hidden bg-slate-100 hover:opacity-80 transition-opacity"
                      >
                        <img 
                          src={`${process.env.REACT_APP_BACKEND_URL}${analysis.image_url}`}
                          alt="Analysis"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      </a>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{analysis.detected_condition}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(analysis.severity_level)}>
                        {analysis.severity_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${analysis.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-sm">{analysis.confidence_score}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {analysis.emergency && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(analysis.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {analyses.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              No image analyses found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImages;
