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
import jsPDF from 'jspdf';
import {
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ScanLine,
  ArrowRight,
  FileWarning,
  Copy,
  ClipboardList,
  Pill,
  ShieldAlert,
  Stethoscope,
  Download
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

  const normalizeResult = (raw) => {
    if (!raw) return null;
    return {
      detectedCondition: raw.detectedCondition ?? raw.detected_condition ?? 'Unknown',
      severityLevel: raw.severityLevel ?? raw.severity_level ?? 'Mild',
      confidenceScore: raw.confidenceScore ?? raw.confidence_score ?? 0,
      visualFindings: raw.visualFindings ?? raw.visual_findings ?? '',
      possibleCauses: raw.possibleCauses ?? raw.possible_causes ?? [],
      recommendedCare: raw.recommendedCare ?? raw.recommended_care ?? [],
      otcSuggestions: raw.otcSuggestions ?? raw.otc_suggestions ?? [],
      otcBySymptom: raw.otcBySymptom ?? raw.otc_by_symptom ?? {},
      homeRemedies: raw.homeRemedies ?? raw.home_remedies ?? [],
      immediateSteps: raw.immediateSteps ?? raw.immediate_steps ?? [],
      redFlags: raw.redFlags ?? raw.red_flags ?? [],
      safetyNote: raw.safetyNote ?? raw.safety_note ?? '',
      whenToSeeDoctor: raw.whenToSeeDoctor ?? raw.when_to_see_doctor ?? '',
      emergency: raw.emergency ?? false,
      disclaimer: raw.disclaimer ?? '',
      prescriptionText: raw.prescriptionText ?? raw.prescription_text ?? '',
      medicationPlan: raw.medicationPlan ?? raw.medication_plan ?? [],
      prescriptionSummary: raw.prescriptionSummary ?? raw.prescription_summary ?? '',
      raw
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target.result);
      setImagePreview(ev.target.result);
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
      const normalized = normalizeResult(analysisResult);
      setResult(normalized);

      if (normalized?.emergency) {
        toast.error('Emergency condition detected! Seek immediate medical attention.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Mild':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Moderate':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Severe':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const copyText = async (text, successMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error('Copy failed');
    }
  };

  const copyAnalysis = async () => {
    if (!result) return;
    await copyText(JSON.stringify(result.raw ?? result, null, 2), 'Analysis copied to clipboard');
  };

  // PDF Download Function - FIXED VERSION
  const downloadPDF = () => {
    if (!result) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const addSection = (title, content, isArray = false) => {
      if (!content || (isArray && content.length === 0)) return;

      checkPageBreak(20);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(title, margin, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);

      if (isArray) {
        content.forEach((item) => {
          checkPageBreak(8);
          const lines = pdf.splitTextToSize('- ' + item, contentWidth - 5);
          pdf.text(lines, margin + 3, yPos);
          yPos += lines.length * 5;
        });
      } else {
        const lines = pdf.splitTextToSize(content, contentWidth);
        lines.forEach((line) => {
          checkPageBreak(6);
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
      }
      yPos += 4;
    };

    // Header with gradient effect
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Medical Image Analysis Report', margin, 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated: ' + new Date().toLocaleString(), margin, 28);
    pdf.text('AI-Powered Analysis', margin, 34);

    yPos = 50;

    // Emergency Alert
    if (result.emergency) {
      pdf.setFillColor(254, 226, 226);
      pdf.setDrawColor(239, 68, 68);
      pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'FD');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(185, 28, 28);
      pdf.text('[!] EMERGENCY: Seek Immediate Medical Attention', margin + 5, yPos + 10);
      yPos += 22;
    }

    // Main Diagnosis Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('DETECTED CONDITION', margin + 5, yPos + 8);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    const conditionText = result.detectedCondition || 'Unknown';
    const conditionLines = pdf.splitTextToSize(conditionText, contentWidth - 10);
    pdf.text(conditionLines[0], margin + 5, yPos + 18);

    // Severity and Confidence
    const severityColors = {
      Mild: [16, 185, 129],
      Moderate: [245, 158, 11],
      Severe: [239, 68, 68]
    };
    const sevColor = severityColors[result.severityLevel] || [100, 116, 139];

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Severity:', margin + 5, yPos + 28);
    pdf.setTextColor(...sevColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(result.severityLevel || 'N/A', margin + 25, yPos + 28);

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confidence:', margin + 60, yPos + 28);
    pdf.setTextColor(99, 102, 241);
    pdf.setFont('helvetica', 'bold');
    pdf.text(result.confidenceScore + '%', margin + 85, yPos + 28);

    yPos += 45;

    // Sections
    addSection('Visual Findings', result.visualFindings);
    addSection('Possible Causes', result.possibleCauses, true);
    addSection('Recommended Care', result.recommendedCare, true);
    addSection('Immediate Steps', result.immediateSteps, true);
    addSection('Home Remedies', result.homeRemedies, true);

    // OTC by Symptom
    if (result.otcBySymptom && Object.keys(result.otcBySymptom).length > 0) {
      checkPageBreak(15);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('OTC Suggestions by Symptom', margin, yPos);
      yPos += 6;

      Object.entries(result.otcBySymptom).forEach(([symptom, meds]) => {
        if (meds?.length) {
          checkPageBreak(10);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(71, 85, 105);
          pdf.text(symptom + ':', margin + 3, yPos);
          yPos += 5;
          pdf.setFont('helvetica', 'normal');
          meds.forEach((m) => {
            checkPageBreak(6);
            pdf.text('  - ' + m, margin + 5, yPos);
            yPos += 5;
          });
          yPos += 2;
        }
      });
      yPos += 4;
    }

    // Red Flags Box
    if (result.redFlags?.length > 0) {
      checkPageBreak(25);
      pdf.setFillColor(254, 242, 242);
      pdf.setDrawColor(252, 165, 165);
      const boxHeight = 10 + result.redFlags.length * 6;
      pdf.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'FD');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(185, 28, 28);
      pdf.text('[!] Red Flags', margin + 5, yPos + 7);
      yPos += 12;
      pdf.setFont('helvetica', 'normal');
      result.redFlags.forEach((flag) => {
        pdf.text('- ' + flag, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Safety Note
    if (result.safetyNote) {
      checkPageBreak(15);
      pdf.setFillColor(255, 251, 235);
      pdf.setDrawColor(253, 230, 138);
      const lines = pdf.splitTextToSize(result.safetyNote, contentWidth - 10);
      pdf.roundedRect(margin, yPos, contentWidth, 8 + lines.length * 5, 2, 2, 'FD');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(146, 64, 14);
      pdf.text('Safety Note:', margin + 5, yPos + 6);
      pdf.setFont('helvetica', 'normal');
      lines.forEach((line, i) => {
        pdf.text(line, margin + 5, yPos + 12 + i * 5);
      });
      yPos += 15 + lines.length * 5;
    }

    // When to See Doctor
    addSection('When to See a Doctor', result.whenToSeeDoctor);

    // Medication Plan Table
    if (result.medicationPlan?.length > 0) {
      checkPageBreak(30);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Medication Plan', margin, yPos);
      yPos += 8;

      const colWidths = [35, 30, 35, 30, 30];
      const headers = ['Medicine', 'Dose', 'Frequency', 'Timing', 'Duration'];

      // Table Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, yPos, contentWidth, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      let xPos = margin + 2;
      headers.forEach((h, i) => {
        pdf.text(h, xPos, yPos + 5);
        xPos += colWidths[i];
      });
      yPos += 8;

      // Table Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 65, 85);
      result.medicationPlan.forEach((med) => {
        checkPageBreak(8);
        xPos = margin + 2;
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, yPos, margin + contentWidth, yPos);
        const row = [
          med.medicine || '-',
          med.dosagePattern || '-',
          med.frequency || '-',
          med.timing || '-',
          med.duration || '-'
        ];
        row.forEach((cell, i) => {
          const truncated = cell.length > 15 ? cell.substring(0, 14) + '...' : cell;
          pdf.text(truncated, xPos, yPos + 5);
          xPos += colWidths[i];
        });
        yPos += 8;
      });
      yPos += 8;
    }

    // Prescription Text
    if (result.prescriptionText) {
      checkPageBreak(20);
      addSection('Prescription Text (Extracted)', result.prescriptionText);
    }

    // Footer Disclaimer
    checkPageBreak(25);
    yPos = Math.max(yPos, pageHeight - 35);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos, contentWidth, 20, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    const disclaimer =
      result.disclaimer ||
      'This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.';
    const discLines = pdf.splitTextToSize(disclaimer, contentWidth - 10);
    discLines.forEach((line, i) => {
      pdf.text(line, margin + 5, yPos + 6 + i * 4);
    });

    // Save PDF
    const filename = 'medical-report-' + new Date().toISOString().split('T')[0] + '.pdf';
    pdf.save(filename);
    toast.success('Report downloaded successfully!');
  };

  const renderList = (items, icon = null) => {
    if (!items?.length) return null;
    return (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={String(item) + '-' + i} className="text-sm text-slate-700 flex items-start gap-2">
            {icon ? icon : <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="image-analysis-page">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
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
            <p className="mt-2 text-slate-600 max-w-3xl mx-auto">
              Upload medical images (X-ray, MRI, CT, prescription, skin/wound photos) for structured AI insights.
            </p>
          </motion.div>

          {result?.emergency && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
              <Alert className="border-red-500 bg-red-50" data-testid="emergency-alert">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 font-semibold text-lg">Emergency Alert</AlertTitle>
                <AlertDescription className="text-red-700 mt-2">
                  <strong>Seek Immediate Medical Attention.</strong>
                  <br />
                  AI flagged this as severe. Please contact emergency care immediately.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload panel */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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
                        <p className="text-xs text-slate-500">JPG, PNG or WEBP (max 10MB)</p>
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
                    <Alert className="mt-4 border-red-200 bg-red-50" data-testid="analysis-error-alert">
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

            {/* Result panel */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-heading flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Analysis Results
                  </CardTitle>

                  {result && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPDF}
                        data-testid="download-pdf-button"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAnalysis}
                        data-testid="copy-analysis-button"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {result ? (
                    <div className="space-y-5" data-testid="analysis-results">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Detected Condition
                        </p>
                        <p className="text-xl font-semibold text-slate-900">{result.detectedCondition}</p>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-500 mb-1">Severity</p>
                          <span
                            className={'inline-flex px-3 py-1 rounded-full text-sm font-medium border ' + getSeverityColor(result.severityLevel)}
                          >
                            {result.severityLevel}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-500 mb-1">Confidence</p>
                          <p className="text-lg font-semibold text-slate-900">{result.confidenceScore}%</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Visual Findings</p>
                        <p className="text-slate-700">{result.visualFindings}</p>
                      </div>

                      {result.possibleCauses?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Possible Causes</p>
                          {renderList(result.possibleCauses)}
                        </div>
                      )}

                      {result.recommendedCare?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Recommended Care</p>
                          {renderList(
                            result.recommendedCare,
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          )}
                        </div>
                      )}

                      {result.immediateSteps?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Immediate Steps</p>
                          {renderList(result.immediateSteps)}
                        </div>
                      )}

                      {result.homeRemedies?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Home Remedies</p>
                          {renderList(result.homeRemedies)}
                        </div>
                      )}

                      {!!Object.keys(result.otcBySymptom || {}).length && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            OTC Suggestions by Symptom
                          </p>
                          <div className="space-y-2">
                            {Object.entries(result.otcBySymptom).map(([symptom, meds]) => {
                              if (!meds?.length) return null;
                              return (
                                <div key={symptom} className="p-2 border border-slate-200 rounded-lg bg-white">
                                  <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                                    {symptom}
                                  </p>
                                  <ul className="space-y-1">
                                    {meds.map((m, idx) => (
                                      <li key={symptom + '-' + idx} className="text-sm text-slate-700">
                                        - {m}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {result.redFlags?.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100" data-testid="red-flags-box">
                          <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Red Flags
                          </p>
                          {renderList(result.redFlags)}
                        </div>
                      )}

                      {result.safetyNote && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-sm text-amber-800">
                            <strong>Safety Note:</strong> {result.safetyNote}
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          When to See a Doctor
                        </p>
                        <p className="text-sm text-blue-700">{result.whenToSeeDoctor}</p>
                      </div>

                      {/* Prescription output */}
                      {(result.prescriptionSummary || result.medicationPlan?.length > 0 || result.prescriptionText) && (
                        <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Prescription Extraction
                          </p>

                          {result.prescriptionSummary && (
                            <p className="text-sm text-slate-700">{result.prescriptionSummary}</p>
                          )}

                          {result.prescriptionText && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Extracted Text</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyText(result.prescriptionText, 'Prescription text copied')}
                                  data-testid="copy-prescription-text-button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy Text
                                </Button>
                              </div>
                              <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-white border rounded p-2 max-h-48 overflow-auto">
                                {result.prescriptionText}
                              </pre>
                            </div>
                          )}

                          {result.medicationPlan?.length > 0 && (
                            <div className="overflow-auto">
                              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Medication Plan</p>
                              <table className="w-full text-sm border border-slate-200 rounded" data-testid="medication-plan-table">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="text-left p-2 border-b">Medicine</th>
                                    <th className="text-left p-2 border-b">Dose</th>
                                    <th className="text-left p-2 border-b">Frequency</th>
                                    <th className="text-left p-2 border-b">Timing</th>
                                    <th className="text-left p-2 border-b">Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.medicationPlan.map((m, i) => (
                                    <tr key={(m.medicine || 'med') + '-' + i} className="border-b last:border-b-0">
                                      <td className="p-2">{m.medicine || '-'}</td>
                                      <td className="p-2">{m.dosagePattern || '-'}</td>
                                      <td className="p-2">{m.frequency || '-'}</td>
                                      <td className="p-2">{m.timing || '-'}</td>
                                      <td className="p-2">{m.duration || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-500 italic mt-2">{result.disclaimer}</p>

                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate('/image-history')}
                        data-testid="view-history-button"
                      >
                        View Analysis History
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <ScanLine className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-slate-500">Upload an image to see analysis results</p>
                      <p className="text-sm text-slate-400 mt-2">Supports MRI, X-ray, prescription, skin and wound analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-amber-800">
              <strong>Medical Disclaimer:</strong> This AI analysis is informational only and not a medical diagnosis.
              Always consult a qualified healthcare professional.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ImageAnalysis;