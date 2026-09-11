"use client";

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, Save, RefreshCw, LayoutTemplate, 
  Award, ShieldCheck, Sparkles,
  Download, Eye, EyeOff, AlignCenter, AlignLeft, AlignRight, Upload, FileCode2, Sliders, Layers,
  Stamp, Type, Palette, Maximize2, X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ElementStyle {
  left: number; // percentage
  top: number; // percentage
  fontSize: number; // px
  color: string; // hex
  text: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: 'cinzel' | 'playfair' | 'script' | 'sans' | 'mono';
  visible: boolean;
}

export interface TemplateConfig {
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'double' | 'gradient' | 'dashed';
  bgPattern: 'solid' | 'vignette' | 'guilloche' | 'cyberGrid' | 'parchment';
  innerBorder: boolean;
  innerBorderStyle: 'solid' | 'double' | 'dashed' | 'dotted';
  innerBorderOffset: number; // in px
  cornerOrnaments: boolean;
  cornerOrnamentStyle: 'flourish' | 'artDeco' | 'techBrackets' | 'royalSwirls';
  showSeal: boolean;
  sealType: 'ribbonGold' | 'blockchainCrest' | 'starburst' | 'cyberShield' | 'waxSeal';
  sealPosition: 'topRight' | 'bottomCenter' | 'topLeft' | 'bottomLeft' | 'bottomRight';
  showQr: boolean;
  institutionName: ElementStyle;
  subtitle: ElementStyle;
  studentName: ElementStyle;
  studentId: ElementStyle;
  degree: ElementStyle;
  course: ElementStyle;
  department: ElementStyle;
  grade: ElementStyle;
  certId: ElementStyle;
  issueDate: ElementStyle;
  expiryDate: ElementStyle;
  signature1: ElementStyle;
  signature2: ElementStyle;
}

// Master Standard Academic Diploma Configuration (Grammatically & Visually Perfect)
const defaultTemplate: TemplateConfig = {
  bgColor: '#080e1e',
  borderColor: '#d4af37', // Imperial Gold
  borderWidth: 3,
  borderStyle: 'double',
  bgPattern: 'vignette',
  innerBorder: true,
  innerBorderStyle: 'double',
  innerBorderOffset: 14,
  cornerOrnaments: true,
  cornerOrnamentStyle: 'flourish',
  showSeal: true,
  sealType: 'ribbonGold',
  sealPosition: 'bottomRight',
  showQr: true,
  institutionName: { left: 6, top: 7, fontSize: 23, color: '#ffffff', text: 'GAUTAM BUDDHA UNIVERSITY', align: 'center', fontFamily: 'cinzel', visible: true },
  subtitle: { left: 6, top: 17, fontSize: 9.5, color: '#d4af37', text: 'THIS IS TO CERTIFY THAT', align: 'center', fontFamily: 'cinzel', visible: true },
  studentName: { left: 6, top: 27, fontSize: 30, color: '#ffffff', text: 'Varsha Sharma', align: 'center', fontFamily: 'playfair', visible: true },
  studentId: { left: 6, top: 39, fontSize: 9, color: '#94a3b8', text: 'Student ID: 21-ICS-054', align: 'center', fontFamily: 'mono', visible: false },
  department: { left: 6, top: 41, fontSize: 9.5, color: '#94a3b8', text: 'HAS BEEN CONFERRED THE DEGREE OF', align: 'center', fontFamily: 'sans', visible: true },
  degree: { left: 6, top: 49, fontSize: 21, color: '#fbbf24', text: 'Bachelor of Technology', align: 'center', fontFamily: 'cinzel', visible: true },
  course: { left: 6, top: 60, fontSize: 12.5, color: '#cbd5e1', text: 'in Computer Science & Engineering', align: 'center', fontFamily: 'sans', visible: true },
  grade: { left: 6, top: 68, fontSize: 10, color: '#34d399', text: 'First Class with Distinction (9.4 CGPA)', align: 'center', fontFamily: 'sans', visible: false },
  issueDate: { left: 8, top: 81, fontSize: 9.5, color: '#94a3b8', text: 'Date of Issue: August 30, 2026', align: 'left', fontFamily: 'sans', visible: true },
  certId: { left: 8, top: 87, fontSize: 8.5, color: '#64748b', text: 'Credential ID: BC-2026-9A8B7C', align: 'left', fontFamily: 'mono', visible: true },
  expiryDate: { left: 8, top: 74, fontSize: 9.5, color: '#64748b', text: 'Validity: Permanent (Lifetime)', align: 'left', fontFamily: 'sans', visible: false },
  signature1: { left: 58, top: 76, fontSize: 10.5, color: '#cbd5e1', text: 'Registrar / Vice Chancellor', align: 'right', fontFamily: 'sans', visible: false },
  signature2: { left: 32, top: 76, fontSize: 10.5, color: '#cbd5e1', text: 'Dean of Academic Affairs', align: 'center', fontFamily: 'sans', visible: false },
};

// Font resolver
const getFontFamilyCss = (font?: string) => {
  switch (font) {
    case 'cinzel':
      return "'Cinzel', serif";
    case 'playfair':
      return "'Playfair Display', serif";
    case 'script':
      return "'Great Vibes', cursive";
    case 'mono':
      return "'Courier New', Courier, monospace";
    case 'sans':
    default:
      return "'Montserrat', -apple-system, sans-serif";
  }
};

// Authentic Vector Ink Signature Calligraphy
const renderSignatureInkStroke = (color: string, isCentered: boolean, isRight: boolean, scale = 1) => (
  <div 
    className={`select-none pb-0.5 border-b mb-1 flex flex-col justify-center ${
      isCentered ? 'w-24 mx-auto items-center' : isRight ? 'w-28 ml-auto items-end' : 'w-28 items-start'
    }`} 
    style={{ borderColor: `${color}65` }}
  >
    <svg 
      viewBox="0 0 140 38" 
      className="h-4 sm:h-5 pointer-events-none opacity-90" 
      style={{ width: `${76 * scale}px` }}
      fill="none"
    >
      <path 
        d="M 12 26 C 22 10, 32 8, 40 22 C 48 32, 54 12, 64 16 C 74 20, 82 10, 94 24 M 36 22 Q 80 18 128 24" 
        stroke={color} 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  </div>
);

// Corner Ornament SVG Renderer
const renderCornerOrnament = (style: TemplateConfig['cornerOrnamentStyle'], color: string, rotationDeg: number) => {
  if (style === 'artDeco') {
    return (
      <svg 
        viewBox="0 0 40 40" 
        className="size-8 sm:size-9 pointer-events-none"
        style={{ transform: `rotate(${rotationDeg}deg)` }}
        stroke={color} 
        fill="none" 
        strokeWidth="1.5"
      >
        <path d="M 4 36 L 4 4 L 36 4 M 10 30 L 10 10 L 30 10 M 16 24 L 16 16 L 24 16" />
        <polygon points="4,4 10,4 4,10" fill={color} />
      </svg>
    );
  }
  if (style === 'techBrackets') {
    return (
      <svg 
        viewBox="0 0 40 40" 
        className="size-8 sm:size-9 pointer-events-none"
        style={{ transform: `rotate(${rotationDeg}deg)` }}
        stroke={color} 
        fill="none" 
        strokeWidth="2"
      >
        <path d="M 4 28 L 4 4 L 28 4" />
        <circle cx="4" cy="28" r="2.5" fill={color} />
        <circle cx="28" cy="4" r="2.5" fill={color} />
        <line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
        <line x1="8" y1="8" x2="8" y2="16" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
      </svg>
    );
  }
  if (style === 'royalSwirls') {
    return (
      <svg 
        viewBox="0 0 40 40" 
        className="size-8 sm:size-9 pointer-events-none"
        style={{ transform: `rotate(${rotationDeg}deg)` }}
        stroke={color} 
        fill="none" 
        strokeWidth="1.5"
      >
        <path d="M 4 36 C 4 16, 16 4, 36 4 M 8 28 C 8 16, 16 8, 28 8" />
        <circle cx="8" cy="8" r="2" fill={color} />
        <circle cx="28" cy="8" r="1.5" fill={color} />
        <circle cx="8" cy="28" r="1.5" fill={color} />
      </svg>
    );
  }
  // Default: Baroque Flourish
  return (
    <svg 
      viewBox="0 0 40 40" 
      className="size-8 sm:size-9 pointer-events-none"
      style={{ transform: `rotate(${rotationDeg}deg)` }}
      stroke={color} 
      fill="none" 
      strokeWidth="1.5"
    >
      <path d="M 4 36 L 4 12 C 4 6, 6 4, 12 4 L 36 4 M 8 28 L 8 14 C 8 10, 10 8, 14 8 L 28 8 M 4 4 L 10 10 M 16 16 L 22 22" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <circle cx="24" cy="4" r="1.5" fill={color} />
      <circle cx="4" cy="24" r="1.5" fill={color} />
    </svg>
  );
};

// Security Seal Renderer (Safely Padded Away from Borders and Ornaments)
const renderSecuritySeal = (config: TemplateConfig) => {
  const positionClass = 
    config.sealPosition === 'topLeft' 
      ? 'absolute top-7 left-8 sm:top-8 sm:left-9 z-20' 
      : config.sealPosition === 'bottomCenter' 
      ? 'absolute bottom-6 left-1/2 -translate-x-1/2 z-20' 
      : config.sealPosition === 'bottomLeft'
      ? 'absolute bottom-7 left-8 sm:bottom-8 sm:left-9 z-20'
      : config.sealPosition === 'topRight'
      ? 'absolute top-7 right-8 sm:top-8 sm:right-9 z-20'
      : 'absolute bottom-7 right-8 sm:bottom-8 sm:right-9 z-20'; // default: bottomRight

  if (config.sealType === 'blockchainCrest') {
    return (
      <div className={`${positionClass} pointer-events-none select-none`}>
        <div 
          className="size-13 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 relative z-10 shadow-2xl"
          style={{
            borderColor: config.borderColor,
            backgroundColor: `${config.bgColor}f5`,
            boxShadow: `0 0 22px ${config.borderColor}60, inset 0 0 12px ${config.borderColor}30`
          }}
        >
          <div className="border border-dashed rounded-full p-0.5 w-full h-full flex flex-col items-center justify-center" style={{ borderColor: `${config.borderColor}90` }}>
            <Sparkles className="size-3.5" style={{ color: config.borderColor }} />
            <span className="text-[6.5px] font-black uppercase tracking-tighter mt-0.5" style={{ color: config.borderColor }}>
              ON-CHAIN
            </span>
            <span className="text-[5px] font-mono uppercase text-foreground/90 font-bold">
              BLOCKCHAIN
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (config.sealType === 'starburst') {
    return (
      <div className={`${positionClass} pointer-events-none select-none`}>
        <div 
          className="size-13 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 relative z-10 shadow-2xl"
          style={{
            borderColor: config.borderColor,
            backgroundColor: `${config.borderColor}20`,
            boxShadow: `0 0 22px ${config.borderColor}60, inset 0 0 12px ${config.borderColor}40`
          }}
        >
          <Award className="size-4.5" style={{ color: config.borderColor }} />
          <span className="text-[7px] font-black uppercase tracking-tight mt-0.5" style={{ color: config.borderColor }}>
            AUTHENTIC
          </span>
          <span className="text-[5.5px] uppercase font-bold text-foreground/90">
            DECREE
          </span>
        </div>
      </div>
    );
  }

  if (config.sealType === 'waxSeal') {
    return (
      <div className={`${positionClass} pointer-events-none select-none`}>
        <div 
          className="size-13 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 relative z-10 shadow-2xl"
          style={{
            borderColor: '#b91c1c',
            backgroundColor: '#7f1d1d',
            boxShadow: '0 4px 22px rgba(185, 28, 28, 0.7), inset 0 2px 8px rgba(254, 202, 202, 0.4)'
          }}
        >
          <Stamp className="size-4.5 text-amber-200" />
          <span className="text-[6.5px] font-black uppercase tracking-wider text-amber-100 mt-0.5">
            OFFICIAL
          </span>
        </div>
      </div>
    );
  }

  if (config.sealType === 'cyberShield') {
    return (
      <div className={`${positionClass} pointer-events-none select-none`}>
        <div 
          className="size-12 sm:size-13 rounded-2xl border-2 flex flex-col items-center justify-center text-center p-1 relative z-10 shadow-2xl rotate-45"
          style={{
            borderColor: config.borderColor,
            backgroundColor: `${config.borderColor}20`,
            boxShadow: `0 0 22px ${config.borderColor}70`
          }}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center">
            <ShieldCheck className="size-4" style={{ color: config.borderColor }} />
            <span className="text-[6px] font-black uppercase tracking-tighter mt-0.5" style={{ color: config.borderColor }}>
              VERIFIED
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default: Royal Gold Ribbon Seal
  return (
    <div className={`${positionClass} pointer-events-none flex flex-col items-center justify-center select-none`}>
      <div className="absolute -bottom-2 flex gap-1 z-0">
        <div className="w-2 h-4 bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 rounded-b-sm transform -rotate-12 shadow-md border-r border-amber-400/40" />
        <div className="w-2 h-4 bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 rounded-b-sm transform rotate-12 shadow-md border-l border-amber-400/40" />
      </div>
      <div 
        className="size-13 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 relative z-10 shadow-2xl"
        style={{
          borderColor: config.borderColor,
          backgroundColor: `${config.bgColor}f8`,
          boxShadow: `0 0 22px ${config.borderColor}60, inset 0 0 12px ${config.borderColor}50`
        }}
      >
        <div className="border border-dashed rounded-full p-0.5 w-full h-full flex flex-col items-center justify-center" style={{ borderColor: `${config.borderColor}90` }}>
          <ShieldCheck className="size-4" style={{ color: config.borderColor }} />
          <span className="text-[6.5px] font-black uppercase tracking-tighter mt-0.5" style={{ color: config.borderColor }}>
            OFFICIAL
          </span>
          <span className="text-[5.5px] uppercase font-bold tracking-widest text-foreground/80 -mt-0.5">
            SEAL
          </span>
        </div>
      </div>
    </div>
  );
};

const PRESET_TEMPLATES: Record<string, { name: string; bg: string; border: string; accent: string; pattern: TemplateConfig['bgPattern']; font: ElementStyle['fontFamily'] }> = {
  royalIvy: { name: '👑 Royal Ivy League', bg: '#080e1e', border: '#d4af37', accent: '#fbbf24', pattern: 'vignette', font: 'cinzel' },
  oxfordClassic: { name: '🏛️ Oxford Classical', bg: '#0f172a', border: '#c5a059', accent: '#fef08a', pattern: 'guilloche', font: 'playfair' },
  emeraldPrestige: { name: '💎 Emerald Prestige', bg: '#03140e', border: '#10b981', accent: '#34d399', pattern: 'parchment', font: 'cinzel' },
  cambridgeCrimson: { name: '🍷 Cambridge Crimson', bg: '#18070a', border: '#f43f5e', accent: '#fb7185', pattern: 'vignette', font: 'playfair' },
  cyberQuantum: { name: '⚡ Cyber Quantum', bg: '#050a14', border: '#06b6d4', accent: '#38bdf8', pattern: 'cyberGrid', font: 'sans' },
  parchmentVintage: { name: '📜 Antique Parchment', bg: '#1c1917', border: '#d97706', accent: '#fde68a', pattern: 'parchment', font: 'playfair' },
};

type TemplateElementKey = 
  | 'institutionName' 
  | 'subtitle' 
  | 'studentName' 
  | 'studentId' 
  | 'degree' 
  | 'course' 
  | 'department' 
  | 'grade' 
  | 'certId' 
  | 'issueDate' 
  | 'expiryDate' 
  | 'signature1' 
  | 'signature2';

const elementMeta: Record<TemplateElementKey, { label: string; group: string }> = {
  institutionName: { label: 'University / Institution Name', group: 'Header' },
  subtitle: { label: 'Certificate Heading (e.g. THIS IS TO CERTIFY THAT)', group: 'Header' },
  studentName: { label: 'Student Full Name', group: 'Recipient' },
  studentId: { label: 'Student ID / Roll No', group: 'Recipient' },
  department: { label: 'Conferral Clause (e.g. HAS BEEN CONFERRED THE DEGREE OF)', group: 'Academic' },
  degree: { label: 'Degree Award (e.g. Bachelor of Technology)', group: 'Academic' },
  course: { label: 'Course / Major Field (e.g. in Computer Science)', group: 'Academic' },
  grade: { label: 'Grade / Honors / CGPA', group: 'Academic' },
  certId: { label: 'Certificate ID', group: 'Footer' },
  issueDate: { label: 'Issue Date', group: 'Footer' },
  expiryDate: { label: 'Expiry Date', group: 'Footer' },
  signature1: { label: 'Primary Signatory (Right)', group: 'Signatures' },
  signature2: { label: 'Secondary Signatory (Left/Center)', group: 'Signatures' },
};

const elementKeys = Object.keys(elementMeta) as TemplateElementKey[];

export function TemplateDesigner() {
  const [config, setConfig] = useState<TemplateConfig>(defaultTemplate);
  const [activeElement, setActiveElement] = useState<TemplateElementKey>('studentName');
  const [studioTab, setStudioTab] = useState<'content' | 'frame' | 'seal' | 'layers'>('content');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blockcertify-designer-template');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Seamlessly migrate outdated/scrambled legacy layout
        if (parsed.subtitle?.text?.includes('UPON THE RECOMMENDATION OF THE SENATE HAS CONFERRED') || !parsed.department?.text) {
          parsed.subtitle = defaultTemplate.subtitle;
          parsed.department = defaultTemplate.department;
          parsed.studentName = { ...parsed.studentName, top: defaultTemplate.studentName.top };
          parsed.degree = { ...parsed.degree, top: defaultTemplate.degree.top };
          parsed.course = { ...parsed.course, top: defaultTemplate.course.top };
          parsed.sealPosition = defaultTemplate.sealPosition;
          parsed.signature1 = { ...parsed.signature1, visible: false };
          parsed.signature2 = { ...parsed.signature2, visible: false };
        }
        if (parsed.signature1) parsed.signature1.visible = false;
        if (parsed.signature2) parsed.signature2.visible = false;
        if (!parsed.sealPosition || parsed.sealPosition === 'bottomLeft') {
          parsed.sealPosition = 'bottomRight';
        }
        if (parsed.showSeal === undefined) {
          parsed.showSeal = true;
        }
        if (!parsed.sealType) {
          parsed.sealType = 'ribbonGold';
        }
        setConfig({ ...defaultTemplate, ...parsed });
      } catch (err) {
        console.error('Failed to parse template layout:', err);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('blockcertify-designer-template', JSON.stringify(config));
    toast.success('Certificate template layout saved successfully!');
  };

  const handleReset = () => {
    setConfig(defaultTemplate);
    toast.success('Reset template to clean default layout');
  };

  const applyPreset = (key: keyof typeof PRESET_TEMPLATES) => {
    const preset = PRESET_TEMPLATES[key];
    setConfig((prev) => ({
      ...prev,
      bgColor: preset.bg,
      borderColor: preset.border,
      bgPattern: preset.pattern,
      degree: { ...prev.degree, color: preset.accent, fontFamily: preset.font },
      studentName: { ...prev.studentName, fontFamily: preset.font },
      institutionName: { ...prev.institutionName, fontFamily: preset.font },
    }));
    toast.success(`Applied ${preset.name} theme`);
  };

  const updateElement = (field: keyof ElementStyle, value: string | number | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [activeElement]: {
        ...prev[activeElement],
        [field]: value,
      },
    }));
  };

  const toggleVisibility = (key: TemplateElementKey) => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        visible: !prev[key].visible,
      },
    }));
    toast.success(`${elementMeta[key]?.label || key} ${!config[key].visible ? 'shown' : 'hidden'}`);
  };

  const handleDownloadTestPdf = async () => {
    if (!canvasRef.current) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 3, // 300+ DPI high resolution
        useCORS: true,
        logging: false,
        backgroundColor: config.bgColor,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-cert-canvas]') as HTMLElement;
          if (el) {
            el.style.boxShadow = 'none';
            el.style.transform = 'none';
            el.style.borderRadius = '0px';
            el.style.overflow = 'visible';

            // Clean up all interactive editor halos and buttons
            el.querySelectorAll('button').forEach((btn) => {
              btn.style.boxShadow = 'none';
              btn.style.outline = 'none';
              btn.style.border = 'none';
              btn.style.background = 'transparent';
              btn.style.overflow = 'visible';
              btn.style.lineHeight = '1.35';
            });

            el.querySelectorAll('*').forEach((node) => {
              const htmlNode = node as HTMLElement;
              htmlNode.style.overflow = 'visible';
            });
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 10;
      const pdfWidth = pageWidth - margin * 2;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const offsetY = pdfHeight < pageHeight ? (pageHeight - pdfHeight) / 2 : margin;

      pdf.addImage(imgData, 'PNG', margin, offsetY, pdfWidth, pdfHeight);
      pdf.save(`certificate_template_${Date.now()}.pdf`);
      toast.success('High-resolution test PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF preview.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `blockcertify_template_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Template JSON exported!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setConfig({ ...defaultTemplate, ...parsed });
        toast.success('Template imported successfully!');
      } catch (err) {
        toast.error('Invalid template JSON file');
      }
    };
    reader.readAsText(file);
    if (fileImportRef.current) fileImportRef.current.value = '';
  };

  return (
    <div className="space-y-3 max-w-[1550px] mx-auto pb-4">
      
      {/* Compact Top Studio Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-card/80 border border-border/15 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <Badge className="border border-accent/40 bg-accent/10 text-accent gap-1 text-[11px] py-0.5 font-bold">
            <Sparkles className="size-3" /> Pro Diploma Studio
          </Badge>
          <span className="text-[11px] font-semibold text-foreground/70 hidden sm:inline">
            A4 Print Landscape (16:9)
          </span>
        </div>

        {/* Quick Themes & Studio Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-border/15 pr-2">
            <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider hidden md:inline">Theme:</span>
            {Object.entries(PRESET_TEMPLATES).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="size-5 rounded-full border border-white/25 transition hover:scale-125 focus:outline-none shadow-sm"
                style={{ backgroundColor: p.bg, borderColor: p.border }}
                title={p.name}
              />
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-7 px-2.5 text-xs gap-1 rounded-lg border-border/20 text-foreground/70 hover:text-foreground hover:border-warning/40"
            title="Reset all settings to clean default layout"
          >
            <RefreshCw className="size-3 text-warning" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            className="h-7 px-3.5 text-xs gap-1.5 rounded-lg bg-accent text-accent-foreground font-bold shadow-glow hover:bg-accent/90"
          >
            <Save className="size-3" />
            Save Layout
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFullscreenModal(true)}
            className="h-7 px-2.5 text-xs gap-1 rounded-lg border-border/20 hover:border-accent/40 bg-card/60"
            title="Open Fullscreen Preview"
          >
            <Maximize2 className="size-3 text-accent" />
            Preview
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={exportingPdf}
            onClick={handleDownloadTestPdf}
            className="h-7 px-2.5 text-xs gap-1 rounded-lg border-border/20 hover:border-accent/40 bg-card/60"
          >
            <Download className="size-3 text-accent" />
            {exportingPdf ? 'Exporting...' : 'Test PDF'}
          </Button>
        </div>
      </div>

      {/* Main Studio Workspace (Left: Fixed-Size Diploma Easel | Right: Perfectly Adjusted Inspector) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
        
        {/* LEFT COLUMN: Fixed-Dimension Certificate Stage (Rock-Solid & Unshifting) */}
        <div className="w-full lg:w-[650px] shrink-0 space-y-2">
          
          <GlassCard className="flex flex-col overflow-hidden p-0 border-border/15 shadow-2xl bg-[#060a14] rounded-2xl">
            
            {/* Canvas Header Bar */}
            <div className="border-b border-white/10 bg-card/70 px-3.5 py-2.5 flex items-center justify-between gap-2 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-danger/80" />
                  <div className="size-2.5 rounded-full bg-warning/80" />
                  <div className="size-2.5 rounded-full bg-success/80" />
                </div>
                <span className="text-xs font-bold text-foreground/90 flex items-center gap-1.5 ml-1">
                  <LayoutTemplate className="size-3.5 text-accent" /> Live Interactive Diploma Canvas
                </span>
              </div>
              <Badge className="border border-accent/30 bg-accent/10 text-accent text-[11px] font-semibold py-0.5 px-2">
                Editing: <span className="font-bold text-foreground ml-1">{elementMeta[activeElement]?.label}</span>
              </Badge>
            </div>

            {/* Canvas Stage Viewport with Fixed Dimensions */}
            <div className="flex items-center justify-center p-3.5 sm:p-4 bg-[url('/grid.svg')] bg-center bg-repeat relative overflow-hidden" style={{ backgroundSize: '22px' }}>
              <div 
                ref={canvasRef}
                data-cert-canvas="true"
                className="relative w-[616px] h-[346px] max-w-full rounded-xl transition-all duration-300 shadow-2xl overflow-hidden select-none shrink-0"
                style={{
                  backgroundColor: config.bgColor,
                  border: config.borderStyle === 'double' 
                    ? `${config.borderWidth * 2}px double ${config.borderColor}` 
                    : config.borderStyle === 'dashed'
                    ? `${config.borderWidth}px dashed ${config.borderColor}`
                    : `${config.borderWidth}px solid ${config.borderColor}`,
                  boxShadow: config.borderStyle === 'gradient'
                    ? `0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 30px ${config.borderColor}50, inset 0 0 25px ${config.borderColor}15`
                    : `0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 35px ${config.borderColor}20`
                }}
              >
                {/* Dynamic Background Texture & Watermark */}
                {config.bgPattern === 'vignette' && (
                  <div 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ 
                      background: `radial-gradient(circle at 50% 45%, ${config.borderColor}14 0%, transparent 65%), radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.7) 100%)` 
                    }} 
                  />
                )}
                {config.bgPattern === 'guilloche' && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                      backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 8px, ${config.borderColor} 9px, transparent 10px)`
                    }}
                  />
                )}
                {config.bgPattern === 'cyberGrid' && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${config.borderColor} 1px, transparent 1px), linear-gradient(to bottom, ${config.borderColor} 1px, transparent 1px)`,
                      backgroundSize: '22px 22px'
                    }}
                  />
                )}
                {config.bgPattern === 'parchment' && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(ellipse at center, ${config.borderColor}30 0%, #000000 90%)`
                    }}
                  />
                )}

                {/* Dynamic Inner Border Line */}
                {config.innerBorder && (
                  <div 
                    className="absolute rounded-lg pointer-events-none transition-all duration-200"
                    style={{
                      inset: `${config.innerBorderOffset || 14}px`,
                      border: config.innerBorderStyle === 'dashed'
                        ? `1px dashed ${config.borderColor}55`
                        : config.innerBorderStyle === 'dotted'
                        ? `1.5px dotted ${config.borderColor}60`
                        : config.innerBorderStyle === 'double'
                        ? `2.5px double ${config.borderColor}45`
                        : `1px solid ${config.borderColor}35`,
                    }}
                  />
                )}

                {/* Dynamic Luxury Corner Ornaments */}
                {config.cornerOrnaments && (
                  <>
                    {/* Top Left */}
                    <div className="absolute top-3 left-3 pointer-events-none scale-90 origin-top-left">
                      {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 0)}
                    </div>
                    {/* Top Right */}
                    <div className="absolute top-3 right-3 pointer-events-none scale-90 origin-top-right">
                      {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 90)}
                    </div>
                    {/* Bottom Right */}
                    <div className="absolute bottom-3 right-3 pointer-events-none scale-90 origin-bottom-right">
                      {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 180)}
                    </div>
                    {/* Bottom Left */}
                    <div className="absolute bottom-3 left-3 pointer-events-none scale-90 origin-bottom-left">
                      {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 270)}
                    </div>
                  </>
                )}

                {/* Dynamic Security Seal */}
                {config.showSeal && renderSecuritySeal(config)}

                {/* Live Interactive Elements with Authentic Typography & Safe Bounds */}
                {elementKeys.map((key) => {
                  const el = config[key];
                  if (!el || !el.visible) return null;
                  const isActive = activeElement === key;

                  const isCentered = el.align === 'center';
                  const isRight = el.align === 'right';
                  const isSignatory = key === 'signature1' || key === 'signature2';
                  const isMajorHeading = key === 'institutionName' || key === 'studentName' || key === 'degree';

                  // Dynamic live style calculation scaled for fixed 616px canvas
                  const elementStyle: React.CSSProperties = {
                    position: 'absolute',
                    top: `${el.top}%`,
                    fontSize: `${Math.max(7.5, Math.round(el.fontSize * 0.84))}px`,
                    color: el.color,
                    fontFamily: getFontFamilyCss(el.fontFamily),
                    fontWeight: isMajorHeading ? 700 : 500,
                    lineHeight: 1.25,
                    zIndex: isActive ? 30 : 10,
                  };

                  if (isCentered) {
                    elementStyle.left = `${el.left || 6}%`;
                    elementStyle.width = `${100 - (el.left || 6) * 2}%`;
                    elementStyle.textAlign = 'center';
                  } else if (isRight) {
                    elementStyle.left = `${el.left || 58}%`;
                    elementStyle.width = `${Math.max(25, 94 - (el.left || 58))}%`;
                    elementStyle.textAlign = 'right';
                  } else {
                    elementStyle.left = `${el.left || 8}%`;
                    elementStyle.maxWidth = '45%';
                    elementStyle.textAlign = 'left';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveElement(key);
                        setStudioTab('content');
                      }}
                      style={elementStyle}
                      className={`px-1.5 py-0.5 rounded transition-all duration-150 outline-none select-none cursor-pointer ${
                        isActive 
                          ? 'ring-2 ring-blue-500 bg-blue-500/20 shadow-sm' 
                          : 'hover:ring-1 hover:ring-white/30'
                      }`}
                      title={`Click to customize ${elementMeta[key]?.label}`}
                    >
                      {isSignatory && renderSignatureInkStroke(config.borderColor, isCentered, isRight, 0.85)}
                      <span className={`block break-words whitespace-normal ${
                        key === 'subtitle' ? 'tracking-[0.2em] uppercase text-[8px]' : 
                        key === 'institutionName' ? 'tracking-[0.14em] uppercase font-bold' :
                        key === 'department' ? 'tracking-[0.14em] uppercase text-[7.5px] opacity-80' :
                        key === 'grade' ? 'tracking-wider font-semibold' : ''
                      }`}>
                        {el.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Helper Bar */}
            <div className="border-t border-white/10 bg-card/60 px-4 py-2 flex items-center justify-between text-xs text-foreground/60 backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles className="size-3 text-accent" /> Click any text element on the diploma canvas to edit in the studio panel.
              </span>
              <span className="text-[11px] font-mono text-foreground/40 hidden sm:inline">
                A4 Landscape 300+ DPI
              </span>
            </div>

          </GlassCard>

        </div>

        {/* RIGHT COLUMN: Streamlined Studio Inspector (Adjusted to Fit Beside Fixed Canvas) */}
        <div className="flex-1 w-full min-w-[340px] max-w-[540px]">
          
          <GlassCard className="p-3.5 border-border/15 bg-card/85 shadow-2xl rounded-2xl flex flex-col justify-between space-y-3">
            
            {/* Top Inspector Tabs */}
            <div className="flex p-1 bg-card/90 border border-border/15 rounded-xl gap-1 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setStudioTab('content')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                  studioTab === 'content' 
                    ? 'bg-accent text-accent-foreground shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Type className="size-3.5" /> Text & Font
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('frame')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                  studioTab === 'frame' 
                    ? 'bg-accent text-accent-foreground shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Palette className="size-3.5" /> Frame & BG
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('seal')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                  studioTab === 'seal' 
                    ? 'bg-accent text-accent-foreground shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Stamp className="size-3.5" /> Seals
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('layers')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                  studioTab === 'layers' 
                    ? 'bg-accent text-accent-foreground shadow-sm' 
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Layers className="size-3.5" /> Layers ({elementKeys.filter(k => config[k]?.visible).length})
              </button>
            </div>

            {/* Tab Body (Optimized Single-Panel Height, Zero Clutter) */}
            <div className="space-y-3">
              
              {/* TAB 1: ELEMENT TEXT, TYPOGRAPHY & POSITION */}
              {studioTab === 'content' && (
                <div className="space-y-2.5">
                  
                  {/* Field Selector & Visibility in 1 Clean Row */}
                  <div className="flex items-center gap-2">
                    <select
                      value={activeElement}
                      onChange={(e) => setActiveElement(e.target.value as TemplateElementKey)}
                      className="flex-1 bg-card/90 border border-border/20 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <optgroup label="Header & University">
                        <option value="institutionName">🏛️ University / Institution Name</option>
                        <option value="subtitle">📜 Certificate Heading (THIS IS TO CERTIFY THAT)</option>
                      </optgroup>
                      <optgroup label="Recipient Details">
                        <option value="studentName">👤 Student Full Name</option>
                        <option value="studentId">🆔 Student ID / Roll No</option>
                      </optgroup>
                      <optgroup label="Academic Award">
                        <option value="department">🎓 Conferral Clause (HAS BEEN CONFERRED THE DEGREE OF)</option>
                        <option value="degree">🏆 Degree Award (Bachelor of Technology)</option>
                        <option value="course">📚 Major / Course (in Computer Science)</option>
                        <option value="grade">⭐ Grade / Honors / CGPA</option>
                      </optgroup>
                      <optgroup label="Footer & Credentials">
                        <option value="issueDate">📅 Issue Date</option>
                        <option value="certId">🔒 Certificate ID</option>
                        <option value="expiryDate">⏳ Expiry Date / Validity</option>
                      </optgroup>
                    </select>

                    <button
                      type="button"
                      onClick={() => toggleVisibility(activeElement)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border shrink-0 ${
                        config[activeElement]?.visible 
                          ? 'bg-success/15 border-success/30 text-success' 
                          : 'bg-muted/40 border-border/20 text-foreground/50'
                      }`}
                      title="Toggle visibility of this field"
                    >
                      {config[activeElement]?.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      <span>{config[activeElement]?.visible ? 'Shown' : 'Hidden'}</span>
                    </button>
                  </div>

                  {/* Text Input */}
                  <div>
                    <Input
                      value={config[activeElement]?.text || ''}
                      onChange={(e) => updateElement('text', e.target.value)}
                      placeholder="Enter certificate text..."
                      className="bg-card/90 border-border/20 h-8 text-xs font-medium focus-visible:ring-accent"
                    />
                  </div>

                  {/* Font Family Pills */}
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'cinzel', label: 'Cinzel' },
                      { id: 'playfair', label: 'Playfair' },
                      { id: 'script', label: 'Script' },
                      { id: 'sans', label: 'Sans' },
                      { id: 'mono', label: 'Mono' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateElement('fontFamily', f.id)}
                        className={`py-1 px-1 rounded-lg text-[11px] border transition text-center truncate ${
                          config[activeElement]?.fontFamily === f.id
                            ? 'border-accent bg-accent/20 text-accent font-bold shadow-sm'
                            : 'border-border/15 bg-card/60 text-foreground/70 hover:bg-card'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Size, Color & Align in 1 Compact Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Font Size */}
                    <div className="flex items-center justify-between p-1 rounded-lg border border-border/15 bg-card/70">
                      <span className="text-[11px] font-semibold text-foreground/70 pl-1">Size:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateElement('fontSize', Math.max(8, (config[activeElement]?.fontSize || 12) - 2))}
                          className="size-5 rounded border border-border/15 bg-card text-foreground font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold text-accent min-w-[28px] text-center">
                          {config[activeElement]?.fontSize}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateElement('fontSize', Math.min(48, (config[activeElement]?.fontSize || 12) + 2))}
                          className="size-5 rounded border border-border/15 bg-card text-foreground font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center justify-between p-1 rounded-lg border border-border/15 bg-card/70">
                      <div className="flex items-center gap-1 pl-1">
                        {['#ffffff', '#fbbf24', '#60a5fa', '#34d399', '#cbd5e1'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateElement('color', c)}
                            className={`size-3.5 rounded-full border transition hover:scale-110 ${
                              config[activeElement]?.color === c ? 'border-white ring-1 ring-accent scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={config[activeElement]?.color || '#ffffff'}
                        onChange={(e) => updateElement('color', e.target.value)}
                        className="size-4.5 rounded border border-border/15 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Alignment & Position Steppers */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Align */}
                    <div className="flex gap-1 bg-card/70 border border-border/15 p-1 rounded-lg">
                      {[
                        { id: 'left', label: 'Left', icon: AlignLeft },
                        { id: 'center', label: 'Center', icon: AlignCenter },
                        { id: 'right', label: 'Right', icon: AlignRight },
                      ].map((a) => {
                        const Icon = a.icon;
                        const isSelected = config[activeElement]?.align === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              updateElement('align', a.id);
                              if (a.id === 'center') updateElement('left', 6);
                              if (a.id === 'left') updateElement('left', 8);
                              if (a.id === 'right') updateElement('left', 58);
                            }}
                            className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center transition ${
                              isSelected 
                                ? 'bg-accent text-accent-foreground shadow-sm font-bold' 
                                : 'text-foreground/60 hover:text-foreground'
                            }`}
                          >
                            <Icon className="size-3" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Position Nudges (Both Y and X) */}
                    <div className="flex items-center justify-between bg-card/70 border border-border/15 p-1 rounded-lg text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-foreground/50 font-bold uppercase pl-0.5">Y:{config[activeElement]?.top}%</span>
                        <button
                          type="button"
                          onClick={() => updateElement('top', Math.max(2, (config[activeElement]?.top || 0) - 2))}
                          className="size-5 rounded border border-border/15 bg-card hover:bg-card/80 text-[9px] font-bold"
                          title="Move Up"
                        >▲</button>
                        <button
                          type="button"
                          onClick={() => updateElement('top', Math.min(94, (config[activeElement]?.top || 0) + 2))}
                          className="size-5 rounded border border-border/15 bg-card hover:bg-card/80 text-[9px] font-bold"
                          title="Move Down"
                        >▼</button>
                      </div>

                      <div className="flex items-center gap-1 border-l border-border/15 pl-1.5 pr-0.5">
                        <span className="text-[10px] text-foreground/50 font-bold uppercase">X:{config[activeElement]?.left}%</span>
                        <button
                          type="button"
                          onClick={() => updateElement('left', Math.max(2, (config[activeElement]?.left || 0) - 2))}
                          className="size-5 rounded border border-border/15 bg-card hover:bg-card/80 text-[9px] font-bold"
                          title="Move Left"
                        >◄</button>
                        <button
                          type="button"
                          onClick={() => updateElement('left', Math.min(85, (config[activeElement]?.left || 0) + 2))}
                          className="size-5 rounded border border-border/15 bg-card hover:bg-card/80 text-[9px] font-bold"
                          title="Move Right"
                        >►</button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: FRAME & CANVAS STYLING */}
              {studioTab === 'frame' && (
                <div className="space-y-2.5">
                  
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl border border-border/15 bg-card/60 space-y-1">
                      <span className="text-[10px] text-foreground/70 font-semibold block">Canvas Background:</span>
                      <div className="flex gap-1.5 items-center bg-card/90 p-1 rounded-lg border border-border/15">
                        <input
                          type="color"
                          value={config.bgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="size-5 rounded border border-border/10 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={config.bgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="font-mono text-[11px] uppercase h-5 border-transparent bg-transparent shadow-none px-1"
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-xl border border-border/15 bg-card/60 space-y-1">
                      <span className="text-[10px] text-foreground/70 font-semibold block">Border Color:</span>
                      <div className="flex gap-1.5 items-center bg-card/90 p-1 rounded-lg border border-border/15">
                        <input
                          type="color"
                          value={config.borderColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, borderColor: e.target.value }))}
                          className="size-5 rounded border border-border/10 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={config.borderColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, borderColor: e.target.value }))}
                          className="font-mono text-[11px] uppercase h-5 border-transparent bg-transparent shadow-none px-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Border Width & Style */}
                  <div className="p-2 rounded-xl border border-border/15 bg-card/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Frame Style</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, borderWidth: Math.max(1, prev.borderWidth - 1) }))}
                          className="size-5 rounded border border-border/15 bg-card text-foreground font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold text-accent min-w-[24px] text-center">
                          {config.borderWidth}px
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, borderWidth: Math.min(8, prev.borderWidth + 1) }))}
                          className="size-5 rounded border border-border/15 bg-card text-foreground font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'solid', label: 'Solid' },
                        { id: 'double', label: 'Double' },
                        { id: 'gradient', label: 'Glow' },
                        { id: 'dashed', label: 'Dashed' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, borderStyle: st.id as any }))}
                          className={`py-1 px-1 rounded-md text-[11px] font-semibold border transition text-center ${
                            config.borderStyle === st.id 
                              ? 'border-accent bg-accent/20 text-accent shadow-sm font-bold' 
                              : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security Texture */}
                  <div className="p-2 rounded-xl border border-border/15 bg-card/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block">Security Texture</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { id: 'solid', label: 'Clean' },
                        { id: 'vignette', label: 'Vignette' },
                        { id: 'guilloche', label: 'Guilloché' },
                        { id: 'cyberGrid', label: 'Matrix' },
                        { id: 'parchment', label: 'Parchment' },
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, bgPattern: pat.id as any }))}
                          className={`py-1 px-1 rounded-md text-[10.5px] font-semibold border transition text-center truncate ${
                            config.bgPattern === pat.id 
                              ? 'border-accent bg-accent/20 text-accent shadow-sm font-bold' 
                              : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inner Frame */}
                  <div className="p-2.5 rounded-xl border border-border/15 bg-card/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/70">Inner Framing Line:</span>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, innerBorder: !prev.innerBorder }))}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                          config.innerBorder ? 'bg-success/15 border-success/30 text-success' : 'bg-muted/40 border-border/20 text-foreground/50'
                        }`}
                      >
                        {config.innerBorder ? '✓ Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {config.innerBorder && (
                      <div className="space-y-1.5 pt-1 border-t border-border/10">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/70">
                          <span>Inset Offset: {config.innerBorderOffset || 14}px</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, innerBorderOffset: Math.max(8, (prev.innerBorderOffset || 14) - 2) }))}
                              className="size-5 rounded border border-border/15 bg-card text-xs font-bold"
                            >-</button>
                            <button
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, innerBorderOffset: Math.min(28, (prev.innerBorderOffset || 14) + 2) }))}
                              className="size-5 rounded border border-border/15 bg-card text-xs font-bold"
                            >+</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'double', label: 'Double' },
                            { id: 'solid', label: 'Solid' },
                            { id: 'dashed', label: 'Dashed' },
                            { id: 'dotted', label: 'Dotted' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, innerBorderStyle: st.id as any }))}
                              className={`py-0.5 px-1 rounded-md text-[10.5px] font-semibold border transition text-center ${
                                config.innerBorderStyle === st.id
                                  ? 'border-accent bg-accent/20 text-accent font-bold shadow-sm'
                                  : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: SEALS & ORNAMENTS */}
              {studioTab === 'seal' && (
                <div className="space-y-2.5">
                  
                  {/* Corner Ornaments */}
                  <div className="p-2.5 rounded-xl border border-border/15 bg-card/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Corner Ornaments</span>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, cornerOrnaments: !prev.cornerOrnaments }))}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                          config.cornerOrnaments ? 'bg-success/15 border-success/30 text-success' : 'bg-muted/40 border-border/20 text-foreground/50'
                        }`}
                      >
                        {config.cornerOrnaments ? '✓ Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {config.cornerOrnaments && (
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        {[
                          { id: 'flourish', label: 'Baroque' },
                          { id: 'artDeco', label: 'Art Deco' },
                          { id: 'techBrackets', label: 'Tech' },
                          { id: 'royalSwirls', label: 'Victorian' },
                        ].map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, cornerOrnamentStyle: o.id as any }))}
                            className={`py-1 px-1 rounded-md text-[11px] font-semibold border transition text-center truncate ${
                              config.cornerOrnamentStyle === o.id 
                                ? 'border-accent bg-accent/20 text-accent shadow-sm font-bold' 
                                : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Official Security Seal */}
                  <div className="p-2.5 rounded-xl border border-border/15 bg-card/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Security Seal</span>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, showSeal: !prev.showSeal }))}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                          config.showSeal ? 'bg-success/15 border-success/30 text-success' : 'bg-muted/40 border-border/20 text-foreground/50'
                        }`}
                      >
                        {config.showSeal ? '✓ Shown' : 'Hidden'}
                      </button>
                    </div>

                    {config.showSeal && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-5 gap-1">
                          {[
                            { id: 'ribbonGold', label: 'Ribbon' },
                            { id: 'blockchainCrest', label: 'Crypto' },
                            { id: 'starburst', label: 'Award' },
                            { id: 'waxSeal', label: 'Wax' },
                            { id: 'cyberShield', label: 'Shield' },
                          ].map((seal) => (
                            <button
                              key={seal.id}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, sealType: seal.id as any }))}
                              className={`py-1 px-1 rounded-md text-[10.5px] font-semibold border transition text-center truncate ${
                                config.sealType === seal.id 
                                  ? 'border-accent bg-accent/20 text-accent shadow-sm font-bold' 
                                  : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                              }`}
                            >
                              {seal.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/10">
                          <span className="text-[11px] text-foreground/70 font-semibold">Position:</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {[
                              { id: 'bottomRight', label: 'Bottom Right' },
                              { id: 'bottomCenter', label: 'Bottom Center' },
                              { id: 'bottomLeft', label: 'Bottom Left' },
                              { id: 'topRight', label: 'Top Right' },
                              { id: 'topLeft', label: 'Top Left' },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => setConfig((prev) => ({ ...prev, sealPosition: pos.id as any }))}
                                className={`py-0.5 px-1.5 rounded-md text-[10px] font-semibold border transition text-center ${
                                  config.sealPosition === pos.id 
                                    ? 'border-accent bg-accent/20 text-accent shadow-sm font-bold' 
                                    : 'border-border/15 bg-card/60 text-foreground/60 hover:bg-card'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: FIELD LAYERS CHECKLIST */}
              {studioTab === 'layers' && (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {elementKeys.map((k) => {
                    const isVis = config[k]?.visible;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleVisibility(k)}
                        className={`w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg border transition text-left ${
                          isVis ? 'border-accent/30 bg-accent/10 text-foreground' : 'border-border/10 bg-card/30 text-foreground/40'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">{elementMeta[k]?.label}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isVis ? 'border-success/30 bg-success/15 text-success' : 'border-border/15 bg-foreground/[0.02] text-foreground/30'
                        }`}>
                          {isVis ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Integrated Backup / Export JSON Footer in Same Card */}
            <div className="pt-2 border-t border-border/15 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-foreground/60">Backup Layout:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileImportRef}
                  onChange={handleImportJson}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileImportRef.current?.click()}
                  className="h-6 px-2 text-[10.5px] gap-1 rounded-md border-border/20"
                >
                  <Upload className="size-3" /> Import
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJson}
                  className="h-6 px-2 text-[10.5px] gap-1 rounded-md border-border/20"
                >
                  <FileCode2 className="size-3 text-accent" /> Export
                </Button>
              </div>
            </div>

          </GlassCard>

        </div>

      </div>

      {/* Fullscreen HD Preview Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-card border border-border/20 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/15 pb-3">
              <div className="flex items-center gap-2">
                <Badge className="border border-accent/40 bg-accent/10 text-accent gap-1 text-xs py-0.5 font-bold">
                  <Sparkles className="size-3" /> Full-Resolution A4 Diploma Preview
                </Badge>
                <span className="text-xs text-foreground/60 hidden sm:inline">300+ DPI Print & Blockchain Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadTestPdf}
                  disabled={exportingPdf}
                  className="h-8 px-3 text-xs gap-1.5 rounded-lg bg-accent text-accent-foreground font-bold"
                >
                  <Download className="size-3.5" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFullscreenModal(false)}
                  className="size-8 p-0 rounded-lg text-foreground/70 hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Scaled High-Resolution Preview Canvas */}
            <div className="flex items-center justify-center p-3 sm:p-6 bg-[url('/grid.svg')] rounded-xl overflow-hidden">
              <div 
                className="relative w-full max-w-[780px] aspect-[16/9] rounded-xl shadow-2xl overflow-hidden select-none"
                style={{
                  backgroundColor: config.bgColor,
                  border: config.borderStyle === 'double' 
                    ? `${config.borderWidth * 2}px double ${config.borderColor}` 
                    : config.borderStyle === 'dashed'
                    ? `${config.borderWidth}px dashed ${config.borderColor}`
                    : `${config.borderWidth}px solid ${config.borderColor}`,
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px ${config.borderColor}30`
                }}
              >
                {/* Background & Patterns */}
                {config.bgPattern === 'vignette' && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 45%, ${config.borderColor}14 0%, transparent 65%), radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.7) 100%)` }} />
                )}
                {config.bgPattern === 'guilloche' && (
                  <div className="absolute inset-0 pointer-events-none opacity-15" style={{ backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 8px, ${config.borderColor} 9px, transparent 10px)` }} />
                )}
                {config.bgPattern === 'cyberGrid' && (
                  <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `linear-gradient(to right, ${config.borderColor} 1px, transparent 1px), linear-gradient(to bottom, ${config.borderColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
                )}
                {config.bgPattern === 'parchment' && (
                  <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `radial-gradient(ellipse at center, ${config.borderColor}30 0%, #000000 90%)` }} />
                )}
                {config.innerBorder && (
                  <div 
                    className="absolute rounded-lg pointer-events-none"
                    style={{
                      inset: `${config.innerBorderOffset || 14}px`,
                      border: config.innerBorderStyle === 'dashed'
                        ? `1px dashed ${config.borderColor}55`
                        : config.innerBorderStyle === 'dotted'
                        ? `1.5px dotted ${config.borderColor}60`
                        : config.innerBorderStyle === 'double'
                        ? `2.5px double ${config.borderColor}45`
                        : `1px solid ${config.borderColor}35`,
                    }}
                  />
                )}
                {config.cornerOrnaments && (
                  <>
                    <div className="absolute top-3 left-3 pointer-events-none scale-100 origin-top-left">{renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 0)}</div>
                    <div className="absolute top-3 right-3 pointer-events-none scale-100 origin-top-right">{renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 90)}</div>
                    <div className="absolute bottom-3 right-3 pointer-events-none scale-100 origin-bottom-right">{renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 180)}</div>
                    <div className="absolute bottom-3 left-3 pointer-events-none scale-100 origin-bottom-left">{renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 270)}</div>
                  </>
                )}
                {config.showSeal && renderSecuritySeal(config)}

                {elementKeys.map((key) => {
                  const el = config[key];
                  if (!el || !el.visible) return null;
                  const isCentered = el.align === 'center';
                  const isRight = el.align === 'right';
                  const isSignatory = key === 'signature1' || key === 'signature2';
                  const isMajorHeading = key === 'institutionName' || key === 'studentName' || key === 'degree';

                  const elementStyle: React.CSSProperties = {
                    position: 'absolute',
                    top: `${el.top}%`,
                    fontSize: `${Math.max(9, Math.round(el.fontSize * 1.08))}px`,
                    color: el.color,
                    fontFamily: getFontFamilyCss(el.fontFamily),
                    fontWeight: isMajorHeading ? 700 : 500,
                    lineHeight: 1.25,
                  };

                  if (isCentered) {
                    elementStyle.left = `${el.left || 6}%`;
                    elementStyle.width = `${100 - (el.left || 6) * 2}%`;
                    elementStyle.textAlign = 'center';
                  } else if (isRight) {
                    elementStyle.left = `${el.left || 58}%`;
                    elementStyle.width = `${Math.max(25, 94 - (el.left || 58))}%`;
                    elementStyle.textAlign = 'right';
                  } else {
                    elementStyle.left = `${el.left || 8}%`;
                    elementStyle.maxWidth = '45%';
                    elementStyle.textAlign = 'left';
                  }

                  return (
                    <div key={key} style={elementStyle}>
                      {isSignatory && renderSignatureInkStroke(config.borderColor, isCentered, isRight, 1.2)}
                      <span className={`block break-words whitespace-normal ${key === 'subtitle' ? 'tracking-[0.2em] uppercase text-[10px]' : key === 'institutionName' ? 'tracking-[0.14em] uppercase font-bold' : key === 'department' ? 'tracking-[0.14em] uppercase text-[9px] opacity-80' : ''}`}>
                        {el.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
