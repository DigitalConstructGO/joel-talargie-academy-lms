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

export function LandingCmsManager({
  initialData,
  disabled = false,
}: {
  initialData: StructuredAcademySettings;
  disabled?: boolean;
}) {
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
    initialData.mentor ?? { enabled: true, featuredInstructorId: null },
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
  const [activeTab, setActiveTab] = useState<
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
    | 'finalCta'
  >('sections');

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
  function handleSaveTestimonial(item: TestimonialItem) {
    if (editingTestimonial && editingTestimonial.id) {
      setTestimonials((prev) => prev.map((t) => (t.id === item.id ? item : t)));
    } else {
      const newItem = { ...item, id: `test-${Date.now()}` };
      setTestimonials((prev) => [...prev, newItem]);
    }
    setTestimonialDialogOpen(false);
    setEditingTestimonial(null);
  }

  function handleDeleteTestimonial(id: string) {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    setDeleteTestimonialId(null);
    toast.success('Testimonial removed');
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
          { id: 'sections', label: 'Section Control', icon: Layout },
          { id: 'hero', label: 'Hero', icon: Sparkles },
          { id: 'valuePills', label: 'Value Pills', icon: Layers },
          { id: 'whyChooseUs', label: 'Why Choose Us', icon: ShieldCheck },
          { id: 'howItWorks', label: 'How It Works', icon: ListOrdered },
          { id: 'featured', label: 'Featured Courses', icon: GraduationCap },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'mentor', label: 'Mentor Spotlight', icon: Users },
          { id: 'stats', label: 'Platform Statistics', icon: Target },
          { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'finalCta', label: 'Final CTA', icon: Zap },
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
            <CardTitle>Landing Page Section Visibility</CardTitle>
            <CardDescription>
              Enable or disable public sections on the academy homepage. Disabled sections are
              omitted by the backend API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: 'hero', label: 'Hero Header & Search', desc: 'Main headline, CTAs & search' },
                { key: 'valuePills', label: 'Value Propositions', desc: 'Top value highlight pills' },
                { key: 'whyChooseUs', label: 'Why Choose Us', desc: 'Core institutional strengths' },
                { key: 'howItWorks', label: 'The Learning Framework', desc: '4-step student roadmap' },
                { key: 'featuredCourses', label: 'Featured Courses', desc: 'Real DB courses marked featured' },
                { key: 'categories', label: 'Browse Categories', desc: 'Active categories & course counts' },
                { key: 'mentor', label: 'Mentor Spotlight', desc: 'Featured instructor profile' },
                { key: 'stats', label: 'Platform Statistics', desc: 'Live students, courses & ratings' },
                { key: 'pricing', label: 'Pricing Preview', desc: 'Free & paid course tiers' },
                { key: 'testimonials', label: 'Learner Testimonials', desc: 'Student reviews carousel' },
                { key: 'certificateVerify', label: 'Verify Certificate', desc: 'Public QR verification lookup' },
                { key: 'faq', label: 'Frequently Asked Questions', desc: 'Accordion FAQ preview' },
                { key: 'finalCta', label: 'Final Call to Action', desc: 'Bottom enrollment banner' },
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
            <CardTitle>Hero Section Configuration</CardTitle>
            <CardDescription>Main public landing header, search, and call to action buttons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroHeading">Main Headline</Label>
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
              <Label htmlFor="heroDescription">Hero Subtitle / Description</Label>
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
                <Label htmlFor="primaryCtaText">Primary CTA Button Label</Label>
                <Input
                  id="primaryCtaText"
                  value={hero.primaryCtaText}
                  onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaText: e.target.value }))}
                  placeholder="Explore Courses"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryCtaUrl">Primary CTA URL</Label>
                <Input
                  id="primaryCtaUrl"
                  value={hero.primaryCtaUrl}
                  onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaUrl: e.target.value }))}
                  placeholder="/courses"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryCtaText">Secondary CTA Button Label</Label>
                <Input
                  id="secondaryCtaText"
                  value={hero.secondaryCtaText}
                  onChange={(e) => setHero((prev) => ({ ...prev, secondaryCtaText: e.target.value }))}
                  placeholder="Create Account"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryCtaUrl">Secondary CTA URL</Label>
                <Input
                  id="secondaryCtaUrl"
                  value={hero.secondaryCtaUrl}
                  onChange={(e) => setHero((prev) => ({ ...prev, secondaryCtaUrl: e.target.value }))}
                  placeholder="/auth/register"
                  disabled={disabled || updateBatch.isPending}
                />
              </div>
            </div>

            <ImageUploadField
              id="heroImageUrl"
              label="Hero Image / Background Asset"
              value={hero.heroImageUrl}
              onChange={(url) => setHero((prev) => ({ ...prev, heroImageUrl: url }))}
              description="Upload a high-resolution banner image (16:9, PNG/JPG/WebP up to 10MB) to display on the public landing page hero section."
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
              <CardTitle>Value Proposition Pills</CardTitle>
              <CardDescription>Manage the highlight cards below the hero section.</CardDescription>
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
              Add Value Pill
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {valuePills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No value pills registered.</p>
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
                            <h4 className="font-semibold text-foreground">{pill.title}</h4>
                            <Badge variant={pill.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {pill.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              Order: {pill.displayOrder}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{pill.description}</p>
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
              <CardTitle>Why Choose Us Cards</CardTitle>
              <CardDescription>Institutional advantages and reasons to learn at the academy.</CardDescription>
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
              Add Card
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {whyChooseUs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cards registered.</p>
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
                            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                            <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          <p className="mt-2 text-[10px] text-muted-foreground">Order: {item.displayOrder}</p>
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
              <CardTitle>The Learning Framework (How It Works)</CardTitle>
              <CardDescription>Step-by-step roadmap displayed on the landing page.</CardDescription>
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
              Add Step
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
                      <h4 className="mt-2 font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                      <span>Order: {step.displayOrder}</span>
                      <Badge variant={step.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {step.isActive ? 'Active' : 'Inactive'}
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
            <CardTitle>Featured Courses Section</CardTitle>
            <CardDescription>
              Controls presentation limits. Courses displayed are sourced directly from the database
              where <code className="text-brand">isFeatured = true</code> and{' '}
              <code className="text-brand">visibility = &apos;PUBLIC&apos;</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Enable Featured Courses Section</Label>
                <p className="text-xs text-muted-foreground">Display the featured courses grid on the landing page.</p>
              </div>
              <Switch
                checked={featuredCourses.enabled}
                onCheckedChange={(checked) => setFeaturedCourses((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="courseLimit">Maximum Courses Displayed</Label>
              <Input
                id="courseLimit"
                type="number"
                min={1}
                max={24}
                value={featuredCourses.limit}
                onChange={(e) => setFeaturedCourses((prev) => ({ ...prev, limit: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Categories Section</CardTitle>
            <CardDescription>
              Controls category limits. Real categories with active course counts are automatically
              calculated from the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Enable Categories Section</Label>
                <p className="text-xs text-muted-foreground">Display the category exploration cards.</p>
              </div>
              <Switch
                checked={categories.enabled}
                onCheckedChange={(checked) => setCategories((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="catLimit">Maximum Categories Displayed</Label>
              <Input
                id="catLimit"
                type="number"
                min={1}
                max={24}
                value={categories.limit}
                onChange={(e) => setCategories((prev) => ({ ...prev, limit: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. MENTOR SPOTLIGHT */}
      {activeTab === 'mentor' && (
        <Card>
          <CardHeader>
            <CardTitle>Mentor / Instructor Spotlight</CardTitle>
            <CardDescription>
              Showcases the lead mentor (e.g. Joel Talargie) from the database on the landing page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Enable Mentor Spotlight</Label>
                <p className="text-xs text-muted-foreground">Display the instructor profile banner.</p>
              </div>
              <Switch
                checked={mentor.enabled}
                onCheckedChange={(checked) => setMentor((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="mentorSelect">Featured Instructor</Label>
              <p className="text-xs text-muted-foreground">
                Currently configured to automatically feature the Lead Instructor (Joel Talargie) from the database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. PLATFORM STATISTICS */}
      {activeTab === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics Configuration</CardTitle>
            <CardDescription>
              Numerical metrics (students, courses, enrollments, ratings) are calculated live from the
              database. Customize the display labels and ordering below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Enable Statistics Band</Label>
                <p className="text-xs text-muted-foreground">Show metrics bar on homepage.</p>
              </div>
              <Switch
                checked={statistics.enabled}
                onCheckedChange={(checked) => setStatistics((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metric Labels & Ordering
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
                          (Calculated from real DB records)
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
                          Order:
                        </Label>
                        <Input
                          id={`order-${stat.key}`}
                          type="number"
                          value={stat.displayOrder}
                          onChange={(e) => {
                            const currentItem = statistics.items[idx];
                            if (currentItem) {
                              const updated = [...statistics.items];
                              updated[idx] = { ...currentItem, displayOrder: Number(e.target.value) };
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
              <CardTitle>Learner Testimonials</CardTitle>
              <CardDescription>
                Manage authentic student feedback. Only active testimonials appear on the public landing page.
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
              Add Testimonial
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {testimonials.length === 0 ? (
              <p className="text-sm text-muted-foreground">No testimonials registered.</p>
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{item.studentName}</h4>
                          <span className="flex items-center text-amber-400">
                            {Array.from({ length: item.rating }).map((_, i) => (
                              <Star key={i} className="size-3 fill-current" />
                            ))}
                          </span>
                          <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {item.isFeatured && (
                            <Badge variant="outline" className="text-[10px] text-brand border-brand/30">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-brand">{item.courseTitle}</p>
                        <p className="text-xs text-muted-foreground italic">&ldquo;{item.testimonial}&rdquo;</p>
                        <p className="text-[10px] text-muted-foreground">Order: {item.displayOrder}</p>
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
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Manage the accordion FAQs displayed on the public landing page.</CardDescription>
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
              Add FAQ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No FAQs registered.</p>
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
                          <h4 className="font-semibold text-foreground">{item.question}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                          <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.answer}</p>
                        <p className="text-[10px] text-muted-foreground">Order: {item.displayOrder}</p>
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
            <CardTitle>Final Call to Action Banner</CardTitle>
            <CardDescription>Bottom enrollment banner on the landing page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ctaHeading">Heading</Label>
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
          Saving updates will instantly refresh the dynamic content on <span className="font-mono">/</span>.
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
              Saving CMS...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Landing CMS
            </>
          )}
        </Button>
      </div>

      {/* Value Pill Add/Edit Dialog */}
      <Dialog open={pillDialogOpen} onOpenChange={setPillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPill?.id ? 'Edit Value Pill' : 'Add Value Pill'}</DialogTitle>
            <DialogDescription>Configure headline, description, icon and display order.</DialogDescription>
          </DialogHeader>
          {editingPill && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pillTitle">Title</Label>
                <Input
                  id="pillTitle"
                  value={editingPill.title}
                  onChange={(e) => setEditingPill({ ...editingPill, title: e.target.value })}
                  placeholder="e.g. Verified Credentials"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pillDesc">Description</Label>
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
                  <Label htmlFor="pillIcon">Icon</Label>
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
                  <Label htmlFor="pillOrder">Display Order</Label>
                  <Input
                    id="pillOrder"
                    type="number"
                    value={editingPill.displayOrder}
                    onChange={(e) => setEditingPill({ ...editingPill, displayOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="pillActive" className="text-sm">Active</Label>
                <Switch
                  id="pillActive"
                  checked={editingPill.isActive}
                  onCheckedChange={(checked) => setEditingPill({ ...editingPill, isActive: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPillDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingPill && handleSavePill(editingPill)}
              disabled={!editingPill?.title.trim()}
            >
              Save Pill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Why Choose Us Add/Edit Dialog */}
      <Dialog open={whyDialogOpen} onOpenChange={setWhyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWhy?.id ? 'Edit Why Choose Us Card' : 'Add Why Choose Us Card'}</DialogTitle>
          </DialogHeader>
          {editingWhy && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whyTitle">Title</Label>
                <Input
                  id="whyTitle"
                  value={editingWhy.title}
                  onChange={(e) => setEditingWhy({ ...editingWhy, title: e.target.value })}
                  placeholder="e.g. Vetted Instructors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whyDesc">Description</Label>
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
                  <Label htmlFor="whyIcon">Icon</Label>
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
                  <Label htmlFor="whyOrder">Display Order</Label>
                  <Input
                    id="whyOrder"
                    type="number"
                    value={editingWhy.displayOrder}
                    onChange={(e) => setEditingWhy({ ...editingWhy, displayOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="whyActive" className="text-sm">Active</Label>
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
              Cancel
            </Button>
            <Button
              onClick={() => editingWhy && handleSaveWhy(editingWhy)}
              disabled={!editingWhy?.title.trim()}
            >
              Save Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How It Works Add/Edit Dialog */}
      <Dialog open={howDialogOpen} onOpenChange={setHowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHow?.id ? 'Edit Step' : 'Add Step'}</DialogTitle>
          </DialogHeader>
          {editingHow && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="howStepNum">Step Number</Label>
                  <Input
                    id="howStepNum"
                    value={editingHow.stepNumber}
                    onChange={(e) => setEditingHow({ ...editingHow, stepNumber: e.target.value })}
                    placeholder="01"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="howTitle">Step Title</Label>
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
                <Label htmlFor="howDesc">Description</Label>
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
                  <Label htmlFor="howOrder">Display Order</Label>
                  <Input
                    id="howOrder"
                    type="number"
                    value={editingHow.displayOrder}
                    onChange={(e) => setEditingHow({ ...editingHow, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 mt-6">
                  <Label htmlFor="howActive" className="text-sm">Active</Label>
                  <Switch
                    id="howActive"
                    checked={editingHow.isActive}
                    onCheckedChange={(checked) => setEditingHow({ ...editingHow, isActive: checked })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHowDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingHow && handleSaveHow(editingHow)}
              disabled={!editingHow?.title.trim()}
            >
              Save Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Add/Edit Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTestimonial?.id ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testName">Student Name</Label>
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
                  <Label htmlFor="testCourse">Course Completed</Label>
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
              <div className="space-y-2">
                <Label htmlFor="testContent">Testimonial Text</Label>
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
                  <Label htmlFor="testRating">Rating (1 to 5 Stars)</Label>
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
                      <SelectItem value="5">5 Stars ★★★★★</SelectItem>
                      <SelectItem value="4">4 Stars ★★★★☆</SelectItem>
                      <SelectItem value="3">3 Stars ★★★☆☆</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testOrder">Display Order</Label>
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
                  <Label htmlFor="testFeatured" className="text-sm">Featured</Label>
                  <Switch
                    id="testFeatured"
                    checked={editingTestimonial.isFeatured}
                    onCheckedChange={(checked) =>
                      setEditingTestimonial({ ...editingTestimonial, isFeatured: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="testActive" className="text-sm">Active</Label>
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
              Cancel
            </Button>
            <Button
              onClick={() => editingTestimonial && handleSaveTestimonial(editingTestimonial)}
              disabled={!editingTestimonial?.studentName.trim() || !editingTestimonial?.testimonial.trim()}
            >
              Save Testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Add/Edit Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq?.id ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          {editingFaq && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faqQuestion">Question</Label>
                <Input
                  id="faqQuestion"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. Are the courses self-paced?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faqAnswer">Answer</Label>
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
                  <Label htmlFor="faqCategory">Category</Label>
                  <Input
                    id="faqCategory"
                    value={editingFaq.category}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    placeholder="e.g. General, Certificates, Payments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faqOrder">Display Order</Label>
                  <Input
                    id="faqOrder"
                    type="number"
                    value={editingFaq.displayOrder}
                    onChange={(e) => setEditingFaq({ ...editingFaq, displayOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="faqActive" className="text-sm">Active</Label>
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
              Cancel
            </Button>
            <Button
              onClick={() => editingFaq && handleSaveFaq(editingFaq)}
              disabled={!editingFaq?.question.trim() || !editingFaq?.answer.trim()}
            >
              Save FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        open={Boolean(deletePillId)}
        onOpenChange={(open) => !open && setDeletePillId(null)}
        title="Delete Value Proposition"
        description="Are you sure you want to remove this value proposition pill from the landing page?"
        onConfirm={() => {
          if (deletePillId) handleDeletePill(deletePillId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteWhyId)}
        onOpenChange={(open) => !open && setDeleteWhyId(null)}
        title="Delete Why Choose Us Card"
        description="Are you sure you want to remove this card?"
        onConfirm={() => {
          if (deleteWhyId) handleDeleteWhy(deleteWhyId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteHowId)}
        onOpenChange={(open) => !open && setDeleteHowId(null)}
        title="Delete Learning Step"
        description="Are you sure you want to remove this framework step?"
        onConfirm={() => {
          if (deleteHowId) handleDeleteHow(deleteHowId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTestimonialId)}
        onOpenChange={(open) => !open && setDeleteTestimonialId(null)}
        title="Delete Testimonial"
        description="Are you sure you want to permanently remove this testimonial?"
        onConfirm={() => {
          if (deleteTestimonialId) handleDeleteTestimonial(deleteTestimonialId);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteFaqId)}
        onOpenChange={(open) => !open && setDeleteFaqId(null)}
        title="Delete FAQ"
        description="Are you sure you want to remove this FAQ item?"
        onConfirm={() => {
          if (deleteFaqId) handleDeleteFaq(deleteFaqId);
        }}
      />
    </div>
  );
}
