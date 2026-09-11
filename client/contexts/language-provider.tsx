"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'hi' | 'gu';

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
};

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.verify': 'Verify',
    'nav.explorer': 'Explorer',
    'nav.pricing': 'Pricing',
    'nav.docs': 'Docs',
    'nav.login': 'Login',
    'nav.getStarted': 'Get Started',
    'settings.preferences': 'Preferences',
    'settings.security': 'Security & Privacy',
    'settings.language': 'Language',
    'hero.badge': 'Trust Anchor Network',
    'hero.title.part1': 'Issue secure credentials with',
    'hero.title.part2': 'immutable integrity',
    'hero.description': 'BlockCertify aggregates secure registrar workflows, decentralized IPFS pinning, and Ethereum smart contracts to deliver tamper-proof academic and professional certification.',
    'hero.cta.start': 'Start issuing',
    'hero.cta.verify': 'Verify a certificate',
    'metrics.institutions': 'Active institutions',
    'metrics.institutions.desc': 'Trusted universities, academies, and professional certification boards',
    'metrics.certificates': 'Certificates anchored',
    'metrics.certificates.desc': 'High-volume issuance with immutable blockchain proofs',
    'metrics.latency': 'Verification latency',
    'metrics.latency.desc': 'Fast public and internal integrity checks across global traffic',
    'metrics.audit': 'Audit coverage',
    'metrics.audit.desc': 'Every privileged action is logged for compliance and forensic readiness',
    'features.title': 'Features',
    'features.heading': 'Purpose-built for trusted academic and enterprise credentials',
    'features.subheading': 'A polished platform that blends secure issuance, public verification, analytics, reporting, and governance into one premium experience.',
    'features.issuance': 'Secure issuance',
    'features.issuance.desc': 'Upload signed PDF certificates, generate hashes automatically, and anchor authenticity to Ethereum with one streamlined workflow.',
    'features.verify': 'Instant verification',
    'features.verify.desc': 'Validate by QR code, certificate ID, blockchain hash, or transaction hash with elegant real-time status states.',
    'features.analytics': 'Executive analytics',
    'features.analytics.desc': 'Track issuance growth, verification demand, institution rankings, traffic, and blockchain activity with rich visual dashboards.',
    'features.security': 'Enterprise security',
    'features.security.desc': 'Protect the platform with JWT, Auth.js, bcrypt, strict validation, rate limiting, RBAC, XSS defenses, audit logs, and tamper detection.'
  },
  es: {
    'nav.home': 'Inicio',
    'nav.verify': 'Verificar',
    'nav.explorer': 'Explorador',
    'nav.pricing': 'Precios',
    'nav.docs': 'Docs',
    'nav.login': 'Acceder',
    'nav.getStarted': 'Empezar',
    'settings.preferences': 'Preferencias',
    'settings.security': 'Seguridad y Privacidad',
    'settings.language': 'Idioma',
    'hero.badge': 'RED DE CONFIANZA',
    'hero.title.part1': 'Emite credenciales seguras con',
    'hero.title.part2': 'integridad inmutable',
    'hero.description': 'BlockCertify agrega flujos de trabajo de registro seguros, anclaje descentralizado IPFS y contratos inteligentes de Ethereum para ofrecer certificaciones a prueba de manipulaciones.',
    'hero.cta.start': 'Empezar a emitir',
    'hero.cta.verify': 'Verificar certificado',
    'metrics.institutions': 'Instituciones activas',
    'metrics.institutions.desc': 'Universidades, academias y juntas de certificación profesionales de confianza',
    'metrics.certificates': 'Certificados anclados',
    'metrics.certificates.desc': 'Emisión de alto volumen con pruebas de blockchain inmutables',
    'metrics.latency': 'Latencia de verificación',
    'metrics.latency.desc': 'Verificaciones de integridad públicas e internas rápidas',
    'metrics.audit': 'Cobertura de auditoría',
    'metrics.audit.desc': 'Cada acción privilegiada se registra para cumplimiento',
    'features.title': 'Características',
    'features.heading': 'Diseñado para credenciales académicas y empresariales de confianza',
    'features.subheading': 'Una plataforma pulida que combina emisión segura, verificación pública y análisis.',
    'features.issuance': 'Emisión segura',
    'features.issuance.desc': 'Sube certificados en PDF, genera hashes y ancla la autenticidad a Ethereum.',
    'features.verify': 'Verificación instantánea',
    'features.verify.desc': 'Valida mediante código QR, ID de certificado, o hash de blockchain.',
    'features.analytics': 'Análisis ejecutivo',
    'features.analytics.desc': 'Rastrea el crecimiento de emisión, demanda de verificación y actividad de blockchain.',
    'features.security': 'Seguridad empresarial',
    'features.security.desc': 'Protege la plataforma con JWT, validación estricta y detección de manipulaciones.'
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.verify': 'Vérifier',
    'nav.explorer': 'Explorateur',
    'nav.pricing': 'Tarifs',
    'nav.docs': 'Docs',
    'nav.login': 'Connexion',
    'nav.getStarted': 'Commencer',
    'settings.preferences': 'Préférences',
    'settings.security': 'Sécurité et Confidentialité',
    'settings.language': 'Langue',
    'hero.badge': 'RÉSEAU DE CONFIANCE',
    'hero.title.part1': 'Émettez des identifiants sécurisés avec une',
    'hero.title.part2': 'intégrité immuable',
    'hero.description': 'BlockCertify regroupe des flux de travail de registraire sécurisés, le stockage IPFS décentralisé et des contrats intelligents Ethereum.',
    'hero.cta.start': 'Commencer',
    'hero.cta.verify': 'Vérifier un certificat',
    'metrics.institutions': 'Institutions actives',
    'metrics.institutions.desc': 'Universités, académies et comités de certification de confiance',
    'metrics.certificates': 'Certificats ancrés',
    'metrics.certificates.desc': 'Émission à haut volume avec des preuves blockchain immuables',
    'metrics.latency': 'Latence de vérification',
    'metrics.latency.desc': 'Vérifications d\'intégrité rapides pour le trafic mondial',
    'metrics.audit': 'Couverture d\'audit',
    'metrics.audit.desc': 'Chaque action est enregistrée pour la conformité',
    'features.title': 'Fonctionnalités',
    'features.heading': 'Conçu pour des informations d\'identification fiables',
    'features.subheading': 'Une plate-forme qui allie émission sécurisée et vérification publique.',
    'features.issuance': 'Émission sécurisée',
    'features.issuance.desc': 'Téléchargez des PDF, générez des hachages et ancrez sur Ethereum.',
    'features.verify': 'Vérification instantanée',
    'features.verify.desc': 'Validez par code QR, ID de certificat ou hachage blockchain.',
    'features.analytics': 'Analyses',
    'features.analytics.desc': 'Suivez la croissance des émissions et l\'activité de la blockchain.',
    'features.security': 'Sécurité d\'entreprise',
    'features.security.desc': 'Protégez avec JWT, des validations strictes et des journaux d\'audit.'
  },
  de: {
    'nav.home': 'Startseite',
    'nav.verify': 'Überprüfen',
    'nav.explorer': 'Explorer',
    'nav.pricing': 'Preise',
    'nav.docs': 'Docs',
    'nav.login': 'Anmelden',
    'nav.getStarted': 'Loslegen',
    'settings.preferences': 'Einstellungen',
    'settings.security': 'Sicherheit & Datenschutz',
    'settings.language': 'Sprache',
    'hero.badge': 'VERTRAUENSNETZWERK',
    'hero.title.part1': 'Sichere Zeugnisse mit',
    'hero.title.part2': 'unveränderlicher Integrität',
    'hero.description': 'BlockCertify aggregiert sichere Registrar-Workflows, dezentrales IPFS-Pinning und Ethereum Smart Contracts.',
    'hero.cta.start': 'Jetzt ausstellen',
    'hero.cta.verify': 'Zertifikat prüfen',
    'metrics.institutions': 'Aktive Institutionen',
    'metrics.institutions.desc': 'Vertrauenswürdige Universitäten und Zertifizierungsstellen',
    'metrics.certificates': 'Verankerte Zertifikate',
    'metrics.certificates.desc': 'Großvolumige Ausstellung mit unveränderlichen Blockchain-Beweisen',
    'metrics.latency': 'Überprüfungslatenz',
    'metrics.latency.desc': 'Schnelle Integritätsprüfungen im globalen Datenverkehr',
    'metrics.audit': 'Audit-Abdeckung',
    'metrics.audit.desc': 'Jede Aktion wird aus Compliance-Gründen protokolliert',
    'features.title': 'Funktionen',
    'features.heading': 'Entwickelt für vertrauenswürdige Anmeldeinformationen',
    'features.subheading': 'Eine Plattform, die sichere Ausgabe und öffentliche Verifizierung kombiniert.',
    'features.issuance': 'Sichere Ausstellung',
    'features.issuance.desc': 'PDFs hochladen, Hashes generieren und in Ethereum verankern.',
    'features.verify': 'Sofortige Überprüfung',
    'features.verify.desc': 'Validieren durch QR-Code, Zertifikats-ID oder Blockchain-Hash.',
    'features.analytics': 'Analytik',
    'features.analytics.desc': 'Verfolgen Sie das Ausgabewachstum und die Blockchain-Aktivität.',
    'features.security': 'Unternehmenssicherheit',
    'features.security.desc': 'Schützen Sie die Plattform mit JWT und strengen Validierungen.'
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.verify': '確認',
    'nav.explorer': 'エクスプローラー',
    'nav.pricing': '価格',
    'nav.docs': 'ドキュメント',
    'nav.login': 'ログイン',
    'nav.getStarted': 'はじめる',
    'settings.preferences': '設定',
    'settings.security': 'セキュリティ',
    'settings.language': '言語',
    'hero.badge': 'トラストネットワーク',
    'hero.title.part1': '改ざん不可能な完全性を持つ',
    'hero.title.part2': '証明書を発行',
    'hero.description': 'BlockCertifyは安全な登録ワークフロー、IPFSピニング、Ethereumスマートコントラクトを統合します。',
    'hero.cta.start': '発行を開始',
    'hero.cta.verify': '証明書を確認',
    'metrics.institutions': 'アクティブな機関',
    'metrics.institutions.desc': '信頼できる大学や認証機関',
    'metrics.certificates': 'アンカーされた証明書',
    'metrics.certificates.desc': 'ブロックチェーン証明付きの大量発行',
    'metrics.latency': '検証のレイテンシ',
    'metrics.latency.desc': 'グローバルなトラフィックにわたる高速な整合性チェック',
    'metrics.audit': '監査の網羅性',
    'metrics.audit.desc': 'コンプライアンスのためにすべてのアクションが記録されます',
    'features.title': '機能',
    'features.heading': '信頼できる認証情報のために設計されました',
    'features.subheading': '安全な発行と公開検証を融合したプラットフォーム。',
    'features.issuance': '安全な発行',
    'features.issuance.desc': 'PDFをアップロードし、ハッシュを生成し、Ethereumにアンカーします。',
    'features.verify': '即時検証',
    'features.verify.desc': 'QRコード、証明書ID、またはブロックチェーンハッシュで検証します。',
    'features.analytics': '分析',
    'features.analytics.desc': '発行の成長とブロックチェーンの活動を追跡します。',
    'features.security': 'エンタープライズセキュリティ',
    'features.security.desc': 'JWTや厳格な検証でプラットフォームを保護します。'
  },
  hi: {
    'nav.home': 'होम',
    'nav.verify': 'सत्यापन',
    'nav.explorer': 'एक्सप्लोरर',
    'nav.pricing': 'कीमतें',
    'nav.docs': 'दस्तावेज़',
    'nav.login': 'लॉग इन',
    'nav.getStarted': 'शुरू करें',
    'settings.preferences': 'प्राथमिकताएं',
    'settings.security': 'सुरक्षा और गोपनीयता',
    'settings.language': 'भाषा',
    'hero.badge': 'भरोसेमंद नेटवर्क',
    'hero.title.part1': 'अपरिवर्तनीय अखंडता के साथ',
    'hero.title.part2': 'सुरक्षित प्रमाण पत्र जारी करें',
    'hero.description': 'ब्लॉकसर्टिफाई (BlockCertify) सुरक्षित कार्यप्रवाह, विकेंद्रीकृत आईपीएफएस (IPFS) और एथेरियम स्मार्ट कॉन्ट्रैक्ट्स को जोड़ता है ताकि छेड़छाड़-रोधी प्रमाणन प्रदान किया जा सके।',
    'hero.cta.start': 'जारी करना शुरू करें',
    'hero.cta.verify': 'प्रमाण पत्र सत्यापित करें',
    'metrics.institutions': 'सक्रिय संस्थाएं',
    'metrics.institutions.desc': 'भरोसेमंद विश्वविद्यालय, अकादमियां और प्रमाणन बोर्ड',
    'metrics.certificates': 'एंकर किए गए प्रमाण पत्र',
    'metrics.certificates.desc': 'ब्लॉकचेन सबूत के साथ उच्च-मात्रा में निर्गमन',
    'metrics.latency': 'सत्यापन विलंबता',
    'metrics.latency.desc': 'वैश्विक ट्रैफ़िक में तेज़ सार्वजनिक और आंतरिक अखंडता जाँच',
    'metrics.audit': 'ऑडिट कवरेज',
    'metrics.audit.desc': 'अनुपालन के लिए हर विशेषाधिकार प्राप्त कार्रवाई को लॉग किया जाता है',
    'features.title': 'विशेषताएं',
    'features.heading': 'विश्वसनीय शैक्षणिक और उद्यम साख के लिए बनाया गया',
    'features.subheading': 'एक प्रीमियम प्लेटफॉर्म जो सुरक्षित निर्गमन और सार्वजनिक सत्यापन को मिलाता है।',
    'features.issuance': 'सुरक्षित निर्गमन',
    'features.issuance.desc': 'हस्ताक्षरित पीडीएफ़ अपलोड करें और एथेरियम से प्रामाणिकता जोड़ें।',
    'features.verify': 'त्वरित सत्यापन',
    'features.verify.desc': 'क्यूआर (QR) कोड, प्रमाणपत्र आईडी या ब्लॉकचेन हैश द्वारा मान्य करें।',
    'features.analytics': 'एनालिटिक्स',
    'features.analytics.desc': 'निर्गमन वृद्धि, सत्यापन मांग और ब्लॉकचेन गतिविधि को ट्रैक करें।',
    'features.security': 'उद्यम सुरक्षा',
    'features.security.desc': 'जेडब्ल्यूटी (JWT), सख्त सत्यापन और ऑडिट लॉग के साथ सुरक्षा।'
  },
  gu: {
    'nav.home': 'હોમ',
    'nav.verify': 'ચકાસણી',
    'nav.explorer': 'એક્સપ્લોરર',
    'nav.pricing': 'કિંમતો',
    'nav.docs': 'દસ્તાવેજો',
    'nav.login': 'લૉગ ઇન',
    'nav.getStarted': 'શરૂ કરો',
    'settings.preferences': 'પસંદગીઓ',
    'settings.security': 'સુરક્ષા અને ગોપનીયતા',
    'settings.language': 'ભાષા',
    'hero.badge': 'વિશ્વસનીય નેટવર્ક',
    'hero.title.part1': 'અપરિવર્તનીય અખંડિતતા સાથે',
    'hero.title.part2': 'સુરક્ષિત પ્રમાણપત્રો જારી કરો',
    'hero.description': 'બ્લોકસર્ટિફાય સુરક્ષિત રજિસ્ટ્રાર વર્કફ્લો, IPFS પિનિંગ અને એથેરિયમ સ્માર્ટ કોન્ટ્રાક્ટ્સને જોડે છે જેથી ચેડા-પ્રૂફ પ્રમાણપત્ર આપી શકાય.',
    'hero.cta.start': 'જારી કરવાનું શરૂ કરો',
    'hero.cta.verify': 'પ્રમાણપત્ર ચકાસો',
    'metrics.institutions': 'સક્રિય સંસ્થાઓ',
    'metrics.institutions.desc': 'વિશ્વસનીય યુનિવર્સિટીઓ, એકેડમીઓ અને પ્રમાણપત્ર બોર્ડ્સ',
    'metrics.certificates': 'એન્કર કરેલા પ્રમાણપત્રો',
    'metrics.certificates.desc': 'અપરિવર્તનીય બ્લોકચેન પુરાવાઓ સાથે ઉચ્ચ-વોલ્યુમ ઇશ્યૂઅન્સ',
    'metrics.latency': 'ચકાસણી વિલંબ',
    'metrics.latency.desc': 'વૈશ્વિક ટ્રાફિકમાં ઝડપી સાર્વજનિક અને આંતરિક અખંડિતતા તપાસ',
    'metrics.audit': 'ઓડિટ કવરેજ',
    'metrics.audit.desc': 'પાલન માટે દરેક વિશેષાધિકૃત ક્રિયા નોંધવામાં આવે છે',
    'features.title': 'સુવિધાઓ',
    'features.heading': 'વિશ્વસનીય શૈક્ષણિક અને વ્યવસાયિક ઓળખપત્રો માટે રચાયેલ છે',
    'features.subheading': 'એક પ્રીમિયમ પ્લેટફોર્મ જે સુરક્ષિત ઇશ્યૂઅન્સ અને સાર્વજનિક ચકાસણીનું મિશ્રણ કરે છે.',
    'features.issuance': 'સુરક્ષિત જારી',
    'features.issuance.desc': 'પીડીએફ અપલોડ કરો અને એથેરિયમ પર અધિકૃતતા એન્કર કરો.',
    'features.verify': 'ત્વરિત ચકાસણી',
    'features.verify.desc': 'QR કોડ, પ્રમાણપત્ર ID અથવા બ્લોકચેન હેશ દ્વારા માન્ય કરો.',
    'features.analytics': 'એનાલિટિક્સ',
    'features.analytics.desc': 'ઇશ્યૂઅન્સ વૃદ્ધિ અને બ્લોકચેન પ્રવૃત્તિને ટ્રેક કરો.',
    'features.security': 'એન્ટરપ્રાઇઝ સુરક્ષા',
    'features.security.desc': 'JWT અને કડક માન્યતા સાથે પ્લેટફોર્મને સુરક્ષિત કરો.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('blockcertify-lang') as LanguageCode;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('blockcertify-lang', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
