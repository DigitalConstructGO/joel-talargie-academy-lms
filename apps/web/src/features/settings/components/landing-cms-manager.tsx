'use client';

import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Layers,
  Layout,
  ListOrdered,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  PlayCircle,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { toast } from '@/lib/toast';
import { ImageUploadField } from './image-upload-field';
import { useUpdateSettingsBatch } from '../hooks/use-settings';
import type {
  CategoriesSettings,
  FaqItem,
  FeaturedCoursesSettings,
  FinalCtaSettings,
  HeroSettings,
  HowItWorksItem,
  LandingSectionsSettings,
  MentorSettings,
  PlatformStatsSettings,
  StructuredAcademySettings,
  TestimonialItem,
  ValuePillItem,
  WhyChooseUsItem,
} from '../types/settings.types';

const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Clock,
  Users,
  Award,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Search,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Target,
  Zap,
  GraduationCap,
  Star,
};

function renderIcon(iconName: string, className = 'size-4') {
  const IconComp = AVAILABLE_ICONS[iconName] ?? Sparkles;
  return <IconComp className={className} />;
}

type CmsTab =
  | 'sections'
  | 'hero'
  | 'valuePills'
  | 'whyChooseUs'
  | 'howItWorks'
  | 'featured'
  | 'categories'
  | 'mentor'
  | 'stats'
  | 'testimonials'
  | 'faq'
  | 'finalCta';

import { useLanguage } from '@/lib/i18n/language-provider';

const CMS_TRANSLATION_MAP_AM: Record<string, string> = {
  // Value Pills
  'Self-Paced Learning': 'በራስዎ ፍጥነት መማር',
  'Study on your own schedule with lifetime access to every course you enroll in.':
    'በተመዘገቡበት በማንኛውም ኮርስ የህይወት ዘመን መዳረሻ በማግኘት በራስዎ የጊዜ ሰሌዳ ይማሩ።',
  'Real Instructors': 'እውነተኛ እና ልምድ ያላቸው መምህራን',
  'Courses taught by working professionals, not narrators reading slides.':
    'ኮርሶች በተግባር በsector ውስጥ በሚሰሩ ባለሙያዎች የሚሰጡ እንጂ ስላይድ በሚያነቡ ተራ ተናጋሪዎች አይደሉም።',
  'Verified Credentials': 'የተረጋገጡ ሰርተፊኬቶች',
  'Finish a certificate-eligible course and show what you learned to employers.':
    'ብቁ የሆነ ኮርስ ያጠናቅቁ እና የተማሩትን ለአሰሪዎች የሚያሳዩበት የተረጋገጠ ሰርተፊኬት ያግኙ።',

  // Why Choose Us
  'Learn at your own pace': 'በራስዎ ፍጥነት ይማሩ',
  'Courses are self-paced with full lifetime access, so you can learn on your schedule.':
    'ኮርሶች ሙሉ የህይወት ዘመን መዳረሻ ያላቸው እና በራስዎ የጊዜ ሰሌዳ የሚማሩ ናቸው።',
  'Earn certificates': 'ሰርተፊኬቶችን ያግኙ',
  'Complete eligible courses to earn a certificate of completion you can share.':
    'ብቁ ኮርሶችን በማጠናቀቅ ሊያጋሩት የሚችሉት የማጠናቀቂያ ሰርተፊኬት ያግኙ።',
  'Vetted instructors': 'የተረጋገጡ መምህራን',
  'Every course is reviewed before publishing to keep quality high.':
    'ጥራቱን ለመጠበቅ እያንዳንዱ ኮርስ ከመታተሙ በፊት በጥንቃቄ ይገመገማል።',
  'Learn anywhere': 'በማንኛውም ቦታ ይማሩ',
  'A fully responsive experience across desktop, tablet, and mobile.':
    'በኮምፒውተር፣ በታብሌት እና በስልክ ላይ ሙሉ በሙሉ ተስማሚ የሆነ የመማር ልምድ።',

  // How It Works
  'Create an account': 'አካውንት ይፍጠሩ',
  'Sign up free in under a minute.': 'በአንድ ደቂቃ ውስጥ በነጻ ይመዝገቡ።',
  'Find a course': 'ኮርስ ይፈልጉ',
  'Browse the catalog or search for a topic.': 'ካታሎጉን ይመልከቱ ወይም የሚፈልጉትን ርዕስ ይፈልጉ።',
  'Start learning': 'መማር ይጀምሩ',
  'Work through lessons at your own pace.': 'ትምህርቶችን በራስዎ ፍጥነት ይከታተሉ።',
  'Get certified': 'ሰርተፊኬት ያግኙ',
  'Finish the course and earn your certificate.': 'ኮርሱን ያጠናቅቁ እና ሰርተፊኬትዎን ያግኙ።',

  // FAQs
  'Are the courses self-paced?': 'ኮርሶቹ በራስ ፍጥነት የሚወሰዱ ናቸው?',
  'Yes, all courses offer lifetime access so you can study at your own pace whenever and wherever you want.':
    'አዎ፣ ሁሉም ኮርሶች የህይወት ዘመን መዳረሻ ስላላቸው በማንኛውም ጊዜ እና ቦታ በራስዎ ፍጥነት መማር ይችላሉ።',
  'Do I get a certificate upon completion?': 'ኮርሱን ስጨርስ ሰርተፊኬት አገኛለሁ?',
  'Yes, once you complete all required lessons and assessments in a course, you receive a verified digital certificate with QR authentication.':
    'አዎ፣ የኮርሱን ትምህርቶች እና ምዘናዎች እንደጨረሱ በQR ኮድ የተረጋገጠ ዲጂታል ሰርተፊኬት ይደርስዎታል።',
  'What payment methods are supported?': 'ምን አይነት የክፍያ መንገዶች ይደገፋሉ?',
  'We support multiple payment methods including mobile money, bank transfers, and standard credit/debit cards.':
    'የሞባይል ባንክ፣ የባንክ ሐዋላ እና ካርዶችን ጨምሮ የተለያዩ የክፍያ መንገዶችን እንደግፋለን።',
  'Can I access the platform on mobile devices?': 'በሞባይል ስልክ መጠቀም እችላለሁ?',
  'Absolutely. The academy is completely responsive and works smoothly on smartphones, tablets, laptops, and desktop computers.':
    'በእርግጥ። አካዳሚው በስልክ፣ ታብሌት እና ኮምፒውተር ላይ በጥራት ይሰራል።',

  // Testimonials
  'The curriculum was straightforward and practical. I was able to apply what I learned in my engineering job within weeks.':
    'ካሪኩለሙ ግልጽ እና ተግባራዊ ነበር። የተማርኩትን በሳምንታት ውስጥ በስራዬ ላይ መተግበር ችያለሁ።',
  'Exceptional instruction and crystal-clear explanations. The certificate verification was seamless.':
    'ድንቅ ማብራሪያ እና ግልጽ ትምህርት። የሰርተፊኬት ማረጋገጫው በጣም ቀልጣፋ ነበር።',
  'By far the best learning experience I have had online. Hands-on exercises and great support.':
    'በኦንላይን ከተማርኳቸው ምርጡ የመማር ልምድ ነው። ተግባራዊ ልምምዶች እና ጥሩ ድጋፍ አለው።',
};

export function translateCmsText(text?: string | null, locale?: string): string {
  if (!text) return '';
  if (locale === 'am' && CMS_TRANSLATION_MAP_AM[text.trim()]) {
    return CMS_TRANSLATION_MAP_AM[text.trim()]!;
  }
  return text;
}

export function LandingCmsManager({
  initialData,
  disabled = false,
}: {
  initialData: StructuredAcademySettings;
  disabled?: boolean;
}) {
  const { locale } = useLanguage();
  const updateBatch = useUpdateSettingsBatch();

  const [sections, setSections] = useState<LandingSectionsSettings>(initialData.sections);
  const [hero, setHero] = useState<HeroSettings>(initialData.hero);
  const [valuePills, setValuePills] = useState<ValuePillItem[]>(initialData.valuePills ?? []);
  const [whyChooseUs, setWhyChooseUs] = useState<WhyChooseUsItem[]>(initialData.whyChooseUs ?? []);
  const [howItWorks, setHowItWorks] = useState<HowItWorksItem[]>(initialData.howItWorks ?? []);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCoursesSettings>(
    initialData.featuredCourses ?? { enabled: true, limit: 8 },
  );
  const [categories, setCategories] = useState<CategoriesSettings>(
    initialData.categories ?? { enabled: true, limit: 8, ordering: 'courseCount' },
  );
  const [mentor, setMentor] = useState<MentorSettings>(
    initialData.mentor ?? {
      enabled: true,
      featuredInstructorId: null,
      name: '',
      headline: '',
      bio: '',
      photoUrl: '',
      achievements: [],
    },
  );
  const [statistics, setStatistics] = useState<PlatformStatsSettings>(
    initialData.statistics ?? {
      enabled: true,
      items: [
        { key: 'students', label: 'Students enrolled', displayOrder: 1, isEnabled: true },
        { key: 'courses', label: 'Active courses', displayOrder: 2, isEnabled: true },
        { key: 'rating', label: 'Average course rating', displayOrder: 3, isEnabled: true },
        { key: 'satisfaction', label: 'Student satisfaction', displayOrder: 4, isEnabled: true },
      ],
    },
  );
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    initialData.testimonials ?? [],
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(initialData.faqs ?? []);
  const [finalCta, setFinalCta] = useState<FinalCtaSettings>(initialData.finalCta);

  // Dialog & Form States
  const [activeTab, setActiveTab] = useState<CmsTab>('sections');

  // Value Pill Modal State
  const [editingPill, setEditingPill] = useState<ValuePillItem | null>(null);
  const [pillDialogOpen, setPillDialogOpen] = useState(false);
  const [deletePillId, setDeletePillId] = useState<string | null>(null);

  // Why Choose Us Modal State
  const [editingWhy, setEditingWhy] = useState<WhyChooseUsItem | null>(null);
  const [whyDialogOpen, setWhyDialogOpen] = useState(false);
  const [deleteWhyId, setDeleteWhyId] = useState<string | null>(null);

  // How It Works Modal State
  const [editingHow, setEditingHow] = useState<HowItWorksItem | null>(null);
  const [howDialogOpen, setHowDialogOpen] = useState(false);
  const [deleteHowId, setDeleteHowId] = useState<string | null>(null);

  // Testimonial Modal State
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [deleteTestimonialId, setDeleteTestimonialId] = useState<string | null>(null);

  // FAQ Modal State
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);

  async function handleSaveAll() {
    try {
      await updateBatch.mutateAsync({
        reason: 'Updated Landing Page CMS configuration and dynamic content',
        items: [
          { key: 'landing.sections', value: sections },
          { key: 'landing.hero', value: hero },
          { key: 'landing.value_pills', value: valuePills },
          { key: 'landing.why_choose_us', value: whyChooseUs },
          { key: 'landing.how_it_works', value: howItWorks },
          { key: 'landing.featured_courses', value: featuredCourses },
          { key: 'landing.categories', value: categories },
          { key: 'landing.mentor', value: mentor },
          { key: 'landing.statistics', value: statistics },
          { key: 'landing.testimonials', value: testimonials },
          { key: 'landing.faqs', value: faqs },
          { key: 'landing.final_cta', value: finalCta },
        ],
      });
      toast.success('Landing Page CMS saved successfully');
    } catch {
      toast.error('Failed to save Landing Page CMS', 'Check your permissions and try again.');
    }
  }

  // --- Value Pills Handlers ---
  function handleSavePill(pill: ValuePillItem) {
    if (editingPill && editingPill.id) {
      setValuePills((prev) => prev.map((p) => (p.id === pill.id ? pill : p)));
    } else {
      const newPill = { ...pill, id: `pill-${Date.now()}` };
      setValuePills((prev) => [...prev, newPill]);
    }
    setPillDialogOpen(false);
    setEditingPill(null);
  }

  function handleDeletePill(id: string) {
    setValuePills((prev) => prev.filter((p) => p.id !== id));
    setDeletePillId(null);
    toast.success('Value Pill removed');
  }

  // --- Why Choose Us Handlers ---
  function handleSaveWhy(item: WhyChooseUsItem) {
    if (editingWhy && editingWhy.id) {
      setWhyChooseUs((prev) => prev.map((w) => (w.id === item.id ? item : w)));
    } else {
      const newItem = { ...item, id: `why-${Date.now()}` };
      setWhyChooseUs((prev) => [...prev, newItem]);
    }
    setWhyDialogOpen(false);
    setEditingWhy(null);
  }

  function handleDeleteWhy(id: string) {
    setWhyChooseUs((prev) => prev.filter((w) => w.id !== id));
    setDeleteWhyId(null);
    toast.success('Why Choose Us card removed');
  }

  // --- How It Works Handlers ---
  function handleSaveHow(item: HowItWorksItem) {
    if (editingHow && editingHow.id) {
      setHowItWorks((prev) => prev.map((h) => (h.id === item.id ? item : h)));
    } else {
      const newItem = { ...item, id: `how-${Date.now()}` };
      setHowItWorks((prev) => [...prev, newItem]);
    }
    setHowDialogOpen(false);
    setEditingHow(null);
  }

  function handleDeleteHow(id: string) {
    setHowItWorks((prev) => prev.filter((h) => h.id !== id));
    setDeleteHowId(null);
    toast.success('Step removed');
  }

  // --- Testimonial Handlers ---
  async function handleSaveTestimonial(item: TestimonialItem) {
    let nextList: TestimonialItem[];
    if (editingTestimonial && editingTestimonial.id) {
      nextList = testimonials.map((t) => (t.id === item.id ? item : t));
    } else {
      const newItem = { ...item, id: `test-${Date.now()}` };
      nextList = [...testimonials, newItem];
    }
    setTestimonials(nextList);
    setTestimonialDialogOpen(false);
    setEditingTestimonial(null);
    try {
      await updateBatch.mutateAsync({
        reason: 'Saved testimonial entry',
        items: [{ key: 'landing.testimonials', value: nextList }],
      });
      toast.success('Testimonial saved to database');
    } catch {
      toast.error('Failed to auto-save testimonial', 'Click "Save All Changes" to save manually.');
    }
  }

  async function handleDeleteTestimonial(id: string) {
    const nextList = testimonials.filter((t) => t.id !== id);
    setTestimonials(nextList);
    setDeleteTestimonialId(null);
    try {
      await updateBatch.mutateAsync({
        reason: 'Deleted testimonial entry',
        items: [{ key: 'landing.testimonials', value: nextList }],
      });
      toast.success('Testimonial removed from database');
    } catch {
      toast.error('Failed to update database', 'Click "Save All Changes" to save manually.');
    }
  }

  // --- FAQ Handlers ---
  function handleSaveFaq(item: FaqItem) {
    if (editingFaq && editingFaq.id) {
      setFaqs((prev) => prev.map((f) => (f.id === item.id ? item : f)));
    } else {
      const newItem = { ...item, id: `faq-${Date.now()}` };
      setFaqs((prev) => [...prev, newItem]);
    }
    setFaqDialogOpen(false);
    setEditingFaq(null);
  }

  function handleDeleteFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setDeleteFaqId(null);
    toast.success('FAQ item removed');
  }

  return (
    <div className="space-y-6">
      {/* Top Section Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {[
          {
            id: 'sections',
            label: locale === 'am' ? 'የክፍሎች ቁጥጥር' : 'Section Control',
            icon: Layout,
          },
          { id: 'hero', label: locale === 'am' ? 'Hero ክፍል' : 'Hero', icon: Sparkles },
          { id: 'valuePills', label: locale === 'am' ? 'የእሴት ጥቆማዎች' : 'Value Pills', icon: Layers },
          {
            id: 'whyChooseUs',
            label: locale === 'am' ? 'ለምን መረጡን' : 'Why Choose Us',
            icon: ShieldCheck,
          },
          {
            id: 'howItWorks',
            label: locale === 'am' ? 'እንዴት እንደሚሰራ' : 'How It Works',
            icon: ListOrdered,
          },
          {
            id: 'featured',
            label: locale === 'am' ? 'የተመረጡ ኮርሶች' : 'Featured Courses',
            icon: GraduationCap,
          },
          { id: 'categories', label: locale === 'am' ? 'ምድቦች' : 'Categories', icon: Layers },
          { id: 'mentor', label: locale === 'am' ? 'አስተማሪዎች' : 'Mentor Spotlight', icon: Users },
          { id: 'stats', label: locale === 'am' ? 'ስታቲስቲክስ' : 'Platform Statistics', icon: Target },
          {
            id: 'testimonials',
            label: locale === 'am' ? 'ምስክርነቶች' : 'Testimonials',
            icon: MessageSquare,
          },
          { id: 'faq', label: locale === 'am' ? 'ተደጋጋሚ ጥያቄዎች' : 'FAQ', icon: HelpCircle },
          { id: 'finalCta', label: locale === 'am' ? 'የመጨረሻ ጥሪ' : 'Final CTA', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as CmsTab)}
              className="gap-1.5"
            >
              <Icon className="size-3.5" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* 1. SECTIONS CONTROL */}
      {activeTab === 'sections' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'am' ? 'የመነሻ ገጽ ክፍሎች እይታ' : 'Landing Page Section Visibility'}
            </CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'በአካዳሚው መነሻ ገጽ ላይ ይፋዊ ክፍሎችን ያንቁ ወይም ያቦዝኑ። የታገዱ ክፍሎች ከበስተጀርባ ኤፒአይ አይወጡም።'
                : 'Enable or disable public sections on the academy homepage. Disabled sections are omitted by the backend API.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  key: 'hero',
                  label: locale === 'am' ? 'Hero ርዕስ እና ፍለጋ' : 'Hero Header & Search',
                  desc: locale === 'am' ? 'ዋና ርዕስ፣ ጥሪዎች እና ፍለጋ' : 'Main headline, CTAs & search',
                },
                {
                  key: 'valuePills',
                  label: locale === 'am' ? 'የእሴት ጥቆማዎች' : 'Value Propositions',
                  desc: locale === 'am' ? 'ከፍተኛ የእሴት ማሳያ ካርዶች' : 'Top value highlight pills',
                },
                {
                  key: 'whyChooseUs',
                  label: locale === 'am' ? 'ለምን መረጡን' : 'Why Choose Us',
                  desc: locale === 'am' ? 'ዋና ተቋማዊ ጥንካሬዎች' : 'Core institutional strengths',
                },
                {
                  key: 'howItWorks',
                  label: locale === 'am' ? 'የትምህርት መዋቅር' : 'The Learning Framework',
                  desc: locale === 'am' ? 'የ4-ደረጃ ተማሪዎች መንገድ' : '4-step student roadmap',
                },
                {
                  key: 'featuredCourses',
                  label: locale === 'am' ? 'የተመረጡ ኮርሶች' : 'Featured Courses',
                  desc: locale === 'am' ? 'የተመረጡ እውነተኛ ኮርሶች' : 'Real DB courses marked featured',
                },
                {
                  key: 'categories',
                  label: locale === 'am' ? 'ምድቦች' : 'Browse Categories',
                  desc:
                    locale === 'am' ? 'ንቁ ምድቦች እና የኮርስ ብዛት' : 'Active categories & course counts',
                },
                {
                  key: 'mentor',
                  label: locale === 'am' ? 'አስተማሪዎች' : 'Mentor Spotlight',
                  desc: locale === 'am' ? 'የተመረጡ አስተማሪዎች መገለጫ' : 'Featured instructor profile',
                },
                {
                  key: 'stats',
                  label: locale === 'am' ? 'የሲስተም ስታቲስቲክስ' : 'Platform Statistics',
                  desc:
                    locale === 'am'
                      ? 'የተማሪዎች፣ ኮርሶች እና ደረጃዎች ብዛት'
                      : 'Live students, courses & ratings',
                },
                {
                  key: 'pricing',
                  label: locale === 'am' ? 'የዋጋ ቅድመ እይታ' : 'Pricing Preview',
                  desc: locale === 'am' ? 'ነጻ እና የክፍያ ኮርስ ደረጃዎች' : 'Free & paid course tiers',
                },
                {
                  key: 'testimonials',
                  label: locale === 'am' ? 'የተማሪዎች ምስክርነት' : 'Learner Testimonials',
                  desc: locale === 'am' ? 'የተማሪዎች አስተያየት' : 'Student reviews carousel',
                },
                {
                  key: 'certificateVerify',
                  label: locale === 'am' ? 'ሰርተፊኬት ማረጋገጫ' : 'Verify Certificate',
                  desc: locale === 'am' ? 'ይፋዊ የQR ማረጋገጫ ፍለጋ' : 'Public QR verification lookup',
                },
                {
                  key: 'faq',
                  label: locale === 'am' ? 'ተደጋጋሚ ጥያቄዎች' : 'Frequently Asked Questions',
                  desc: locale === 'am' ? 'ተደጋጋሚ ጥያቄዎች እና መልሶች' : 'Accordion FAQ preview',
                },
                {
                  key: 'finalCta',
                  label: locale === 'am' ? 'የመጨረሻ ጥሪ' : 'Final Call to Action',
                  desc: locale === 'am' ? 'የታችኛው ምዝገባ ባነር' : 'Bottom enrollment banner',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="space-y-0.5 pr-2">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={Boolean(sections[item.key as keyof LandingSectionsSettings])}
                    onCheckedChange={(checked) =>
                      setSections((prev) => ({ ...prev, [item.key]: checked }))
                    }
                    disabled={disabled || updateBatch.isPending}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. HERO CONFIG */}
      {activeTab === 'hero' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'am' ? 'የHero ክፍል ማዋቀሪያ' : 'Hero Section Configuration'}
            </CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'ዋና የህዝብ መነሻ ርዕስ፣ ፍለጋ እና የጥሪ አዝራሮች።'
                : 'Main public landing header, search, and call to action buttons.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroHeading">{locale === 'am' ? 'ዋና ርዕስ' : 'Main Headline'}</Label>
              <Input
                id="heroHeading"
                value={hero.heading}
                onChange={(e) => setHero((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="Engineer Your Next Career Move."
                required
                disabled={disabled || updateBatch.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroDescription">
                {locale === 'am' ? 'የHero ንዑስ ርዕስ / መግለጫ' : 'Hero Subtitle / Description'}
              </Label>
              <Textarea
                id="heroDescription"
                rows={3}
                value={hero.description}
                onChange={(e) => setHero((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Learn directly from the source..."
                disabled={disabled || updateBatch.isPending}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryCtaText">
                  {locale === 'am' ? 'የመጀመሪያ ጥሪ አዝራር ስም' : 'Primary CTA Button Label'}
                </Label>
                <Input
                  id="primaryCtaText"
                  value={hero.primaryCtaText}
                  onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaText: e.target.value }))}
                  placeholder="Explore Courses"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryCtaUrl">
                  {locale === 'am' ? 'የመጀመሪያ ጥሪ URL' : 'Primary CTA URL'}
                </Label>
                <Input
                  id="primaryCtaUrl"
                  value={hero.primaryCtaUrl}
                  onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaUrl: e.target.value }))}
                  placeholder="/courses"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryCtaText">
                  {locale === 'am' ? 'ሁለተኛ ጥሪ አዝራር ስም' : 'Secondary CTA Button Label'}
                </Label>
                <Input
                  id="secondaryCtaText"
                  value={hero.secondaryCtaText}
                  onChange={(e) =>
                    setHero((prev) => ({ ...prev, secondaryCtaText: e.target.value }))
                  }
                  placeholder="Create Account"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryCtaUrl">
                  {locale === 'am' ? 'ሁለተኛ ጥሪ URL' : 'Secondary CTA URL'}
                </Label>
                <Input
                  id="secondaryCtaUrl"
                  value={hero.secondaryCtaUrl}
                  onChange={(e) =>
                    setHero((prev) => ({ ...prev, secondaryCtaUrl: e.target.value }))
                  }
                  placeholder="/auth/register"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
            </div>

            <ImageUploadField
              id="heroImageUrl"
              label={locale === 'am' ? 'የHero ምስል / ዳራ' : 'Hero Image / Background Asset'}
              value={hero.heroImageUrl}
              onChange={(url) => setHero((prev) => ({ ...prev, heroImageUrl: url }))}
              description={
                locale === 'am'
                  ? 'በመነሻ ገጽ ላይ የሚታይ ከፍተኛ ጥራት ያለው ባነር ምስል (16:9) ያስገቡ።'
                  : 'Upload a high-resolution banner image (16:9, PNG/JPG/WebP up to 10MB) to display on the public landing page hero section.'
              }
              placeholder="/images/hero/network-abstract.jpg"
              disabled={disabled || updateBatch.isPending}
              aspectRatio="banner"
            />
          </CardContent>
        </Card>
      )}

      {/* 3. VALUE PILLS CRUD */}
      {activeTab === 'valuePills' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{locale === 'am' ? 'የእሴት ጥቆማዎች' : 'Value Proposition Pills'}</CardTitle>
              <CardDescription>
                {locale === 'am'
                  ? 'ከHero ክፍል በታች ያሉትን የደመቁ ካርዶች ያስተዳድሩ።'
                  : 'Manage the highlight cards below the hero section.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingPill({
                  id: '',
                  title: '',
                  description: '',
                  icon: 'Clock',
                  displayOrder: valuePills.length + 1,
                  isActive: true,
                });
                setPillDialogOpen(true);
              }}
              disabled={disabled || updateBatch.isPending}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {locale === 'am' ? '+ እሴት ጨምር' : 'Add Value Pill'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {valuePills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === 'am' ? 'ምንም የእሴት ጥቆማዎች አልተመዘገቡም።' : 'No value pills registered.'}
              </p>
            ) : (
              <div className="space-y-3">
                {valuePills
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((pill) => (
                    <div
                      key={pill.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          {renderIcon(pill.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {translateCmsText(pill.title, locale)}
                            </h4>
                            <Badge
                              variant={pill.isActive ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {pill.isActive
                                ? locale === 'am'
                                  ? 'ንቁ'
                                  : 'Active'
                                : locale === 'am'
                                  ? 'ቦዝኗል'
                                  : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'} {pill.displayOrder}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {translateCmsText(pill.description, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPill(pill);
                            setPillDialogOpen(true);
                          }}
                          disabled={disabled || updateBatch.isPending}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletePillId(pill.id)}
                          disabled={disabled || updateBatch.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. WHY CHOOSE US CRUD */}
      {activeTab === 'whyChooseUs' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{locale === 'am' ? 'ለምን መረጡን ካርዶች' : 'Why Choose Us Cards'}</CardTitle>
              <CardDescription>
                {locale === 'am'
                  ? 'ተቋማዊ ጥቅሞች እና በአካዳሚው ለመማር የሚረዱ ምክንያቶች።'
                  : 'Institutional advantages and reasons to learn at the academy.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingWhy({
                  id: '',
                  title: '',
                  description: '',
                  icon: 'ShieldCheck',
                  displayOrder: whyChooseUs.length + 1,
                  isActive: true,
                });
                setWhyDialogOpen(true);
              }}
              disabled={disabled || updateBatch.isPending}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {locale === 'am' ? '+ ካርድ ጨምር' : 'Add Card'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {whyChooseUs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === 'am' ? 'ምንም ካርዶች አልተመዘገቡም።' : 'No cards registered.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {whyChooseUs
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-1/15 text-chart-1">
                          {renderIcon(item.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {translateCmsText(item.title, locale)}
                            </h4>
                            <Badge
                              variant={item.isActive ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {item.isActive
                                ? locale === 'am'
                                  ? 'ንቁ'
                                  : 'Active'
                                : locale === 'am'
                                  ? 'ቦዝኗል'
                                  : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {translateCmsText(item.description, locale)}
                          </p>
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'} {item.displayOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWhy(item);
                            setWhyDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteWhyId(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. HOW IT WORKS CRUD */}
      {activeTab === 'howItWorks' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>
                {locale === 'am'
                  ? 'የትምህርት መዋቅር (እንዴት እንደሚሰራ)'
                  : 'The Learning Framework (How It Works)'}
              </CardTitle>
              <CardDescription>
                {locale === 'am'
                  ? 'በመነሻ ገጽ ላይ የሚታይ ደረጃ በደረጃ የትምህርት መንገድ።'
                  : 'Step-by-step roadmap displayed on the landing page.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingHow({
                  id: '',
                  stepNumber: String(howItWorks.length + 1).padStart(2, '0'),
                  title: '',
                  description: '',
                  icon: 'Sparkles',
                  displayOrder: howItWorks.length + 1,
                  isActive: true,
                });
                setHowDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {locale === 'am' ? '+ ደረጃ ጨምር' : 'Add Step'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-brand">{step.stepNumber}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                              setEditingHow(step);
                              setHowDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteHowId(step.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="mt-2 font-semibold text-foreground">
                        {translateCmsText(step.title, locale)}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {translateCmsText(step.description, locale)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                      <span>
                        {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'} {step.displayOrder}
                      </span>
                      <Badge
                        variant={step.isActive ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {step.isActive
                          ? locale === 'am'
                            ? 'ንቁ'
                            : 'Active'
                          : locale === 'am'
                            ? 'ቦዝኗል'
                            : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. FEATURED COURSES & CATEGORIES */}
      {activeTab === 'featured' && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'am' ? 'የተመረጡ ኮርሶች ክፍል' : 'Featured Courses Section'}</CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'የሚታዩትን የኮርሶች ብዛት ይቆጣጠራል።'
                : 'Controls presentation limits. Courses displayed are sourced directly from the database.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  {locale === 'am' ? 'የተመረጡ ኮርሶች ክፍልን አንቅ' : 'Enable Featured Courses Section'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am'
                    ? 'በመነሻ ገጽ ላይ የተመረጡ ኮርሶችን አሳይ።'
                    : 'Display the featured courses grid on the landing page.'}
                </p>
              </div>
              <Switch
                checked={featuredCourses.enabled}
                onCheckedChange={(checked) =>
                  setFeaturedCourses((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="courseLimit">
                {locale === 'am' ? 'ከፍተኛው የሚታዩ ኮርሶች ብዛት' : 'Maximum Courses Displayed'}
              </Label>
              <Input
                id="courseLimit"
                type="number"
                min={1}
                max={24}
                value={featuredCourses.limit}
                onChange={(e) =>
                  setFeaturedCourses((prev) => ({ ...prev, limit: Number(e.target.value) }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'am' ? 'የምድቦች ክፍል' : 'Categories Section'}</CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'የምድብ ገደቦችን ይቆጣጠራል። ንቁ ኮርሶች ያሏቸው ምድቦች ከዳታቤዝ ይሰላሉ።'
                : 'Controls category limits. Real categories with active course counts are automatically calculated from the database.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  {locale === 'am' ? 'የምድቦች ክፍልን አንቅ' : 'Enable Categories Section'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am'
                    ? 'የምድብ ካርዶችን በመነሻ ገጽ ላይ አሳይ።'
                    : 'Display the category exploration cards.'}
                </p>
              </div>
              <Switch
                checked={categories.enabled}
                onCheckedChange={(checked) =>
                  setCategories((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="catLimit">
                {locale === 'am' ? 'ከፍተኛው የሚታዩ ምድቦች ብዛት' : 'Maximum Categories Displayed'}
              </Label>
              <Input
                id="catLimit"
                type="number"
                min={1}
                max={24}
                value={categories.limit}
                onChange={(e) =>
                  setCategories((prev) => ({ ...prev, limit: Number(e.target.value) }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. MENTOR SPOTLIGHT */}
      {activeTab === 'mentor' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'am' ? 'አስተማሪዎች / መሪ መምህር' : 'Mentor / Instructor Spotlight'}
            </CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'የመሪ መምህሩን ፎቶ፣ ስም፣ ርዕስ፣ መግለጫ እና ስኬቶች በመነሻ ገጽ ላይ ያሳያል።'
                : 'Showcases the lead mentor/instructor photo, name, title, bio, and achievements on the landing page.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  {locale === 'am' ? 'የአስተማሪዎች ክፍልን አንቅ' : 'Enable Mentor Spotlight'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am'
                    ? 'የአስተማሪውን መገለጫ በመነሻ ገጽ ላይ አሳይ።'
                    : 'Display the instructor profile banner on the homepage.'}
                </p>
              </div>
              <Switch
                checked={mentor.enabled}
                onCheckedChange={(checked) => setMentor((prev) => ({ ...prev, enabled: checked }))}
                disabled={disabled || updateBatch.isPending}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentorName">
                    {locale === 'am' ? 'የአስተማሪው ሙሉ ስም' : 'Mentor Full Name'}
                  </Label>
                  <Input
                    id="mentorName"
                    value={mentor.name ?? ''}
                    onChange={(e) => setMentor((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Joel Talargie"
                    disabled={disabled || updateBatch.isPending}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {locale === 'am'
                      ? 'ባዶ ከተውት በዳታቤዝ ውስጥ ያለውን ነባሪ የአስተማሪ ስም ይጠቀማል።'
                      : 'Leave blank to automatically use the default instructor name from the database.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentorHeadline">
                    {locale === 'am' ? 'ርዕስ / ንዑስ ርዕስ' : 'Title / Subtitle'}
                  </Label>
                  <Input
                    id="mentorHeadline"
                    value={mentor.headline ?? ''}
                    onChange={(e) => setMentor((prev) => ({ ...prev, headline: e.target.value }))}
                    placeholder="e.g. Founder & Lead Instructor at Joel Talargie Academy"
                    disabled={disabled || updateBatch.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentorBio">
                    {locale === 'am' ? 'ስለ አስተማሪው / መግለጫ' : 'Bio / Profile Description'}
                  </Label>
                  <Textarea
                    id="mentorBio"
                    rows={4}
                    value={mentor.bio ?? ''}
                    onChange={(e) => setMentor((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Detailed bio text highlighting experience, teaching focus, and background..."
                    disabled={disabled || updateBatch.isPending}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploadField
                  id="mentorPhoto"
                  label={locale === 'am' ? 'የአስተማሪው ፎቶ / አቫታር' : 'Mentor Photo / Avatar Image'}
                  description={
                    locale === 'am'
                      ? 'ፎቶ ይስቀሉ ወይም የኢሜጅ URL ያስገቡ።'
                      : 'Upload a photo or provide an image URL. Square ratio recommended.'
                  }
                  value={mentor.photoUrl ?? ''}
                  onChange={(url) => setMentor((prev) => ({ ...prev, photoUrl: url }))}
                  aspectRatio="square"
                  placeholder="/images/instructors/joel-talargie.png"
                  disabled={disabled || updateBatch.isPending}
                />

                <div className="space-y-2">
                  <Label htmlFor="mentorAchievements">
                    {locale === 'am'
                      ? 'ዋና ዋና ስኬቶች (በእያንዳንዱ መስመር አንድ)'
                      : 'Key Achievements (One per line)'}
                  </Label>
                  <Textarea
                    id="mentorAchievements"
                    rows={4}
                    value={(mentor.achievements ?? []).join('\n')}
                    onChange={(e) =>
                      setMentor((prev) => ({
                        ...prev,
                        achievements: e.target.value.split('\n'),
                      }))
                    }
                    placeholder="Over 10+ years of software engineering leadership&#10;Curriculum designed for career promotion&#10;Trained thousands of engineers"
                    disabled={disabled || updateBatch.isPending}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {locale === 'am'
                      ? 'እያንዳንዱ መስመር በአስተማሪው ካርድ ላይ ነጥብ ሆኖ ይታያል።'
                      : 'Each line will be displayed as a checkmark bullet point on the mentor card.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. PLATFORM STATISTICS */}
      {activeTab === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'am' ? 'የሲስተም ስታቲስቲክስ ማዋቀሪያ' : 'Platform Statistics Configuration'}
            </CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'የተማሪዎች፣ ኮርሶች እና ደረጃዎች ብዛት በቀጥታ ከዳታቤዝ ይሰላሉ። የስም እና የተራ ቁጥር ማስተካከያ ያድርጉ።'
                : 'Numerical metrics (students, courses, enrollments, ratings) are calculated live from the database.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">
                  {locale === 'am' ? 'የስታቲስቲክስ ክፍልን አንቅ' : 'Enable Statistics Band'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am'
                    ? 'በመነሻ ገጽ ላይ የስታቲስቲክስ ባነር አሳይ።'
                    : 'Show metrics bar on homepage.'}
                </p>
              </div>
              <Switch
                checked={statistics.enabled}
                onCheckedChange={(checked) =>
                  setStatistics((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === 'am' ? 'የመለኪያ ስሞች እና ተራ ቁጥር' : 'Metric Labels & Ordering'}
              </Label>
              <div className="space-y-3">
                {statistics.items.map((stat, idx) => (
                  <div
                    key={stat.key}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {stat.key}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {locale === 'am'
                            ? '(ከእውነተኛ ዳታቤዝ መዝገቦች የተሰላ)'
                            : '(Calculated from real DB records)'}
                        </span>
                      </div>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const currentItem = statistics.items[idx];
                          if (currentItem) {
                            const updated = [...statistics.items];
                            updated[idx] = { ...currentItem, label: e.target.value };
                            setStatistics((prev) => ({ ...prev, items: updated }));
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`order-${stat.key}`} className="text-xs">
                          {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'}
                        </Label>
                        <Input
                          id={`order-${stat.key}`}
                          type="number"
                          value={stat.displayOrder}
                          onChange={(e) => {
                            const currentItem = statistics.items[idx];
                            if (currentItem) {
                              const updated = [...statistics.items];
                              updated[idx] = {
                                ...currentItem,
                                displayOrder: Number(e.target.value),
                              };
                              setStatistics((prev) => ({ ...prev, items: updated }));
                            }
                          }}
                          className="w-16"
                        />
                      </div>
                      <Switch
                        checked={stat.isEnabled}
                        onCheckedChange={(checked) => {
                          const currentItem = statistics.items[idx];
                          if (currentItem) {
                            const updated = [...statistics.items];
                            updated[idx] = { ...currentItem, isEnabled: checked };
                            setStatistics((prev) => ({ ...prev, items: updated }));
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 9. TESTIMONIALS CRUD */}
      {activeTab === 'testimonials' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{locale === 'am' ? 'የተማሪዎች ምስክርነት' : 'Learner Testimonials'}</CardTitle>
              <CardDescription>
                {locale === 'am'
                  ? 'የተማሪዎችን አስተያየት ያስተዳድሩ። ንቁ ምስክርነቶች ብቻ በመነሻ ገጽ ላይ ይታያሉ።'
                  : 'Manage authentic student feedback. Only active testimonials appear on the public landing page.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingTestimonial({
                  id: '',
                  studentName: '',
                  avatarUrl: '',
                  testimonial: '',
                  rating: 5,
                  courseTitle: '',
                  isFeatured: true,
                  displayOrder: testimonials.length + 1,
                  isActive: true,
                });
                setTestimonialDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {locale === 'am' ? '+ ምስክርነት ጨምር' : 'Add Testimonial'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {testimonials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === 'am' ? 'ምንም ምስክርነቶች አልተመዘገቡም።' : 'No testimonials registered.'}
              </p>
            ) : (
              <div className="space-y-3">
                {testimonials
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.studentName}
                            className="size-10 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : null}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{item.studentName}</h4>
                            <span className="flex items-center text-amber-400">
                              {Array.from({ length: item.rating }).map((_, i) => (
                                <Star key={i} className="size-3 fill-current" />
                              ))}
                            </span>
                            <Badge
                              variant={item.isActive ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {item.isActive
                                ? locale === 'am'
                                  ? 'ንቁ'
                                  : 'Active'
                                : locale === 'am'
                                  ? 'ቦዝኗል'
                                  : 'Inactive'}
                            </Badge>
                            {item.isFeatured && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-brand border-brand/30"
                              >
                                {locale === 'am' ? 'የተመረጠ' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium text-brand">{item.courseTitle}</p>
                          <p className="text-xs text-muted-foreground italic">
                            &ldquo;{translateCmsText(item.testimonial, locale)}&rdquo;
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'} {item.displayOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTestimonial(item);
                            setTestimonialDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTestimonialId(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 10. FAQ CRUD */}
      {activeTab === 'faq' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>
                {locale === 'am' ? 'ተደጋጋሚ ጥያቄዎች' : 'Frequently Asked Questions'}
              </CardTitle>
              <CardDescription>
                {locale === 'am'
                  ? 'በመነሻ ገጽ ላይ የሚታዩ ተደጋጋሚ ጥያቄዎችን እና መልሶችን ያስተዳድሩ።'
                  : 'Manage the accordion FAQs displayed on the public landing page.'}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingFaq({
                  id: '',
                  question: '',
                  answer: '',
                  category: 'General',
                  displayOrder: faqs.length + 1,
                  isActive: true,
                });
                setFaqDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {locale === 'am' ? '+ ጥያቄ ጨምር' : 'Add FAQ'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === 'am' ? 'ምንም ጥያቄዎች አልተመዘገቡም።' : 'No FAQs registered.'}
              </p>
            ) : (
              <div className="space-y-3">
                {faqs
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            {translateCmsText(item.question, locale)}
                          </h4>
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                          <Badge
                            variant={item.isActive ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {item.isActive
                              ? locale === 'am'
                                ? 'ንቁ'
                                : 'Active'
                              : locale === 'am'
                                ? 'ቦዝኗል'
                                : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {translateCmsText(item.answer, locale)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {locale === 'am' ? 'ተራ ቁጥር:' : 'Order:'} {item.displayOrder}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFaq(item);
                            setFaqDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteFaqId(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 11. FINAL CTA */}
      {activeTab === 'finalCta' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'am' ? 'የመጨረሻ ጥሪ ባነር' : 'Final Call to Action Banner'}
            </CardTitle>
            <CardDescription>
              {locale === 'am'
                ? 'በመነሻ ገጽ ታችኛው ክፍል ላይ የሚታይ የምዝገባ ባነር።'
                : 'Bottom enrollment banner on the landing page.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ctaHeading">{locale === 'am' ? 'ርዕስ' : 'Heading'}</Label>
              <Input
                id="ctaHeading"
                value={finalCta.heading}
                onChange={(e) => setFinalCta((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="Ready to Start?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaDesc">Description</Label>
              <Textarea
                id="ctaDesc"
                rows={3}
                value={finalCta.description}
                onChange={(e) => setFinalCta((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Join for free and get access..."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ctaButtonText">CTA Button Label</Label>
                <Input
                  id="ctaButtonText"
                  value={finalCta.ctaText}
                  onChange={(e) => setFinalCta((prev) => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Start Learning Today"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">CTA Destination URL</Label>
                <Input
                  id="ctaUrl"
                  value={finalCta.ctaUrl}
                  onChange={(e) => setFinalCta((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  placeholder="/auth/register"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Save Bar */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {locale === 'am'
            ? 'ለውጦችን ማስቀመጥ በመነሻ ገጽ ላይ ወዲያውኑ ይንጸባረቃል።'
            : 'Saving updates will instantly refresh the dynamic content on /.'}
        </p>
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={disabled || updateBatch.isPending}
          className="min-w-36 gap-2"
        >
          {updateBatch.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {locale === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving CMS...'}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {locale === 'am' ? 'የመነሻ ገጽ CMS አስቀምጥ' : 'Save Landing CMS'}
            </>
          )}
        </Button>
      </div>

      {/* Value Pill Add/Edit Dialog */}
      <Dialog open={pillDialogOpen} onOpenChange={setPillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPill?.id
                ? locale === 'am'
                  ? 'የእሴት ጥቆማን አዘጋጅ'
                  : 'Edit Value Pill'
                : locale === 'am'
                  ? 'አዲስ እሴት ጥቆማ ጨምር'
                  : 'Add Value Pill'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'am'
                ? 'ርዕስ፣ መግለጫ፣ አይኮን እና የተራ ቁጥር ያዋቅሩ።'
                : 'Configure headline, description, icon and display order.'}
            </DialogDescription>
          </DialogHeader>
          {editingPill && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pillTitle">{locale === 'am' ? 'ርዕስ' : 'Title'}</Label>
                <Input
                  id="pillTitle"
                  value={editingPill.title}
                  onChange={(e) => setEditingPill({ ...editingPill, title: e.target.value })}
                  placeholder="e.g. Verified Credentials"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pillDesc">{locale === 'am' ? 'መግለጫ' : 'Description'}</Label>
                <Textarea
                  id="pillDesc"
                  rows={2}
                  value={editingPill.description}
                  onChange={(e) => setEditingPill({ ...editingPill, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pillIcon">{locale === 'am' ? 'አይኮን' : 'Icon'}</Label>
                  <Select
                    value={editingPill.icon}
                    onValueChange={(val) => setEditingPill({ ...editingPill, icon: val })}
                  >
                    <SelectTrigger id="pillIcon">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            {renderIcon(iconName)}
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pillOrder">{locale === 'am' ? 'ተራ ቁጥር' : 'Display Order'}</Label>
                  <Input
                    id="pillOrder"
                    type="number"
                    value={editingPill.displayOrder}
                    onChange={(e) =>
                      setEditingPill({ ...editingPill, displayOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="pillActive" className="text-sm">
                  {locale === 'am' ? 'ንቁ' : 'Active'}
                </Label>
                <Switch
                  id="pillActive"
                  checked={editingPill.isActive}
                  onCheckedChange={(checked) =>
                    setEditingPill({ ...editingPill, isActive: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPillDialogOpen(false)}>
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingPill && handleSavePill(editingPill)}
              disabled={!editingPill?.title.trim()}
            >
              {locale === 'am' ? 'እሴት አስቀምጥ' : 'Save Pill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Why Choose Us Add/Edit Dialog */}
      <Dialog open={whyDialogOpen} onOpenChange={setWhyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWhy?.id
                ? locale === 'am'
                  ? 'የለምን መረጡን ካርድ አዘጋጅ'
                  : 'Edit Why Choose Us Card'
                : locale === 'am'
                  ? 'አዲስ ካርድ ጨምር'
                  : 'Add Why Choose Us Card'}
            </DialogTitle>
          </DialogHeader>
          {editingWhy && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whyTitle">{locale === 'am' ? 'ርዕስ' : 'Title'}</Label>
                <Input
                  id="whyTitle"
                  value={editingWhy.title}
                  onChange={(e) => setEditingWhy({ ...editingWhy, title: e.target.value })}
                  placeholder="e.g. Vetted Instructors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whyDesc">{locale === 'am' ? 'መግለጫ' : 'Description'}</Label>
                <Textarea
                  id="whyDesc"
                  rows={2}
                  value={editingWhy.description}
                  onChange={(e) => setEditingWhy({ ...editingWhy, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whyIcon">{locale === 'am' ? 'አይኮን' : 'Icon'}</Label>
                  <Select
                    value={editingWhy.icon}
                    onValueChange={(val) => setEditingWhy({ ...editingWhy, icon: val })}
                  >
                    <SelectTrigger id="whyIcon">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            {renderIcon(iconName)}
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whyOrder">{locale === 'am' ? 'ተራ ቁጥር' : 'Display Order'}</Label>
                  <Input
                    id="whyOrder"
                    type="number"
                    value={editingWhy.displayOrder}
                    onChange={(e) =>
                      setEditingWhy({ ...editingWhy, displayOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="whyActive" className="text-sm">
                  {locale === 'am' ? 'ንቁ' : 'Active'}
                </Label>
                <Switch
                  id="whyActive"
                  checked={editingWhy.isActive}
                  onCheckedChange={(checked) => setEditingWhy({ ...editingWhy, isActive: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhyDialogOpen(false)}>
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingWhy && handleSaveWhy(editingWhy)}
              disabled={!editingWhy?.title.trim()}
            >
              {locale === 'am' ? 'ካርድ አስቀምጥ' : 'Save Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How It Works Add/Edit Dialog */}
      <Dialog open={howDialogOpen} onOpenChange={setHowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHow?.id
                ? locale === 'am'
                  ? 'ደረጃ አዘጋጅ'
                  : 'Edit Step'
                : locale === 'am'
                  ? 'አዲስ ደረጃ ጨምር'
                  : 'Add Step'}
            </DialogTitle>
          </DialogHeader>
          {editingHow && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="howStepNum">{locale === 'am' ? 'ደረጃ ቁጥር' : 'Step Number'}</Label>
                  <Input
                    id="howStepNum"
                    value={editingHow.stepNumber}
                    onChange={(e) => setEditingHow({ ...editingHow, stepNumber: e.target.value })}
                    placeholder="01"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="howTitle">{locale === 'am' ? 'የደረጃ ርዕስ' : 'Step Title'}</Label>
                  <Input
                    id="howTitle"
                    value={editingHow.title}
                    onChange={(e) => setEditingHow({ ...editingHow, title: e.target.value })}
                    placeholder="e.g. Create an account"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="howDesc">{locale === 'am' ? 'መግለጫ' : 'Description'}</Label>
                <Textarea
                  id="howDesc"
                  rows={2}
                  value={editingHow.description}
                  onChange={(e) => setEditingHow({ ...editingHow, description: e.target.value })}
                  placeholder="Description of this step..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="howOrder">{locale === 'am' ? 'ተራ ቁጥር' : 'Display Order'}</Label>
                  <Input
                    id="howOrder"
                    type="number"
                    value={editingHow.displayOrder}
                    onChange={(e) =>
                      setEditingHow({ ...editingHow, displayOrder: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 mt-6">
                  <Label htmlFor="howActive" className="text-sm">
                    {locale === 'am' ? 'ንቁ' : 'Active'}
                  </Label>
                  <Switch
                    id="howActive"
                    checked={editingHow.isActive}
                    onCheckedChange={(checked) =>
                      setEditingHow({ ...editingHow, isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHowDialogOpen(false)}>
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingHow && handleSaveHow(editingHow)}
              disabled={!editingHow?.title.trim()}
            >
              {locale === 'am' ? 'ደረጃ አስቀምጥ' : 'Save Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Add/Edit Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial?.id
                ? locale === 'am'
                  ? 'ምስክርነት አዘጋጅ'
                  : 'Edit Testimonial'
                : locale === 'am'
                  ? 'አዲስ ምስክርነት ጨምር'
                  : 'Add Testimonial'}
            </DialogTitle>
          </DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testName">{locale === 'am' ? 'የተማሪ ስም' : 'Student Name'}</Label>
                  <Input
                    id="testName"
                    value={editingTestimonial.studentName}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, studentName: e.target.value })
                    }
                    placeholder="e.g. Abebe Kebede"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testCourse">
                    {locale === 'am' ? 'የተጠናቀቀው ኮርስ' : 'Course Completed'}
                  </Label>
                  <Input
                    id="testCourse"
                    value={editingTestimonial.courseTitle}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, courseTitle: e.target.value })
                    }
                    placeholder="e.g. Full-Stack Web Development"
                  />
                </div>
              </div>
              <ImageUploadField
                id="testAvatar"
                label={locale === 'am' ? 'የተማሪ ፎቶ / አቫታር' : 'Student Avatar / Profile Photo'}
                description={
                  locale === 'am'
                    ? 'ፎቶ ይስቀሉ ወይም የኢሜጅ URL ያስገቡ።'
                    : 'Upload a photo or enter image URL for the student avatar.'
                }
                value={editingTestimonial.avatarUrl ?? ''}
                onChange={(url) => setEditingTestimonial({ ...editingTestimonial, avatarUrl: url })}
                aspectRatio="square"
                placeholder="/images/students/avatar.png"
              />
              <div className="space-y-2">
                <Label htmlFor="testContent">
                  {locale === 'am' ? 'የምስክርነት ጽሑፍ' : 'Testimonial Text'}
                </Label>
                <Textarea
                  id="testContent"
                  rows={3}
                  value={editingTestimonial.testimonial}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, testimonial: e.target.value })
                  }
                  placeholder="Student review quote..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testRating">
                    {locale === 'am' ? 'ደረጃ (ከ1 እስከ 5 ኮከብ)' : 'Rating (1 to 5 Stars)'}
                  </Label>
                  <Select
                    value={String(editingTestimonial.rating)}
                    onValueChange={(val) =>
                      setEditingTestimonial({ ...editingTestimonial, rating: Number(val) })
                    }
                  >
                    <SelectTrigger id="testRating">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 ኮከብ ★★★★★</SelectItem>
                      <SelectItem value="4">4 ኮከብ ★★★★☆</SelectItem>
                      <SelectItem value="3">3 ኮከብ ★★★☆☆</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testOrder">{locale === 'am' ? 'ተራ ቁጥር' : 'Display Order'}</Label>
                  <Input
                    id="testOrder"
                    type="number"
                    value={editingTestimonial.displayOrder}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        displayOrder: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="testFeatured" className="text-sm">
                    {locale === 'am' ? 'የተመረጠ' : 'Featured'}
                  </Label>
                  <Switch
                    id="testFeatured"
                    checked={editingTestimonial.isFeatured}
                    onCheckedChange={(checked) =>
                      setEditingTestimonial({ ...editingTestimonial, isFeatured: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="testActive" className="text-sm">
                    {locale === 'am' ? 'ንቁ' : 'Active'}
                  </Label>
                  <Switch
                    id="testActive"
                    checked={editingTestimonial.isActive}
                    onCheckedChange={(checked) =>
                      setEditingTestimonial({ ...editingTestimonial, isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestimonialDialogOpen(false)}>
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingTestimonial && handleSaveTestimonial(editingTestimonial)}
              disabled={
                !editingTestimonial?.studentName.trim() || !editingTestimonial?.testimonial.trim()
              }
            >
              {locale === 'am' ? 'ምስክርነት አስቀምጥ' : 'Save Testimonial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Add/Edit Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFaq?.id
                ? locale === 'am'
                  ? 'ጥያቄ አዘጋጅ'
                  : 'Edit FAQ'
                : locale === 'am'
                  ? 'አዲስ ጥያቄ ጨምር'
                  : 'Add FAQ'}
            </DialogTitle>
          </DialogHeader>
          {editingFaq && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faqQuestion">{locale === 'am' ? 'ጥያቄ' : 'Question'}</Label>
                <Input
                  id="faqQuestion"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. Are the courses self-paced?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faqAnswer">{locale === 'am' ? 'መልስ' : 'Answer'}</Label>
                <Textarea
                  id="faqAnswer"
                  rows={3}
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Detailed answer..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faqCategory">{locale === 'am' ? 'ምድብ' : 'Category'}</Label>
                  <Input
                    id="faqCategory"
                    value={editingFaq.category}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    placeholder="e.g. General, Certificates, Payments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faqOrder">{locale === 'am' ? 'ተራ ቁጥር' : 'Display Order'}</Label>
                  <Input
                    id="faqOrder"
                    type="number"
                    value={editingFaq.displayOrder}
                    onChange={(e) =>
                      setEditingFaq({ ...editingFaq, displayOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="faqActive" className="text-sm">
                  {locale === 'am' ? 'ንቁ' : 'Active'}
                </Label>
                <Switch
                  id="faqActive"
                  checked={editingFaq.isActive}
                  onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, isActive: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingFaq && handleSaveFaq(editingFaq)}
              disabled={!editingFaq?.question.trim() || !editingFaq?.answer.trim()}
            >
              {locale === 'am' ? 'ጥያቄ አስቀምጥ' : 'Save FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        open={Boolean(deletePillId)}
        onOpenChange={(open) => !open && setDeletePillId(null)}
        title={locale === 'am' ? 'የእሴት ጥቆማን አስወግድ' : 'Delete Value Proposition'}
        description={
          locale === 'am'
            ? 'ይህንን የእሴት ጥቆማ ከመነሻ ገጽ ላይ ለማስወገድ እርግጠኛ ነዎት?'
            : 'Are you sure you want to remove this value proposition pill from the landing page?'
        }
        onConfirm={() => {
          if (deletePillId) handleDeletePill(deletePillId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteWhyId)}
        onOpenChange={(open) => !open && setDeleteWhyId(null)}
        title={locale === 'am' ? 'ካርድ አስወግድ' : 'Delete Why Choose Us Card'}
        description={
          locale === 'am'
            ? 'ይህንን ካርድ ለማስወገድ እርግጠኛ ነዎት?'
            : 'Are you sure you want to remove this card?'
        }
        onConfirm={() => {
          if (deleteWhyId) handleDeleteWhy(deleteWhyId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteHowId)}
        onOpenChange={(open) => !open && setDeleteHowId(null)}
        title={locale === 'am' ? 'የትምህርት ደረጃ አስወግድ' : 'Delete Learning Step'}
        description={
          locale === 'am'
            ? 'ይህንን የመዋቅር ደረጃ ለማስወገድ እርግጠኛ ነዎት?'
            : 'Are you sure you want to remove this framework step?'
        }
        onConfirm={() => {
          if (deleteHowId) handleDeleteHow(deleteHowId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTestimonialId)}
        onOpenChange={(open) => !open && setDeleteTestimonialId(null)}
        title={locale === 'am' ? 'ምስክርነት አስወግድ' : 'Delete Testimonial'}
        description={
          locale === 'am'
            ? 'ይህንን ምስክርነት ለማስወገድ እርግጠኛ ነዎት?'
            : 'Are you sure you want to permanently remove this testimonial?'
        }
        onConfirm={() => {
          if (deleteTestimonialId) handleDeleteTestimonial(deleteTestimonialId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteFaqId)}
        onOpenChange={(open) => !open && setDeleteFaqId(null)}
        title={locale === 'am' ? 'ጥያቄ አስወግድ' : 'Delete FAQ'}
        description={
          locale === 'am'
            ? 'ይህንን ጥያቄ ለማስወገድ እርግጠኛ ነዎት?'
            : 'Are you sure you want to remove this FAQ item?'
        }
        onConfirm={() => {
          if (deleteFaqId) handleDeleteFaq(deleteFaqId);
        }}
      />
    </div>
  );
}
