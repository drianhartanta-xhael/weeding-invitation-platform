'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  heroTitle: string;
  heroSubtitle: string;
  bodyGreeting: string;
  footerTitle: string;
  footerMessage: string;
}

interface DefaultSection {
  componentId: string;
  style: string;
  order: number;
}

interface StylePreset {
  bg: string;
  text: string;
}

interface TemplateData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  isActive: boolean;
  config: TemplateConfig;
  defaultSections: DefaultSection[];
  stylePresets: Record<string, StylePreset>;
}

const AVAILABLE_COMPONENTS = [
  { id: 'couple-profile', label: 'Couple Profile' },
  { id: 'event-detail', label: 'Event Detail' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'donation', label: 'Donation / Gift' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'wishes', label: 'Wishes' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'story', label: 'Our Story' },
];

const PRESET_KEYS = ['light', 'dark', 'accent', 'image-1', 'image-2'];

const POPULAR_FONTS = [
  'Playfair Display', 'Great Vibes', 'Dancing Script', 'Cormorant Garamond',
  'Montserrat', 'Lato', 'Poppins', 'Raleway', 'Roboto', 'Open Sans',
  'Libre Baskerville', 'Josefin Sans', 'Quicksand', 'Sacramento',
  'Alex Brush', 'Tangerine', 'Pinyon Script',
];

const DEFAULT_PRESETS: Record<string, StylePreset> = {
  light: { bg: '#FEFAE0', text: '#333333' },
  dark: { bg: '#2D2D2D', text: '#FFFFFF' },
  accent: { bg: '#606C38', text: '#FFFFFF' },
  'image-1': { bg: '#F5F0EB', text: '#333333' },
  'image-2': { bg: '#E8E0D8', text: '#333333' },
};

export default function TemplateEditPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', slug: '', description: '', thumbnail: '', isActive: true });

  const [config, setConfig] = useState<TemplateConfig>({
    primaryColor: '#D4A373', secondaryColor: '#FEFAE0', accentColor: '#606C38',
    fontHeading: 'Playfair Display', fontBody: 'Lato',
    heroTitle: 'The Wedding of', heroSubtitle: 'You are cordially invited',
    bodyGreeting: '', footerTitle: 'Thank You', footerMessage: 'We are looking forward to celebrating with you',
  });

  const [defaultSections, setDefaultSections] = useState<DefaultSection[]>([]);
  const [stylePresets, setStylePresets] = useState<Record<string, StylePreset>>({ ...DEFAULT_PRESETS });

  useEffect(() => {
    api.get(`/templates/${params.id}`)
      .then(({ data }) => {
        const t: TemplateData = data.template;
        setForm({ name: t.name, slug: t.slug, description: t.description || '', thumbnail: t.thumbnail || '', isActive: t.isActive });
        setConfig({
          primaryColor: t.config?.primaryColor || '#D4A373',
          secondaryColor: t.config?.secondaryColor || '#FEFAE0',
          accentColor: t.config?.accentColor || '#606C38',
          fontHeading: t.config?.fontHeading || 'Playfair Display',
          fontBody: t.config?.fontBody || 'Lato',
          heroTitle: t.config?.heroTitle || 'The Wedding of',
          heroSubtitle: t.config?.heroSubtitle || 'You are cordially invited',
          bodyGreeting: t.config?.bodyGreeting || '',
          footerTitle: t.config?.footerTitle || 'Thank You',
          footerMessage: t.config?.footerMessage || 'We are looking forward to celebrating with you',
        });
        if (t.defaultSections?.length) setDefaultSections(t.defaultSections);
        if (t.stylePresets && Object.keys(t.stylePresets).length) setStylePresets(t.stylePresets);
      })
      .catch(() => setError('Failed to load template'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      await api.put(`/templates/${params.id}`, { ...form, config, defaultSections, stylePresets });
      setSuccess('Template saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  usePageHeader(
    {
      title: loading ? 'Memuat...' : form.name || 'Edit tema',
      subtitle: 'Edit tema',
      action: loading
        ? undefined
        : { label: 'Simpan', onClick: handleSave, loading: saving },
    },
    [loading, form.name, saving]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader><CardTitle>Colors</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([{ key: 'primaryColor', label: 'Primary' }, { key: 'secondaryColor', label: 'Secondary' }, { key: 'accentColor', label: 'Accent' }] as const).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    className="w-10 h-10 rounded border border-border cursor-pointer" />
                  <Input value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex h-8 rounded-lg overflow-hidden border">
            <div className="flex-1" style={{ backgroundColor: config.primaryColor }} />
            <div className="flex-1" style={{ backgroundColor: config.secondaryColor }} />
            <div className="flex-1" style={{ backgroundColor: config.accentColor }} />
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader><CardTitle>Fonts</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Heading Font</Label>
              <Select value={config.fontHeading} onValueChange={(v) => setConfig({ ...config, fontHeading: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POPULAR_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Body Font</Label>
              <Select value={config.fontBody} onValueChange={(v) => setConfig({ ...config, fontBody: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POPULAR_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Section Texts */}
      <Card>
        <CardHeader>
          <CardTitle>Default Section Texts</CardTitle>
          <p className="text-xs text-muted-foreground">Default texts for invitations using this template. Clients can override these.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Hero Title</Label>
              <Input value={config.heroTitle} onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })} placeholder="The Wedding of" />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Subtitle</Label>
              <Input value={config.heroSubtitle} onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })} placeholder="You are cordially invited" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Body Greeting</Label>
              <Textarea value={config.bodyGreeting} onChange={(e) => setConfig({ ...config, bodyGreeting: e.target.value })} placeholder="Optional (e.g. Bismillahirrahmanirrahim...)" />
            </div>
            <div className="space-y-1.5">
              <Label>Footer Title</Label>
              <Input value={config.footerTitle} onChange={(e) => setConfig({ ...config, footerTitle: e.target.value })} placeholder="Thank You" />
            </div>
            <div className="space-y-1.5">
              <Label>Footer Message</Label>
              <Input value={config.footerMessage} onChange={(e) => setConfig({ ...config, footerMessage: e.target.value })} placeholder="We are looking forward..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Style Presets</CardTitle>
          <p className="text-xs text-muted-foreground">Define the background and text color for each style preset that clients can choose per section.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRESET_KEYS.map((key) => {
            const preset = stylePresets[key] || DEFAULT_PRESETS[key];
            return (
              <div key={key} className="flex items-center gap-4 p-3 border rounded-lg flex-wrap">
                <span className="text-sm font-medium w-16">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">BG</span>
                  <input type="color" value={preset.bg} onChange={(e) => setStylePresets({ ...stylePresets, [key]: { ...preset, bg: e.target.value } })}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input className="w-24" value={preset.bg} onChange={(e) => setStylePresets({ ...stylePresets, [key]: { ...preset, bg: e.target.value } })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Text</span>
                  <input type="color" value={preset.text} onChange={(e) => setStylePresets({ ...stylePresets, [key]: { ...preset, text: e.target.value } })}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input className="w-24" value={preset.text} onChange={(e) => setStylePresets({ ...stylePresets, [key]: { ...preset, text: e.target.value } })} />
                </div>
                <div className="px-3 py-1.5 rounded text-xs border" style={{ backgroundColor: preset.bg, color: preset.text }}>
                  Preview
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Default Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Default Sections</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Starter sections for new clients using this template.</p>
          </div>
          <Select value="" onValueChange={(v) => {
            if (!v) return;
            setDefaultSections([...defaultSections, { componentId: v, style: 'light', order: defaultSections.length }]);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="+ Add section" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_COMPONENTS.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {defaultSections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No default sections. Clients will start with an empty layout.</p>
          ) : (
            <div className="space-y-2">
              {defaultSections.sort((a, b) => a.order - b.order).map((sec, idx) => {
                const comp = AVAILABLE_COMPONENTS.find((c) => c.id === sec.componentId);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}</span>
                      <span className="text-sm font-medium">{comp?.label || sec.componentId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={sec.style} onValueChange={(v) => {
                        const updated = [...defaultSections];
                        updated[idx] = { ...sec, style: v };
                        setDefaultSections(updated);
                      }}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRESET_KEYS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" disabled={idx === 0}
                        onClick={() => { if (idx > 0) { const u = [...defaultSections]; [u[idx - 1], u[idx]] = [{ ...u[idx], order: u[idx - 1].order }, { ...u[idx - 1], order: u[idx].order }]; setDefaultSections(u); } }}>
                        Up
                      </Button>
                      <Button variant="ghost" size="sm" disabled={idx === defaultSections.length - 1}
                        onClick={() => { if (idx < defaultSections.length - 1) { const u = [...defaultSections]; [u[idx], u[idx + 1]] = [{ ...u[idx + 1], order: u[idx].order }, { ...u[idx], order: u[idx + 1].order }]; setDefaultSections(u); } }}>
                        Down
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => setDefaultSections(defaultSections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })))}>
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
