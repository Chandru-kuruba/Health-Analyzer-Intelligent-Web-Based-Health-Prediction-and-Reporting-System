import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { imageApi } from '../services/imageApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ScanLine,
  ArrowRight,
  FileWarning
} from 'lucide-react';

const ImageAnalysis = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setResult(null);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await imageApi.analyzeImage(selectedImage, token);
      setResult(analysisResult);
      
      if (analysisResult.emergency) {
        toast.error('Emergency condition detected! Please seek immediate medical attention.');
      } else {
        toast.success('Image analysis complete!');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || 'Failed to analyze image. Please try again.');
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Mild': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Severe': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="image-analysis-page">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <ScanLine className="h-4 w-4" />
              AI-Powered Analysis
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
              Medical Image Analysis
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
              Upload an image of a visible body condition for AI-powered analysis. 
              Get instant insights about potential conditions and recommended care.
            </p>
          </motion.div>

          {/* Emergency Alert */}
          {result?.emergency && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Alert className="border-red-500 bg-red-50" data-testid="emergency-alert">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 font-semibold text-lg">
                  Emergency Alert
                </AlertTitle>
                <AlertDescription className="text-red-700 mt-2">
                  <strong>Seek Immediate Medical Attention!</strong>
                  <br />
                  The analysis indicates a potentially severe condition. 
                  Please visit an emergency room or call emergency services immediately.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!imagePreview ? (
                    <label 
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                      data-testid="image-upload-dropzone"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
                        <p className="mb-2 text-sm text-slate-600">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">
                          JPG, PNG or WEBP (max 10MB)
                        </p>
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        data-testid="image-file-input"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Selected" 
                        className="w-full h-64 object-cover rounded-xl"
                        data-testid="image-preview"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                        data-testid="clear-image-btn"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {error && (
                    <Alert className="mt-4 border-red-200 bg-red-50">
                      <FileWarning className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || analyzing}
                    className="w-full mt-4 bg-primary hover:bg-primary-dark"
                    data-testid="analyze-image-btn"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanLine className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-heading flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4" data-testid="analysis-results">
                      {/* Detected Condition */}
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Detected Condition
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {result.detected_condition}
                        </p>
                      </div>

                      {/* Severity & Confidence */}
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-500 mb-1">Severity</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity_level)}`}>
                            {result.severity_level}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-500 mb-1">Confidence</p>
                          <p className="text-lg font-semibold text-slate-900">{result.confidence_score}%</p>
                        </div>
                      </div>

                      {/* Visual Findings */}
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Visual Findings</p>
                        <p className="text-slate-700">{result.visual_findings}</p>
                      </div>

                      {/* Possible Causes */}
                      {result.possible_causes?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Possible Causes</p>
                          <ul className="space-y-1">
                            {result.possible_causes.map((cause, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Care */}
                      {result.recommended_care?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Recommended Care</p>
                          <ul className="space-y-1">
                            {result.recommended_care.map((care, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                {care}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* OTC Suggestions */}
                      {result.otc_suggestions?.length > 0 && !result.emergency && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">OTC Suggestions</p>
                          <ul className="space-y-1">
                            {result.otc_suggestions.map((otc, i) => (
                              <li key={i} className="text-sm text-slate-600">• {otc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* When to See Doctor */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-800 mb-1">When to See a Doctor</p>
                        <p className="text-sm text-blue-700">{result.when_to_see_doctor}</p>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-xs text-slate-500 italic mt-4">
                        {result.disclaimer}
                      </p>

                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => navigate('/image-history')}
                      >
                        View Analysis History
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <ScanLine className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-slate-500">Upload an image to see analysis results</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Supports skin conditions, rashes, wounds, and more
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Disclaimer */}
          <motion.div 
            className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-amber-800">
              <strong>Medical Disclaimer:</strong> This AI image analysis is for informational purposes only 
              and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified 
              healthcare professional for proper medical evaluation.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ImageAnalysis;
