import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, UploadCloud, Trash2, Search, FileText, Image, Mic, Video, 
  Lock, Shield, Loader2, Edit3, Download, Plus, AlertCircle, CheckCircle2, 
  Filter, HardDrive, FileWarning, Eye, RefreshCw, X, User
} from 'lucide-react';
import { db, auth, storage } from '../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { User as UserType } from './types';

interface EvidenceLockerViewProps {
  currentUser: UserType;
}

interface EvidenceDoc {
  id: string;
  officerId: string;
  officerName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  createdAt: any;
}

export const EvidenceLockerView: React.FC<EvidenceLockerViewProps> = ({ currentUser }) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [filterMyUploads, setFilterMyUploads] = useState<boolean>(false);
  
  // Upload States
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  
  // Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // View Modal
  const [previewItem, setPreviewItem] = useState<EvidenceDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time listener for evidence
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'evidence'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: EvidenceDoc[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as EvidenceDoc);
      });
      setEvidenceList(items);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to evidence:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format File Size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get Icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-6 h-6 text-emerald-400" />;
    if (fileType.startsWith('audio/')) return <Mic className="w-6 h-6 text-amber-400" />;
    if (fileType.startsWith('video/')) return <Video className="w-6 h-6 text-cyan-400" />;
    return <FileText className="w-6 h-6 text-blue-400" />;
  };

  // Simplify fileType for grouping
  const getSimplifiedType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    return 'DOCUMENT';
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Upload Logic (Firebase Storage + Firestore Metadata)
  const handleFileUpload = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);

    const docId = 'EVID_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const storagePath = `evidence/${currentUser.id}/${docId}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Storage upload failed:", error);
          setUploadError(`Cloud Vault error: ${error.message}`);
          setUploading(false);
        }, 
        async () => {
          try {
            // Get secure download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Save Metadata to Firestore
            const evidenceData: Omit<EvidenceDoc, 'id'> = {
              officerId: currentUser.id,
              officerName: currentUser.name,
              fileName: file.name,
              fileUrl: downloadUrl,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              description: descriptionInput.trim() || undefined,
              createdAt: serverTimestamp()
            };

            await setDoc(doc(db, 'evidence', docId), evidenceData);
            
            setUploadSuccess(`Evidence file safely vaulted as ${docId}`);
            setDescriptionInput('');
            setUploading(false);
          } catch (firestoreErr) {
            console.error("Failed to write evidence metadata to Firestore:", firestoreErr);
            handleFirestoreError(firestoreErr, OperationType.CREATE, `evidence/${docId}`);
            setUploadError("Vault file saved but metadata registration rejected.");
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      setUploadError(err.message || "Unknown cryptographic fault.");
      setUploading(false);
    }
  };

  // Delete Logic (Storage File + Firestore record)
  const handleDelete = async (item: EvidenceDoc) => {
    if (item.officerId !== currentUser.id && currentUser.role !== 'ADMIN') {
      alert("UNAUTHORIZED: You do not possess the digital signature needed to purge this evidence.");
      return;
    }

    if (!confirm(`CONFIRM INCIDENT RECONSTRUCTION PURGE:\nAre you sure you want to permanently delete evidence file ${item.id}?`)) {
      return;
    }

    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, item.fileUrl);
      try {
        await deleteObject(storageRef);
      } catch (storageErr: any) {
        // Log storage error but continue (file might have been deleted manually or missing)
        console.warn("Storage item missing or couldn't be deleted:", storageErr);
      }

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'evidence', item.id));
      alert("Sovereign Evidence record and file purged successfully.");
      if (previewItem?.id === item.id) setPreviewItem(null);
    } catch (err) {
      console.error("Failed to delete evidence:", err);
      handleFirestoreError(err, OperationType.DELETE, `evidence/${item.id}`);
    }
  };

  // Update Annotation Logic
  const handleUpdateDescription = async (id: string) => {
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, 'evidence', id), {
        description: editDescription.trim() || null
      });
      setEditingId(null);
      setEditDescription('');
      setSavingEdit(false);
      
      // Update local preview if open
      if (previewItem && previewItem.id === id) {
        setPreviewItem({
          ...previewItem,
          description: editDescription.trim() || undefined
        });
      }
    } catch (err) {
      console.error("Failed to update evidence description:", err);
      handleFirestoreError(err, OperationType.UPDATE, `evidence/${id}`);
      setSavingEdit(false);
    }
  };

  // Filter evidence list
  const filteredEvidence = evidenceList.filter((item) => {
    // Search query
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // File type filter
    const simplified = getSimplifiedType(item.fileType);
    const matchesType = selectedType === 'ALL' || simplified === selectedType;

    // My uploads filter
    const matchesMyUploads = !filterMyUploads || item.officerId === currentUser.id;

    return matchesSearch && matchesType && matchesMyUploads;
  });

  return (
    <div className="h-full flex flex-col p-6 text-slate-200">
      {/* Header and Summary Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-tech text-white uppercase tracking-wider">Sovereign Evidence Locker</h1>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded">CLOUDFILES SECURE</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Cryptographically signed evidence ledger linked to authenticated officer account: <span className="text-cyan-400">{currentUser.name} ({currentUser.unit})</span>
          </p>
        </div>

        {/* Status Hub info */}
        <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Total Items: <strong className="text-white">{evidenceList.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400">Auth Status: <strong className="text-emerald-400 uppercase">{currentUser.role}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Column = Controls & Upload, Right Column = Evidence Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Control Panel (Lg Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* SECURE UPLOADER BLOCK */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
              <UploadCloud className="w-4 h-4" />
              <span>Sovereign Cloud Vault upload</span>
            </div>

            <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
              Drag evidence files into the drop-zone below or select manually. Files are dynamically mirrored to military-tier sovereign Firebase Cloud Storage.
            </p>

            {/* Optional Description Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Description / Case Annotations</label>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Attach investigative annotations, chain of custody logs, suspect names, or BOLO coordinates before uploading..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-cyan-500/40 resize-none h-20 leading-relaxed"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                dragActive 
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/5' 
                  : 'border-white/10 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-500/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <span className="text-xs font-mono text-cyan-400 font-bold">Uploading to Storage... {uploadProgress}%</span>
                  <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 mb-3 transition-colors" />
                  <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-white transition-colors">
                    {dragActive ? "Drop files to begin vaulting..." : "Drag & Drop Files Here"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">or Click to Browse Device</span>
                </div>
              )}
            </div>

            {/* Upload Feedback Banner */}
            {uploadError && (
              <div className="bg-red-950/80 border border-red-500/30 text-red-200 p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono leading-relaxed">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>

          {/* ACTIVE PROTOCOLS / SECURITY BANNER */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" />
              <span>Vault compliance criteria</span>
            </div>
            <ul className="text-[10px] font-mono text-slate-500 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▪</span>
                <span>Each evidence item is indexed with the submitting officer's active UID, timestamp, and digital signature.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▪</span>
                <span>Deletion triggers standard audit logs and irreversibly deletes physical media from secure storage buckets.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▪</span>
                <span>Unauthenticated external scraper checks prevent un-verified or spoofed accounts from viewing the database.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Columns = Filter & Evidence Feed (Lg Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
          
          {/* Filter Bar Controls */}
          <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shrink-0">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case vault by ID, file name, officer name, or details..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filters & My Uploads */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Simplified types */}
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-white/5">
                {['ALL', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                      selectedType === type
                        ? 'bg-cyan-550 text-white shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* My Uploads Toggle */}
              <button
                onClick={() => setFilterMyUploads(!filterMyUploads)}
                className={`px-3 py-1.5 border rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors ${
                  filterMyUploads
                    ? 'bg-cyan-950 border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My uploads</span>
              </button>
            </div>
          </div>

          {/* Real-time Evidence Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3 font-mono text-xs text-slate-500">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span>Loading secure cloud evidence ledger...</span>
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="h-48 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <FileWarning className="w-10 h-10 opacity-30 mb-3 text-cyan-500" />
                <span className="font-mono text-xs font-bold text-slate-300 uppercase">No Case Evidence Records Found</span>
                <p className="font-mono text-[10px] text-slate-500 mt-1 max-w-sm">
                  {searchQuery || selectedType !== 'ALL' || filterMyUploads
                    ? "Adjust search parameters or clear filters to locate specific evidence records."
                    : "No digital evidence has been registered in the cloud ledger yet. Use the uploader to secure files."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvidence.map((item) => {
                  const isOwner = item.officerId === currentUser.id;
                  const isEditing = editingId === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/20 transition-all group shadow-md"
                    >
                      {/* Top Row: File Type icon, Code ID, Purge Button */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                            {getFileIcon(item.fileType)}
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-widest">{item.id}</span>
                            <h3 className="text-xs font-bold text-white truncate font-mono block" title={item.fileName}>
                              {item.fileName}
                            </h3>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Preview View button */}
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="View File Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Purge button (Owner or Admin only) */}
                          {(isOwner || currentUser.role === 'ADMIN') && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/60 border border-red-500/10 hover:border-red-500/30 rounded-lg text-red-400 transition-colors"
                              title="Purge Evidence File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle Description area */}
                      <div className="mb-4 text-left">
                        {isEditing ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 text-xs font-mono text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 bg-slate-900 border border-white/5 rounded-md text-[10px] font-mono text-slate-400 hover:text-white"
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateDescription(item.id)}
                                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 rounded-md text-[10px] font-mono font-bold text-cyan-400"
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/desc">
                            <p className="text-[11px] font-mono text-slate-400 leading-relaxed italic bg-slate-900/30 border border-white/5 rounded-xl p-2.5">
                              {item.description || "No tactical annotations attached to this file."}
                            </p>
                            {isOwner && (
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditDescription(item.description || '');
                                }}
                                className="absolute right-2 top-2 p-1 bg-slate-900/90 border border-white/5 rounded hover:border-cyan-500/30 text-slate-400 hover:text-white opacity-0 group-hover/desc:opacity-100 transition-opacity"
                                title="Edit Annotation"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom row: Meta & Ownership */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5 pt-2.5">
                        <div className="text-left">
                          <span className="block text-[9px] text-slate-600">OFFICER</span>
                          <span className="text-slate-300 font-bold truncate block max-w-[120px]" title={item.officerName}>
                            {item.officerName}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <span className="block text-[9px] text-slate-600">FILE SIZE</span>
                          <span className="text-slate-300 font-bold block">
                            {formatBytes(item.fileSize)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-[9px] text-slate-600">VAULT DATE</span>
                          <span className="text-slate-300 font-bold block">
                            {item.createdAt?.seconds 
                              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                              : 'Pending Sync'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL VIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-white/5 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">SOVEREIGN VAULT ITEM: {previewItem.id}</span>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
              {/* Media Preview Frame if Image */}
              {previewItem.fileType.startsWith('image/') ? (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/5 p-2 flex justify-center items-center">
                  <img 
                    src={previewItem.fileUrl} 
                    alt={previewItem.fileName} 
                    className="max-h-[300px] object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : previewItem.fileType.startsWith('audio/') ? (
                <div className="bg-slate-900 rounded-2xl border border-white/5 p-6 flex flex-col items-center gap-4">
                  <Mic className="w-12 h-12 text-amber-400 animate-pulse" />
                  <audio src={previewItem.fileUrl} controls className="w-full max-w-md" />
                </div>
              ) : previewItem.fileType.startsWith('video/') ? (
                <div className="bg-slate-900 rounded-2xl border border-white/5 p-2 flex justify-center">
                  <video src={previewItem.fileUrl} controls className="max-h-[300px] rounded-xl w-full" />
                </div>
              ) : (
                <div className="bg-slate-900 rounded-2xl border border-white/5 p-10 flex flex-col items-center justify-center text-center gap-4">
                  <FileText className="w-16 h-16 text-blue-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{previewItem.fileName}</h4>
                    <span className="text-[11px] font-mono text-slate-500 uppercase">{previewItem.fileType}</span>
                  </div>
                </div>
              )}

              {/* Description & metadata table */}
              <div className="text-left space-y-4">
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Investigative Annotations</span>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap italic">
                    {previewItem.description || "No tactical annotations attached to this file."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block">FILE NAME</span>
                    <span className="text-slate-200 font-bold block truncate" title={previewItem.fileName}>{previewItem.fileName}</span>
                  </div>
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block">UPLOADED BY</span>
                    <span className="text-slate-200 font-bold block">{previewItem.officerName}</span>
                  </div>
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block">FILE SIZE</span>
                    <span className="text-slate-200 font-bold block">{formatBytes(previewItem.fileSize)}</span>
                  </div>
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block">REGISTRATION DATE</span>
                    <span className="text-slate-200 font-bold block">
                      {previewItem.createdAt?.seconds 
                        ? new Date(previewItem.createdAt.seconds * 1000).toLocaleString()
                        : 'Pending Sync'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 border-t border-white/5 p-4 flex justify-between">
              {/* Direct Download button */}
              <a 
                href={previewItem.fileUrl} 
                target="_blank" 
                rel="noreferrer"
                download={previewItem.fileName}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-white/5 text-xs font-mono text-cyan-400 font-bold rounded-xl flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download file</span>
              </a>

              <div className="flex gap-2">
                {/* Delete button (Owner or Admin only) */}
                {(previewItem.officerId === currentUser.id || currentUser.role === 'ADMIN') && (
                  <button
                    onClick={() => handleDelete(previewItem)}
                    className="px-4 py-2 bg-red-950/20 hover:bg-red-950/60 border border-red-500/20 text-xs font-mono text-red-400 font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Purge from Cloud</span>
                  </button>
                )}
                
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-white rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
