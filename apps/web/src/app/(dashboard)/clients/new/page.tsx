'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarIcon, ChevronUp, ChevronDown, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { GuestCategory } from '@wedding/shared';
import { COMPONENT_REGISTRY, STYLE_PRESETS } from '@wedding/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateOption {
  _id: string;
  name: string;
  description: string;
  config: { primaryColor: string; secondaryColor: string; accentColor: string };
  defaultSections?: { componentId: string; style: string; order: number }[];
}

interface BasicInfo {
  groomName: string;
  brideName: string;
  slug: string;
  eventDate: string;
}

interface WizardSection {
  id: string;
  componentId: string;
  data: Record<string, any>;
  style: string;
  order: number;
}

interface WizardGuest {
  name: string;
  invitationName: string;
  phone: string;
  category: GuestCategory;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Basic Info' },
  { number: 2, label: 'Template & Sections' },
  { number: 3, label: 'Guests' },
  { number: 4, label: 'Review' },
];

const GUEST_CATEGORIES: { value: GuestCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'officeFriend', label: 'Office Friend' },
  { value: 'fatherFriend', label: "Father's Friend" },
  { value: 'motherFriend', label: "Mother's Friend" },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'other', label: 'Other' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(groom: string, bride: string) {
  return `${groom}-${bride}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildDefaultSections(
  defaultSections: { componentId: string; style: string; order: number }[],
  basicInfo: BasicInfo
): WizardSection[] {
  return defaultSections.map((s) => {
    let data: Record<string, any> = {};
    switch (s.componentId) {
      case 'couple-profile':
        data = {
          groomName: basicInfo.groomName,
          brideName: basicInfo.brideName,
          groomPhoto: '',
          bridePhoto: '',
          groomParents: { father: '', mother: '' },
          brideParents: { father: '', mother: '' },
        };
        break;
      case 'event-detail':
        data = {
          events: [
            { name: 'Akad Nikah', date: basicInfo.eventDate, time: '08:00', venue: '', address: '', mapUrl: '' },
            { name: 'Resepsi', date: basicInfo.eventDate, time: '11:00', venue: '', address: '', mapUrl: '' },
          ],
        };
        break;
      case 'countdown':
        data = { eventDate: basicInfo.eventDate || '' };
        break;
      case 'donation':
        data = { bankAccounts: [] };
        break;
      case 'gallery':
        data = { images: [] };
        break;
      case 'story':
        data = { stories: [], layout: 'vertical' };
        break;
      case 'location-map':
        data = { venue: '', address: '', mapUrl: '' };
        break;
      default:
        data = {};
    }
    return { id: crypto.randomUUID(), componentId: s.componentId, data, style: s.style, order: s.order };
  });
}

function getComponentLabel(componentId: string): string {
  return COMPONENT_REGISTRY.find((c) => c.id === componentId)?.label ?? componentId;
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ info, onChange }: { info: BasicInfo; onChange: (v: BasicInfo) => void }) {
  const [slugTouched, setSlugTouched] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const handleName = (field: 'groomName' | 'brideName', value: string) => {
    const next = { ...info, [field]: value };
    if (!slugTouched) {
      next.slug = generateSlug(
        field === 'groomName' ? value : info.groomName,
        field === 'brideName' ? value : info.brideName
      );
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter the couple's names and the wedding date to get started.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Groom Name</Label>
          <Input
            placeholder="e.g. Budi Santoso"
            value={info.groomName}
            onChange={(e) => handleName('groomName', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bride Name</Label>
          <Input
            placeholder="e.g. Sari Dewi"
            value={info.brideName}
            onChange={(e) => handleName('brideName', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Slug (URL identifier)</Label>
        <Input
          placeholder="e.g. budi-sari"
          value={info.slug}
          onChange={(e) => { setSlugTouched(true); onChange({ ...info, slug: e.target.value }); }}
        />
        {info.slug && (
          <p className="text-xs text-muted-foreground">
            Invitation URL: {process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001'}/{info.slug}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Event Date</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={() => setCalOpen((o) => !o)}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {info.eventDate
            ? format(parseISO(info.eventDate), 'PPP')
            : <span className="text-muted-foreground">Pick a date</span>
          }
        </Button>
        {calOpen && (
          <div className="border rounded-md w-fit">
            <Calendar
              mode="single"
              selected={info.eventDate ? parseISO(info.eventDate) : undefined}
              onSelect={(date) => {
                onChange({ ...info, eventDate: date ? format(date, 'yyyy-MM-dd') : '' });
                setCalOpen(false);
              }}
              initialFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Template + Section Editor ───────────────────────────────────────

function Step2({
  selectedId,
  onSelect,
  sections,
  onSectionsChange,
  basicInfo,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  sections: WizardSection[];
  onSectionsChange: (s: WizardSection[]) => void;
  basicInfo: BasicInfo;
}) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    api
      .get('/templates')
      .then(({ data }) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id: string) => {
    if (selectedId === id) {
      onSelect('');
      onSectionsChange([]);
      return;
    }
    onSelect(id);
    const template = templates.find((t) => t._id === id);
    if (template?.defaultSections?.length) {
      onSectionsChange(buildDefaultSections(template.defaultSections, basicInfo));
    } else {
      // Fetch full template to get defaultSections if not in list
      try {
        const { data } = await api.get(`/templates/${id}`);
        if (data.template?.defaultSections?.length) {
          onSectionsChange(buildDefaultSections(data.template.defaultSections, basicInfo));
        } else {
          onSectionsChange([]);
        }
      } catch {
        onSectionsChange([]);
      }
    }
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...sections];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onSectionsChange(next.map((s, i) => ({ ...s, order: i })));
  };

  const removeSection = (id: string) => {
    onSectionsChange(sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const addSection = (componentId: string) => {
    const existing = COMPONENT_REGISTRY.find((c) => c.id === componentId);
    if (!existing) return;
    let data: Record<string, any> = {};
    switch (componentId) {
      case 'couple-profile':
        data = { groomName: basicInfo.groomName, brideName: basicInfo.brideName, groomPhoto: '', bridePhoto: '', groomParents: { father: '', mother: '' }, brideParents: { father: '', mother: '' } };
        break;
      case 'event-detail':
        data = { events: [{ name: 'Akad Nikah', date: basicInfo.eventDate, time: '08:00', venue: '', address: '', mapUrl: '' }] };
        break;
      case 'countdown':
        data = { eventDate: basicInfo.eventDate || '' };
        break;
      case 'gallery':
        data = { images: [] };
        break;
      case 'donation':
        data = { bankAccounts: [] };
        break;
      case 'story':
        data = { stories: [], layout: 'vertical' };
        break;
      case 'location-map':
        data = { venue: '', address: '', mapUrl: '' };
        break;
      default:
        data = {};
    }
    const newSection: WizardSection = {
      id: crypto.randomUUID(),
      componentId,
      data,
      style: 'light',
      order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
    setShowAddSection(false);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Choose a template for the invitation. You can change this later.</p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-muted-foreground text-sm">No templates available — you can set one after creation.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => handleSelect(t._id)}
              className={cn(
                'p-4 border-2 rounded-xl text-left transition-colors',
                selectedId === t._id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  {[t.config.primaryColor, t.config.secondaryColor, t.config.accentColor].map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
                {selectedId === t._id && (
                  <span className="ml-auto text-xs font-medium text-primary">Selected</span>
                )}
              </div>
              <p className="font-medium text-sm">{t.name}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </button>
          ))}
        </div>
      )}

      {/* Section editor — shown when template selected */}
      {selectedId && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Sections</p>
              <p className="text-xs text-muted-foreground">Reorder or add/remove sections before creating.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddSection(!showAddSection)}>
              {showAddSection ? 'Cancel' : '+ Add Section'}
            </Button>
          </div>

          {showAddSection && (
            <div className="rounded-lg border border-dashed border-2 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Choose component:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COMPONENT_REGISTRY.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => addSection(comp.id)}
                    className="text-left p-2.5 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-xs font-medium">{comp.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{comp.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
              No sections yet. Add some above.
            </p>
          ) : (
            <div className="space-y-1.5">
              {sections.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === sections.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getComponentLabel(s.componentId)}</p>
                    <p className="text-xs text-muted-foreground">{s.style}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(s.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">You can skip this step and assign a template later.</p>
    </div>
  );
}

// ─── Step 3: Bulk Guest Setup ─────────────────────────────────────────────────

function Step3({
  guests,
  onChange,
}: {
  guests: WizardGuest[];
  onChange: (g: WizardGuest[]) => void;
}) {
  const addRow = () =>
    onChange([...guests, { name: '', invitationName: '', phone: '', category: 'other' }]);

  const removeRow = (i: number) => onChange(guests.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof WizardGuest, value: string) => {
    const next = [...guests];
    next[i] = { ...next[i], [field]: value };
    if (field === 'name' && !next[i].invitationName) next[i].invitationName = value;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add guests now or skip — more can be added after creation.
      </p>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Name</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Invitation Name</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-28">Phone</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-36">Category</th>
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {guests.map((g, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="p-1.5">
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g. Bapak & Ibu Tono"
                    value={g.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Name on invitation"
                    value={g.invitationName}
                    onChange={(e) => updateRow(i, 'invitationName', e.target.value)}
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    className="h-8 text-sm"
                    placeholder="08xx"
                    value={g.phone}
                    onChange={(e) => updateRow(i, 'phone', e.target.value)}
                  />
                </td>
                <td className="p-1.5">
                  <Select value={g.category} onValueChange={(v) => updateRow(i, 'category', v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUEST_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={addRow}>
        + Add Row
      </Button>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({
  info,
  templateId,
  sections,
  guests,
  templates,
}: {
  info: BasicInfo;
  templateId: string;
  sections: WizardSection[];
  guests: WizardGuest[];
  templates: TemplateOption[];
}) {
  const template = templates.find((t) => t._id === templateId);
  const validGuests = guests.filter((g) => g.name.trim());

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Review the details before creating the client.</p>

      <div className="rounded-xl border divide-y">
        <Row label="Groom" value={info.groomName || '—'} />
        <Row label="Bride" value={info.brideName || '—'} />
        <Row label="Slug" value={info.slug || '—'} />
        <Row
          label="Event Date"
          value={info.eventDate ? format(parseISO(info.eventDate), 'PPP') : '—'}
        />
        <Row label="Template" value={template ? template.name : 'None (set later)'} />
        <Row
          label="Sections"
          value={sections.length > 0 ? `${sections.length} section${sections.length > 1 ? 's' : ''} configured` : 'None'}
        />
        <Row
          label="Guests to add"
          value={validGuests.length > 0 ? `${validGuests.length} guest${validGuests.length > 1 ? 's' : ''}` : 'None (add later)'}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        After creation you will be redirected to the client detail page where you can add events, photos, and more guests.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState<BasicInfo>({ groomName: '', brideName: '', slug: '', eventDate: '' });
  const [templateId, setTemplateId] = useState('');
  const [sections, setSections] = useState<WizardSection[]>([]);
  const [bulkGuests, setBulkGuests] = useState<WizardGuest[]>([
    { name: '', invitationName: '', phone: '', category: 'other' },
  ]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/templates').then(({ data }) => setTemplates(data.templates || [])).catch(() => {});
  }, []);

  const canAdvance = () => {
    if (step === 1) return !!(info.groomName && info.brideName && info.slug && info.eventDate);
    return true;
  };

  const handleCreate = async (publish: boolean) => {
    setError('');
    setLoading(true);
    try {
      const validGuests = bulkGuests.filter((g) => g.name.trim());

      const payload: Record<string, unknown> = {
        groomName: info.groomName,
        brideName: info.brideName,
        slug: info.slug,
        eventDate: info.eventDate,
        status: publish ? 'published' : 'draft',
        ...(templateId && { templateId }),
        ...(sections.length > 0 && { sections }),
      };

      const { data } = await api.post('/clients', payload);
      const clientId: string = data.client._id;

      for (const g of validGuests) {
        const slug = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await api.post('/guests', {
          clientId,
          name: g.name,
          invitationName: g.invitationName || g.name,
          slug,
          phone: g.phone,
          category: g.category,
        });
      }

      router.push(`/clients/${clientId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-border">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Clients
        </Link>
        <h1 className="text-3xl font-bold tracking-tight leading-none text-foreground">New Client</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 max-w-2xl">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  step > s.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step === s.number
                    ? 'border-primary text-primary bg-background'
                    : 'border-border text-muted-foreground bg-background'
                )}
              >
                {step > s.number ? '✓' : s.number}
              </div>
              <p
                className={cn(
                  'text-xs mt-1 whitespace-nowrap',
                  step === s.number ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                  step > s.number ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card rounded-xl shadow-sm border p-6 max-w-2xl">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && <Step1 info={info} onChange={setInfo} />}
        {step === 2 && (
          <Step2
            selectedId={templateId}
            onSelect={setTemplateId}
            sections={sections}
            onSectionsChange={setSections}
            basicInfo={info}
          />
        )}
        {step === 3 && <Step3 guests={bulkGuests} onChange={setBulkGuests} />}
        {step === 4 && (
          <Step4
            info={info}
            templateId={templateId}
            sections={sections}
            guests={bulkGuests}
            templates={templates}
          />
        )}

        <Separator className="mt-8 mb-4" />

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className={step === 1 ? 'invisible' : ''}
          >
            Back
          </Button>

          {step < 4 ? (
            <Button disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" disabled={loading} onClick={() => handleCreate(false)}>
                {loading ? 'Creating...' : 'Save as Draft'}
              </Button>
              <Button disabled={loading} onClick={() => handleCreate(true)}>
                {loading ? 'Creating...' : 'Create & Publish'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
