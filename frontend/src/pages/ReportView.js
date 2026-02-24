import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../services/healthApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { RiskBadge } from '../components/ui/risk-badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Download, 
  Mail, 
  ArrowLeft,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  Loader2,
  ScanLine,
  Brain,
  Stethoscope,
  Pill,
  ChevronDown,
  AlertOctagon,
  TestTube,
  Heart,
  Clock
} from 'lucide-react';

const ReportView = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await healthApi.getRecord(id, token);
        setReport(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        toast.error('Failed to load report');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, token, navigate]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await healthApi.downloadPdf(id, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailReport = async () => {
    setEmailing(true);
    try {
      const result = await healthApi.emailReport(id, token);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    } finally {
      setEmailing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!report) {
    return null;
  }

  const aiTriage = report.ai_triage || {};
  const isEmergency = aiTriage.emergencyAlert || false;
  const confidenceScore = aiTriage.confidenceScore || 0;
  const riskLevel = aiTriage.riskLevel || report.risk_level || 'Low';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="report-view">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-heading font-bold text-slate-900">
                    AI Health Analysis Report
                  </h1>
                </div>
                <p className="mt-1 text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(report.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  data-testid="download-pdf-btn"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button
                  onClick={handleEmailReport}
                  disabled={emailing}
                  className="bg-primary hover:bg-primary-dark"
                  data-testid="email-report-btn"
                >
                  {emailing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Email Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Emergency Alert Banner */}
          {isEmergency && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-600 rounded-xl text-white"
            >
              <div className="flex items-center gap-3">
                <AlertOctagon className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Emergency Alert</h3>
                  <p>Immediate medical attention is required. Please contact emergency services or visit the nearest emergency room.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Risk Level & Confidence Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`mb-8 p-6 rounded-2xl ${
              riskLevel === 'High' ? 'bg-red-50 border border-red-200' :
              riskLevel === 'Moderate' ? 'bg-amber-50 border border-amber-200' :
              'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">AI Risk Assessment</p>
                <RiskBadge level={riskLevel.toLowerCase()} size="large" />
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">AI Confidence</span>
                  <span className="text-lg font-bold text-slate-900">{confidenceScore}%</span>
                </div>
                <Progress 
                  value={confidenceScore} 
                  className={`h-3 ${
                    confidenceScore >= 80 ? '[&>div]:bg-emerald-500' :
                    confidenceScore >= 60 ? '[&>div]:bg-amber-500' :
                    '[&>div]:bg-red-500'
                  }`}
                />
              </div>
              <div className={`p-4 rounded-xl ${
                riskLevel === 'High' ? 'bg-red-100' :
                riskLevel === 'Moderate' ? 'bg-amber-100' :
                'bg-emerald-100'
              }`}>
                {riskLevel === 'High' ? (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                ) : riskLevel === 'Moderate' ? (
                  <Activity className="h-8 w-8 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Primary Condition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Primary Condition Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-slate-900">
                  {aiTriage.primaryCondition || 'General Health Assessment'}
                </p>
                {aiTriage.otherPossibleConditions?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Other Possible Conditions:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiTriage.otherPossibleConditions.map((condition, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Clinical Reasoning (Expandable) */}
          {aiTriage.clinicalReasoning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <Collapsible open={reasoningOpen} onOpenChange={setReasoningOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          Clinical Reasoning
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${reasoningOpen ? 'rotate-180' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {aiTriage.clinicalReasoning}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-medium text-slate-900">{report.full_name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age</span>
                    <span className="font-medium text-slate-900">{report.age} years</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender</span>
                    <span className="font-medium text-slate-900 capitalize">{report.gender}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900">{report.email}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Health Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">BMI</span>
                    <div className="text-right">
                      <span className="font-medium text-slate-900">{report.bmi}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        report.bmi_category === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                        report.bmi_category === 'Overweight' ? 'bg-amber-100 text-amber-700' :
                        report.bmi_category === 'Obese' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {report.bmi_category}
                      </span>
                    </div>
                  </div>
                  {report.blood_sugar_level && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-slate-500">Blood Sugar</span>
                        <span className="font-medium text-slate-900">{report.blood_sugar_level} mg/dL</span>
                      </div>
                    </>
                  )}
                  {report.blood_pressure_systolic && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-slate-500">Blood Pressure</span>
                        <span className="font-medium text-slate-900">
                          {report.blood_pressure_systolic}/{report.blood_pressure_diastolic} mmHg
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Symptoms */}
          {report.symptoms && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Reported Symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{report.symptoms}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Image Analysis */}
          {report.image_prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ScanLine className="h-5 w-5 text-primary" />
                    Image Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-900">{report.image_prediction.label}</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {(report.image_prediction.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                    <p className="text-slate-600">{report.image_prediction.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recommended Tests */}
            {aiTriage.recommendedTests?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TestTube className="h-5 w-5 text-blue-500" />
                      Recommended Tests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiTriage.recommendedTests.map((test, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">{test}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Lifestyle Recommendations */}
            {aiTriage.lifestyleRecommendations?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-emerald-500" />
                      Lifestyle Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiTriage.lifestyleRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* OTC Suggestions (only if not emergency) */}
          {!isEmergency && aiTriage.otcSuggestions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-purple-500" />
                    Over-the-Counter Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiTriage.otcSuggestions.map((otc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                        <span className="text-slate-700">{otc}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-slate-500">
                    Note: Always consult a pharmacist or healthcare provider before taking any medication.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* When to See Doctor */}
          {aiTriage.whenToSeeDoctor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-6"
            >
              <Card className={isEmergency ? 'border-2 border-red-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className={`h-5 w-5 ${isEmergency ? 'text-red-500' : 'text-amber-500'}`} />
                    When to See a Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`font-medium ${isEmergency ? 'text-red-600 text-lg' : 'text-slate-700'}`}>
                    {aiTriage.whenToSeeDoctor}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Medical Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 p-6 bg-slate-100 rounded-xl border border-slate-200"
          >
            <h4 className="font-semibold text-slate-800 mb-2">Medical Disclaimer</h4>
            <p className="text-sm text-slate-600">
              {aiTriage.disclaimer || "This system provides informational health insights only and does not replace professional medical advice."}
              {' '}Always seek the advice of your physician or other qualified health provider with any questions you 
              may have regarding a medical condition. Never disregard professional medical advice or delay in 
              seeking it because of information provided by this AI-powered system.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportView;
