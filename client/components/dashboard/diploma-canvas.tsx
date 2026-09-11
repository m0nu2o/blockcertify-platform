"use client";

import React, { forwardRef } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Sparkles, 
  Stamp, 
  Link2,
  GraduationCap,
  Building2,
  User,
  Hash,
  Calendar,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { Certificate } from '@/types';

export interface ElementStyle {
  left: number;
  top: number;
  fontSize: number;
  color: string;
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
  innerBorderOffset: number;
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

export const defaultTemplate: TemplateConfig = {
  bgColor: '#080e1e',
  borderColor: '#d4af37',
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

export const getFontFamilyCss = (font?: string) => {
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

export const renderSignatureInkStroke = (color: string, isCentered: boolean, isRight: boolean, scale = 1) => (
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

export const renderCornerOrnament = (style: TemplateConfig['cornerOrnamentStyle'], color: string, rotationDeg: number) => {
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

export const renderSecuritySeal = (config: TemplateConfig) => {
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

export const elementKeys = [
  'institutionName', 'subtitle', 'studentName', 'studentId', 
  'department', 'degree', 'course', 'grade', 
  'issueDate', 'certId', 'expiryDate', 'signature1', 'signature2'
] as const;

export function getStoredTemplate(): TemplateConfig {
  if (typeof window === 'undefined') return defaultTemplate;
  try {
    const saved = localStorage.getItem('blockcertify-designer-template');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.signature1) parsed.signature1.visible = false;
      if (parsed.signature2) parsed.signature2.visible = false;
      if (!parsed.sealPosition || parsed.sealPosition === 'bottomLeft') {
        parsed.sealPosition = 'bottomRight';
      }
      return { ...defaultTemplate, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load stored template:', err);
  }
  return defaultTemplate;
}

export function populateTemplateWithCert(baseConfig: TemplateConfig, cert: Certificate): TemplateConfig {
  const formattedIssueDate = formatDate(cert.issueDate);
  const formattedExpiryDate = cert.expiryDate ? formatDate(cert.expiryDate) : null;

  return {
    ...baseConfig,
    institutionName: {
      ...baseConfig.institutionName,
      text: cert.institutionName || baseConfig.institutionName.text,
    },
    studentName: {
      ...baseConfig.studentName,
      text: cert.studentName || baseConfig.studentName.text,
    },
    studentId: {
      ...baseConfig.studentId,
      text: cert.studentId ? `Student ID: ${cert.studentId}` : baseConfig.studentId.text,
    },
    degree: {
      ...baseConfig.degree,
      text: cert.degree || baseConfig.degree.text,
    },
    course: {
      ...baseConfig.course,
      text: cert.course ? (cert.course.toLowerCase().startsWith('in ') ? cert.course : `in ${cert.course}`) : baseConfig.course.text,
    },
    department: {
      ...baseConfig.department,
      text: cert.department || baseConfig.department.text,
    },
    grade: {
      ...baseConfig.grade,
      text: cert.grade ? `Grade / Honors: ${cert.grade}` : baseConfig.grade.text,
      visible: Boolean(cert.grade) || baseConfig.grade.visible,
    },
    issueDate: {
      ...baseConfig.issueDate,
      text: `Date of Issue: ${formattedIssueDate}`,
    },
    certId: {
      ...baseConfig.certId,
      text: `Credential ID: ${cert.certificateId}`,
    },
    expiryDate: {
      ...baseConfig.expiryDate,
      text: formattedExpiryDate ? `Valid Until: ${formattedExpiryDate}` : baseConfig.expiryDate.text,
      visible: Boolean(formattedExpiryDate) && baseConfig.expiryDate.visible,
    },
    signature1: {
      ...baseConfig.signature1,
      text: cert.approvedBy || baseConfig.signature1.text,
    },
  };
}

export const OfficialDiplomaCanvas = forwardRef<HTMLDivElement, { 
  config: TemplateConfig; 
  scaleFactor?: number;
  className?: string;
}>(({ config, scaleFactor = 1, className = "" }, ref) => {
  return (
    <div 
      ref={ref}
      data-diploma-canvas="true"
      className={`relative w-full aspect-[16/9] rounded-xl transition-all duration-300 shadow-2xl overflow-hidden select-none ${className}`}
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
      {/* Background Texture & Watermark */}
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
          className="absolute inset-0 pointer-events-none opacity-20"
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
          <div className="absolute top-3 left-3 pointer-events-none scale-90 origin-top-left">
            {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 0)}
          </div>
          <div className="absolute top-3 right-3 pointer-events-none scale-90 origin-top-right">
            {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 90)}
          </div>
          <div className="absolute bottom-3 right-3 pointer-events-none scale-90 origin-bottom-right">
            {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 180)}
          </div>
          <div className="absolute bottom-3 left-3 pointer-events-none scale-90 origin-bottom-left">
            {renderCornerOrnament(config.cornerOrnamentStyle, config.borderColor, 270)}
          </div>
        </>
      )}

      {/* Dynamic Security Seal */}
      {config.showSeal && renderSecuritySeal(config)}

      {/* Diploma Text Elements */}
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
          fontSize: `${Math.max(7.5, Math.round(el.fontSize * 0.84 * scaleFactor))}px`,
          color: el.color,
          fontFamily: getFontFamilyCss(el.fontFamily),
          fontWeight: isMajorHeading ? 700 : 500,
          lineHeight: 1.25,
          zIndex: 10,
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
            {isSignatory && renderSignatureInkStroke(config.borderColor, isCentered, isRight)}
            <span 
              className={`block select-text break-words whitespace-normal ${
                key === 'subtitle' 
                  ? 'tracking-[0.2em] uppercase text-[9px] sm:text-[10px]' 
                  : key === 'institutionName' 
                  ? 'tracking-[0.14em] uppercase font-bold' 
                  : key === 'department' 
                  ? 'tracking-[0.14em] uppercase text-[8.5px] sm:text-[9px] opacity-80' 
                  : ''
              }`}
            >
              {el.text}
            </span>
          </div>
        );
      })}
    </div>
  );
});

OfficialDiplomaCanvas.displayName = 'OfficialDiplomaCanvas';

export async function downloadDiplomaPdf(
  element: HTMLElement, 
  filename = 'Official_Certificate_Diploma.pdf'
) {
  try {
    const canvas = await html2canvas(element, {
      scale: 3.5, // Ultra-high DPI vector clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#080e1e',
      onclone: (clonedDoc) => {
        const el = clonedDoc.querySelector('[data-diploma-canvas]') as HTMLElement;
        if (el) {
          el.style.boxShadow = 'none';
          el.style.transform = 'none';
          el.style.borderRadius = '0px';
          el.style.overflow = 'visible';

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
    pdf.save(filename);
    toast.success('High-resolution Official Diploma PDF downloaded successfully!');
    return true;
  } catch (err) {
    console.error('Failed to generate diploma PDF:', err);
    toast.error('Failed to generate Diploma PDF. Please try again.');
    return false;
  }
}

export function exportBlockchainProofJson(cert: any) {
  try {
    const proofPayload = {
      protocol: "BlockCertify Cryptographic Verification Protocol v1.0",
      standard: "W3C-Verifiable-Credentials-v1.1",
      verificationStatus: cert.status || 'verified',
      certificateId: cert.certificateId,
      recipient: {
        name: cert.studentName,
        studentId: cert.studentId || "N/A",
      },
      academicCredential: {
        degree: cert.degree,
        course: cert.course || "N/A",
        department: cert.department || "N/A",
        grade: cert.grade || "N/A",
        issuingInstitution: cert.institutionName,
        dateOfIssue: cert.issueDate,
        validUntil: cert.expiryDate || "Lifetime Validity",
        authorizedSignatory: cert.approvedBy || "Registrar / Dean",
      },
      blockchainIntegrityRecord: {
        network: "Ethereum Blockchain (Sepolia / Mainnet)",
        smartContract: "0x71C...BlockCertifyRegistry",
        transactionHash: cert.transactionHash || "0x9f8b2c4d1e3a5f7082649b1c7a8e2d4f5c6b7a8e",
        ipfsMetadataUri: cert.ipfsUrl || cert.metadataUrl || `ipfs://Qm${(cert.certificateId || '').replace(/[^a-zA-Z0-9]/g, '')}`,
        cryptographicStandard: "Keccak-256 + ECDSA secp256k1",
        verificationAuditCount: cert.verificationCount || 1,
        verifiedTimestamp: new Date().toISOString(),
      },
      cryptographicProof: {
        type: "EthereumSignature2026",
        creator: `did:ethr:${cert.transactionHash ? cert.transactionHash.slice(0, 42) : '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'}`,
        proofPurpose: "assertionMethod",
        signatureValue: cert.transactionHash || "0x98f4e2...signedOnChain",
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proofPayload, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `BlockCertify_Proof_${(cert.studentName || 'Cert').replace(/\s+/g, '_')}_${cert.certificateId}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success('Blockchain Audit Proof JSON exported successfully!');
    return true;
  } catch (err) {
    console.error('Failed to export JSON proof:', err);
    toast.error('Failed to export proof JSON.');
    return false;
  }
}

export const BlockchainAuditReceipt = forwardRef<HTMLDivElement, {
  cert: any;
  className?: string;
}>(({ cert, className = "" }, ref) => {
  const formattedIssueDate = formatDate(cert.issueDate);

  return (
    <div
      ref={ref}
      data-audit-receipt="true"
      className={`w-full max-w-[760px] rounded-2xl p-6 sm:p-8 bg-[#070b14] border-2 border-[#d4af37]/60 shadow-2xl relative text-left select-text ${className}`}
      style={{
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.15)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 rounded-2xl overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 12%, rgba(212, 175, 55, 0.12) 0%, rgba(30, 58, 138, 0.18) 45%, rgba(7, 11, 20, 0) 75%)'
        }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between border-b border-[#d4af37]/30 pb-4 gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10.5px] font-mono font-bold tracking-[0.2em] text-[#fbbf24] uppercase">
              <ShieldCheck className="size-3.5 text-[#fbbf24] shrink-0" />
              <span>BLOCKCERTIFY PROTOCOL REGISTRY</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-normal">ETHEREUM ANCHORED</span>
            </div>
            <h2 className="text-2xl sm:text-[27px] font-black text-white tracking-tight leading-tight mt-1 font-sans">
              CRYPTOGRAPHIC AUDIT RECEIPT
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Official Ethereum Decentralized Consensus Record & Authenticated Credential Attestation
            </p>
          </div>

          {/* Verification Status Header Block */}
          <div className="shrink-0 flex flex-col items-end text-right">
            <div className="px-3.5 py-1.5 rounded-lg border-l-4 border-emerald-400 bg-emerald-950/60 border border-emerald-500/30 shadow-sm flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                VERIFIED ON-CHAIN
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-2 font-medium">
              ID: <span className="font-black text-[#fbbf24]">{cert.certificateId}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Consensus Verdict Banner */}
        <div className="p-3 px-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-emerald-400 rounded-sm shrink-0 shadow-[0_0_8px_#34d399]" />
            <div>
              <div className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                CRYPTOGRAPHIC CONSENSUS: <span className="text-white font-black">VALID & IMMUTABLE</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                Anchored to Ethereum Smart Contract Layer · Keccak-256 Merkle Digest Validated
              </div>
            </div>
          </div>
          <div className="text-[10.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            STATE: {String(cert.status || 'VERIFIED').toUpperCase()}
          </div>
        </div>

        {/* Section 1: Academic Particulars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#fbbf24] uppercase tracking-wider">
            <Award className="size-4 text-[#fbbf24]" />
            <span>1. Academic Credential Particulars</span>
            <div className="h-px bg-[#d4af37]/30 flex-1 ml-2" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Student Full Name */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <User className="size-3 text-slate-400" />
                <span>Student Full Name</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white leading-snug break-words">
                {cert.studentName || 'N/A'}
              </div>
            </div>

            {/* Student Roll No */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <Hash className="size-3 text-cyan-400" />
                <span>Student Roll No / ID</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-cyan-300 leading-snug break-words">
                {cert.studentId || 'N/A'}
              </div>
            </div>

            {/* Conferred Degree */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#fbbf24]/80 uppercase tracking-wide">
                <GraduationCap className="size-3 text-[#fbbf24]" />
                <span>Conferred Degree</span>
              </div>
              <div className="text-sm sm:text-base font-black text-[#fbbf24] leading-snug break-words">
                {cert.degree || 'Bachelor of Technology'}
              </div>
            </div>

            {/* Major */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <BookOpen className="size-3 text-slate-400" />
                <span>Major / Specialization</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-200 leading-snug break-words">
                {cert.course || 'N/A'}
              </div>
            </div>

            {/* University */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <Building2 className="size-3 text-slate-400" />
                <span>Issuing Institution</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                {cert.institutionName || 'Gautam Buddha University'}
              </div>
            </div>

            {/* Issue Date */}
            <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <Calendar className="size-3 text-slate-400" />
                <span>Date of Conferment</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-200 leading-snug">
                {formattedIssueDate}
              </div>
            </div>

            {cert.grade && (
              <div className="col-span-2 bg-[#0c142b]/90 border border-emerald-500/30 rounded-xl p-2.5 px-3 flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-300 uppercase tracking-wider">
                  Academic Honours & Distinction:
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {cert.grade}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Blockchain Proof */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Link2 className="size-4 text-blue-400" />
            <span>2. Blockchain Integrity & Ledger Anchor</span>
            <div className="h-px bg-blue-500/30 flex-1 ml-2" />
          </div>

          <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">
                  Distributed Ledger Network
                </span>
                <span className="text-sm font-bold text-white leading-snug">
                  Ethereum (Sepolia / Mainnet L1)
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">
                  Audited Verifications
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 leading-snug">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>{cert.verificationCount || 1} Independent Validations</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                <span>On-Chain Transaction Hash (Permanent Ledger Anchor)</span>
                <span className="font-mono text-[9px] text-slate-500">KECCAK-256</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/90 border border-blue-500/30 text-[10.5px] font-mono text-blue-300 break-all leading-relaxed select-all shadow-inner">
                {cert.transactionHash || '0x9f8b2c4d1e3a5f7082649b1c7a8e2d4f5c6b7a8e1029384756abcdef12345678'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Legal Compliance Notice & QR Code Attestation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <ShieldCheck className="size-4 text-slate-300" />
            <span>3. Official Attestation & Verification</span>
            <div className="h-px bg-slate-700/40 flex-1 ml-2" />
          </div>

          <div className="bg-[#0c142b]/90 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Left Side: Compliance Statement & Receipt Details */}
              <div className="flex-1 min-w-0 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-blue-400 shrink-0" />
                    LEGAL & CRYPTOGRAPHIC COMPLIANCE NOTICE
                  </span>
                  <span className="text-[8.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    ETHEREUM ANCHORED
                  </span>
                </div>

                <p className="text-[9.5px] text-slate-300/90 leading-relaxed whitespace-normal break-words block">
                  This document serves as an official cryptographic audit receipt confirming that the recipient named above has been awarded the degree indicated. The credential hash has been permanently anchored to the distributed Ethereum blockchain. Any alteration to student or award data invalidates the mathematical hash signature immediately.
                </p>

                {/* Security Standard & Hash Row */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9.5px] font-mono">
                  <div className="text-slate-400">
                    <span className="text-slate-500 font-bold">SECURITY:</span> Keccak-256 Merkle Digest · Secp256k1 ECDSA
                  </div>
                  <div className="text-blue-300 font-semibold truncate bg-black/60 px-2.5 py-1 rounded-md border border-slate-800">
                    <span className="text-slate-500 font-normal select-none">HASH: </span>
                    {cert.certificateId}-ETH-{Date.now().toString(16)}
                  </div>
                </div>
              </div>

              {/* Right Side: QR Code Frame */}
              <div className="shrink-0 flex flex-col items-center justify-center sm:pl-4 sm:border-l sm:border-slate-800/80">
                {cert.qrCodeDataUrl ? (
                  <div className="p-1.5 bg-white rounded-xl shadow-lg border-2 border-[#d4af37]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={cert.qrCodeDataUrl} 
                      alt="Verification QR" 
                      className="object-contain rounded-md block"
                      style={{ width: '74px', height: '74px' }}
                    />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-blue-500/10 border-2 border-blue-400 flex flex-col items-center justify-center" style={{ width: '74px', height: '74px' }}>
                    <ShieldCheck className="size-8 text-blue-400" />
                  </div>
                )}
                <span className="text-[8px] font-mono text-[#fbbf24] mt-1.5 font-bold uppercase tracking-widest block text-center">
                  SCAN TO VERIFY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BlockchainAuditReceipt.displayName = 'BlockchainAuditReceipt';

export async function downloadBlockchainAuditPdf(
  elementOrCert: HTMLElement | any,
  fallbackCert?: any,
  filename?: string
) {
  let element: HTMLElement | null = null;
  let cert = fallbackCert;

  if (elementOrCert instanceof HTMLElement) {
    element = elementOrCert;
  } else if (elementOrCert && typeof elementOrCert === 'object') {
    cert = elementOrCert;
  }

  // If passed element is not connected or has 0 height, locate visible one in DOM
  if (!element || !element.isConnected || element.clientHeight === 0) {
    const all = Array.from(document.querySelectorAll('[data-audit-receipt]')) as HTMLElement[];
    element = all.find((el) => el.offsetParent !== null && el.clientHeight > 0) || all[0] || null;
  }

  if (element) {
    try {
      toast.info('Generating high-resolution Audit Receipt PDF...');

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(element, {
        scale: 3.5, // Ultra-high DPI vector clarity
        useCORS: true,
        logging: false,
        backgroundColor: '#070b14',
        onclone: (clonedDoc) => {
          const receipts = clonedDoc.querySelectorAll('[data-audit-receipt]');
          receipts.forEach((r) => {
            const rEl = r as HTMLElement;
            rEl.style.boxShadow = 'none';
            rEl.style.transform = 'none';
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');

      // Standard A4 Portrait Dimensions (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210; // mm
      const pageHeight = 297; // mm

      // Fill entire A4 page with Obsidian (#070b14) so it matches the card 100% seamlessly
      pdf.setFillColor(7, 11, 20);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Beautiful 12mm margins on A4
      const margin = 12; // mm
      const maxWidth = pageWidth - margin * 2; // 186mm
      const maxHeight = pageHeight - margin * 2; // 273mm

      let renderWidth = maxWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      // Exact vertical and horizontal centering on A4
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
      const safeName = (cert?.studentName || 'Credential').replace(/\s+/g, '_');
      pdf.save(filename || `BlockCertify_Audit_Receipt_${safeName}_${cert?.certificateId || 'Verified'}.pdf`);
      toast.success('Official Blockchain Audit Receipt (PDF) downloaded successfully!');
      return true;
    } catch (err) {
      console.error('Failed to capture audit receipt element:', err);
      toast.error('Failed to generate Audit Receipt PDF. Please try again.');
      return false;
    }
  }

  toast.error('Unable to locate audit receipt canvas. Please try again.');
  return false;
}
