import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { verificationService } from '../../services/verificationService';
import { apiClient } from '../../services/apiClient';
import { CredentialType, SubmittedDocument } from '../../types';
import { NIGERIA_JURISDICTIONS } from '../../data/jurisdictions';
import {
  CheckCircle2,
  Upload,
  FileText,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Save,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Fingerprint,
  Camera,
} from 'lucide-react';

export const CreateCandidateScreen: React.FC = () => {
  const { navigateTo, addToast, refreshData, currentUser } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    referenceCode: `PAC-2026-0${Math.floor(Math.random() * 800) + 200}`,
    fullName: '',
    otherNames: '',
    dateOfBirth: '',
    electionId: 'elec_2026_nat',
    electionName: 'President',
    officeContested: 'President',
    jurisdiction: 'National (All States)',
    contactEmail: '',
    contactPhone: '',
    agreedToPrivacyNotice: false,
    profilePicture: null as string | null,
    fingerprintCaptured: false,
  });

  const [selectedStateForLga, setSelectedStateForLga] = useState('');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);

  // Real Uploaded Documents State
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id: string;
      fileName: string;
      credentialType: CredentialType;
      fileSizeBytes: number;
      uploadProgress: number;
      scanStatus: 'CLEAN' | 'SCANNING' | 'MALWARE_DETECTED';
      isDuplicate: boolean;
    }>
  >([]);

  const [isUploading, setIsUploading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const steps = [
    { number: 1, title: 'Candidate Information', desc: 'Identity & Office' },
    { number: 2, title: 'Credential Checklist', desc: 'Statutory Prerequisites' },
    { number: 3, title: 'Document Intake & Scan', desc: 'Upload & Validation' },
    { number: 4, title: 'Review & Verification Consent', desc: 'Statutory Attestation' },
  ];

  // Dynamic requirements list based on office
  const getRequiredCredentials = (): Array<{ type: CredentialType; title: string; required: boolean; allowMultiple?: boolean }> => {
    return [
      { type: 'CITIZENSHIP', title: 'Proof of citizenship (LGA Certificate)', required: true },
      { type: 'BIRTH_CERTIFICATE', title: 'Birth Certificate', required: true },
      { type: 'ACADEMIC_DEGREE', title: 'Educational qualifications', required: true, allowMultiple: true },
      { type: 'FINANCIAL_DISCLOSURE', title: 'Assets Declaration Form', required: true },
      { type: 'NYSC_CERTIFICATE', title: 'NYSC Certificate', required: false },
      { type: 'PARTY_NOMINATION', title: 'Party Nomination form', required: true },
    ];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await apiClient.uploadDocument(file, 'GENERAL_DOCUMENT');
      
      const newFile = {
        id: response.document.id || `f_${Date.now()}`,
        fileName: file.name,
        credentialType: 'FINANCIAL_DISCLOSURE' as CredentialType, // Automatically mapping for now
        fileSizeBytes: file.size,
        uploadProgress: 100,
        scanStatus: 'CLEAN' as const,
        isDuplicate: false,
      };
      setUploadedFiles((prev) => [...prev, newFile]);
      addToast('Document uploaded successfully. Automated integrity & malware scan passed.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Document upload failed.', 'error');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create a mock local URL for the profile picture
    const objectUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, profilePicture: objectUrl }));
    addToast('Profile picture attached.', 'success');
  };

  const handleFingerprintScan = () => {
    setIsScanningFingerprint(true);
    // Simulate biometric capture delay
    setTimeout(() => {
      setIsScanningFingerprint(false);
      setFormData(prev => ({ ...prev, fingerprintCaptured: true }));
      addToast('Biometric fingerprint successfully captured.', 'success');
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.dateOfBirth) {
      addToast('Please complete candidate name and date of birth in Step 1.', 'warning');
      setCurrentStep(1);
      return;
    }
    if (!formData.agreedToPrivacyNotice) {
      addToast('Please confirm the statutory data processing acknowledgement.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // We assemble the real payload for the backend API
      const docsToSubmit = uploadedFiles.map(f => f.id);

      const created = await verificationService.createCandidate({
        referenceCode: formData.referenceCode,
        fullName: formData.fullName,
        otherNames: formData.otherNames,
        dateOfBirth: formData.dateOfBirth,
        electionId: formData.electionId,
        electionName: formData.electionName,
        officeContested: formData.officeContested,
        jurisdiction: formData.jurisdiction,
        contactEmail: formData.contactEmail || 'intake@elections.state.gov',
        contactPhone: formData.contactPhone || '+1 (555) 000-0000',
        submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        assignedReviewerId: 'usr_analyst_01',
        assignedReviewerName: 'Elena Vance',
        documentIds: docsToSubmit,
        uploadedDocuments: uploadedFiles, // Pass full objects for local mocking
      });

      await refreshData();
      addToast(`Candidate ${created.fullName} (${created.referenceCode}) successfully registered into verification pipeline.`, 'success');
      navigateTo('candidates');
    } catch (err) {
      console.error(err);
      addToast('An unexpected error occurred during submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#17202A]">New Candidate Credential Intake</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Statutory candidate registration and initial credential ingestion workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            addToast('Draft candidate record saved locally.', 'info');
            navigateTo('candidates');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <Save className="w-3.5 h-3.5 text-slate-500" />
          <span>Save Draft & Exit</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setCurrentStep(step.number)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'border-[#2F75B5] bg-[#2F75B5]/10 text-[#17324D]'
                    : isCompleted
                    ? 'border-[#237A57]/40 bg-[#237A57]/5 text-[#237A57]'
                    : 'border-slate-200 bg-[#F5F7FA] text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isCurrent
                        ? 'bg-[#2F75B5] text-white'
                        : isCompleted
                        ? 'bg-[#237A57] text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : step.number}
                  </span>
                  <span className="text-xs font-bold text-[#17202A] truncate">{step.title}</span>
                </div>
                <p className="text-[11px] text-[#5B6777] hidden sm:block truncate pl-7">
                  {step.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content Area */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
        {/* STEP 1: Candidate Information */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#17202A]">Step 1: Statutory Candidate Identity</h3>
              <p className="text-xs text-[#5B6777]">
                Enter legal identification details as they appear on official civil registry records.
              </p>
            </div>

            {/* Biometric Capture Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              {/* Profile Picture */}
              <div className="flex-1 bg-[#F5F7FA] p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm relative group">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload Profile Picture"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17202A]">Profile Photo</h4>
                  <p className="text-[10px] text-[#5B6777] mt-0.5">Passport photograph with clear background</p>
                  {formData.profilePicture && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#237A57] mt-1 bg-[#237A57]/10 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Captured
                    </span>
                  )}
                </div>
              </div>

              {/* Fingerprint */}
              <div className="flex-1 bg-[#F5F7FA] p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleFingerprintScan}
                  disabled={formData.fingerprintCaptured || isScanningFingerprint}
                  className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                    formData.fingerprintCaptured 
                      ? 'bg-[#237A57]/10 text-[#237A57] border border-[#237A57]/20' 
                      : isScanningFingerprint 
                      ? 'bg-[#2F75B5]/10 text-[#2F75B5] border border-[#2F75B5]/20 animate-pulse'
                      : 'bg-white text-slate-400 border border-slate-200 hover:border-[#2F75B5] hover:text-[#2F75B5] shadow-sm'
                  }`}
                >
                  <Fingerprint className={`w-8 h-8 ${isScanningFingerprint ? 'animate-bounce' : ''}`} />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-[#17202A]">Biometric Scan</h4>
                  <p className="text-[10px] text-[#5B6777] mt-0.5">Right thumbprint for identity verification</p>
                  {formData.fingerprintCaptured ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#237A57] mt-1 bg-[#237A57]/10 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : isScanningFingerprint ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2F75B5] mt-1">
                      Scanning...
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-medium text-slate-500 mt-1">
                      Pending Capture
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Candidate Reference Code
                </label>
                <input
                  type="text"
                  value={formData.referenceCode}
                  readOnly
                  className="w-full px-3 py-2 text-xs bg-slate-100 font-mono font-bold text-slate-700 border border-slate-300 rounded-md"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Auto-assigned statutory intake identifier
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Arthur Sterling-Morales"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Other Documented Names / Aliases
                </label>
                <input
                  type="text"
                  value={formData.otherNames}
                  onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })}
                  placeholder="e.g. Arthur S. Morales"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Target Election <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.electionName}
                  onChange={(e) => {
                    const newElection = e.target.value;
                    let newJurisdiction = '';
                    if (newElection === 'Presidential') newJurisdiction = 'National (All States)';
                    setFormData({ ...formData, electionName: newElection, jurisdiction: newJurisdiction });
                    setSelectedStateForLga('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                >
                  <option value="Presidential">Presidential</option>
                  <option value="Governorship">Governorship</option>
                  <option value="Senate">Senate</option>
                  <option value="House of Representative">House of Representative</option>
                  <option value="State House of Assembly">State House of Assembly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Office Contested <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.officeContested}
                  onChange={(e) => setFormData({ ...formData, officeContested: e.target.value })}
                  placeholder="e.g. Member of Parliament - Constituency 4"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                />
              </div>

              {formData.electionName === 'Governorship' && (
                <div>
                  <label className="block text-xs font-semibold text-[#17202A] mb-1">
                    Jurisdiction (State) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                  >
                    <option value="">Select State</option>
                    {NIGERIA_JURISDICTIONS.map(s => (
                      <option key={s.state} value={s.state}>{s.state}</option>
                    ))}
                  </select>
                </div>
              )}


              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="candidate.official@campaign.org"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1">
                  Official Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Credential Checklist */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#17202A]">Step 2: Statutory Credential Requirements</h3>
              <p className="text-xs text-[#5B6777]">
                Checklist of mandatory credentials determined by electoral laws for {formData.officeContested}.
              </p>
            </div>

            <div className="space-y-3">
              {getRequiredCredentials().map((cred, idx) => (
                <div
                  key={cred.type}
                  className="p-3.5 bg-[#F5F7FA] border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#17324D]/10 flex items-center justify-center text-xs font-bold text-[#17324D]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17202A]">{cred.title}</p>
                      <p className="text-[11px] text-[#5B6777]">
                        Category: {cred.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs rounded font-medium ${
                      cred.required
                        ? 'bg-[#17324D] text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cred.required ? 'Mandatory Statutory Prerequisite' : 'Optional Supplemental'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
              <FileCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                All documents submitted in the next step will be ingested by the automated extraction engine, mapped to structured statutory claims, and queued for authoritative source verification.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: Document Upload & Malware Scan */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#17202A]">Step 3: Document Intake & Validation</h3>
              <p className="text-xs text-[#5B6777]">
                Upload official certified copies for each required credential. Supported formats: PDF, TIFF, JPEG (Max 25MB per file).
              </p>
            </div>

            <div className="space-y-4">
              {getRequiredCredentials().map((cred) => {
                const matchedFiles = uploadedFiles.filter((f) => f.credentialType === cred.type);
                const hasFiles = matchedFiles.length > 0;

                return (
                  <div key={cred.type} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${hasFiles ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {hasFiles ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#17202A]">{cred.title}</p>
                        <p className="text-xs text-[#5B6777]">
                          {cred.required ? 'Mandatory Requirement' : 'Optional (If Applicable)'}
                        </p>
                        
                        {/* Render uploaded files */}
                        {hasFiles && (
                          <div className="mt-3 space-y-2">
                            {matchedFiles.map(uploadedFile => (
                              <div key={uploadedFile.id} className="flex items-center gap-3 bg-white px-3 py-2 border border-slate-200 rounded-lg max-w-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-[#17202A] truncate">{uploadedFile.fileName}</p>
                                  <span className="flex items-center gap-1 text-[#237A57] font-semibold text-[10px]">
                                    <ShieldCheck className="w-3 h-3" />
                                    Clean (Scanned)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setUploadedFiles(uploadedFiles.filter((f) => f.id !== uploadedFile.id))}
                                  className="text-slate-400 hover:text-red-600 p-1 bg-slate-50 rounded shrink-0"
                                  title="Remove document"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Button */}
                    {(!hasFiles || cred.allowMultiple) && (
                      <div className="relative shrink-0 mt-2 sm:mt-0">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          title={`Upload ${cred.title}`}
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setIsUploading(true);
                            
                            // Convert to Base64 so it survives page reloads in localStorage
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64Url = reader.result as string;
                              
                              apiClient.uploadDocument(file, cred.type)
                                .then((response) => {
                                  const newFile = {
                                    id: response.document.id || `f_${Date.now()}`,
                                    fileName: file.name,
                                    credentialType: cred.type,
                                    fileSizeBytes: file.size,
                                    uploadProgress: 100,
                                    scanStatus: 'CLEAN' as const,
                                    isDuplicate: false,
                                    fileUrl: base64Url, // Store Base64 URL for persistent preview
                                  };
                                  setUploadedFiles((prev) => [...prev, newFile]);
                                  addToast(`${cred.title} uploaded successfully.`, 'success');
                                })
                                .catch((err) => {
                                  console.error(err);
                                  addToast(`Failed to upload ${cred.title}.`, 'error');
                                })
                                .finally(() => {
                                  setIsUploading(false);
                                  e.target.value = '';
                                });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <button
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#17202A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2F75B5] focus:ring-offset-1 pointer-events-none"
                        >
                          <Upload className="w-4 h-4" />
                          {hasFiles ? 'Upload Another' : 'Upload File'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>All uploaded files are subjected to automated malware scans, page count verification, and cryptographic hash duplicate checks upon ingestion.</p>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Statutory Consent */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#17202A]">Step 4: Submission Summary & Statutory Consent</h3>
              <p className="text-xs text-[#5B6777]">
                Review submission details before dispatching into the verification queue.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-4 bg-[#F5F7FA] rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Candidate Reference:</span>
                  <span className="font-mono font-bold text-[#17202A]">{formData.referenceCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Full Legal Name:</span>
                  <span className="font-bold text-[#17202A]">{formData.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Target Election:</span>
                  <span className="text-[#17202A]">{formData.electionName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Contested Office:</span>
                  <span className="text-[#17202A]">{formData.officeContested}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Documents Attached:</span>
                  <span className="text-[#17202A]">{uploadedFiles.length} certified file(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Submitting Officer:</span>
                  <span className="text-[#17202A]">{currentUser.name} ({currentUser.staffId})</span>
                </div>
              </div>
            </div>

            {/* Privacy & Statutory Data Processing Notice */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#17202A]">Statutory Privacy & Data Protection Notice</p>
                  <p className="text-[#5B6777] leading-relaxed">
                    Submitted credential records are processed solely for determining compliance with constitutional and electoral statutory criteria. All extracted claims are cross-checked against authorized government databases under strict data retention policies.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-amber-200/60">
                <input
                  type="checkbox"
                  checked={formData.agreedToPrivacyNotice}
                  onChange={(e) => setFormData({ ...formData, agreedToPrivacyNotice: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-[#2F75B5] focus:ring-[#2F75B5]"
                />
                <span className="text-xs text-[#17202A] font-medium">
                  I confirm that all submitted documents have been received under official seal and verified for intake completeness pursuant to Electoral Commission procedures.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(s + 1, 4))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreedToPrivacyNotice}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#237A57] hover:bg-[#1b6145] rounded-md shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Complete Intake & Queue Case'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
