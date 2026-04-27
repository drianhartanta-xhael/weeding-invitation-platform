'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Client, SectionItem } from '../types';
import { COMPONENT_REGISTRY, STYLE_PRESETS } from '../constants';
import { getComponentMeta, getDefaultComponentData, dateToInput } from '../helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  client: Client;
  saving: boolean;
  saveClient: (payload: Record<string, unknown>) => Promise<void>;
  setError: (msg: string) => void;
}

export default function SectionsTab({ client, saving, saveClient, setError }: Props) {
  const [sections, setSections] = useState<SectionItem[]>(client.sections || []);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasteUrls, setShowPasteUrls] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Invitation Sections</h2>
          <p className="text-xs text-muted-foreground">Click to expand and edit. Use Up/Down to reorder.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddSection(!showAddSection)}>
          {showAddSection ? 'Cancel' : '+ Add Section'}
        </Button>
      </div>

      {showAddSection && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">Choose a component:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMPONENT_REGISTRY.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    let data: Record<string, any>;
                    if (comp.id === 'couple-profile') {
                      data = {
                        groomName: client.groomName || '',
                        brideName: client.brideName || '',
                        groomPhoto: client.groomPhoto || '',
                        bridePhoto: client.bridePhoto || '',
                        groomParents: client.groomParents || { father: '', mother: '' },
                        brideParents: client.brideParents || { father: '', mother: '' },
                      };
                    } else if (comp.id === 'event-detail') {
                      data = { events: client.events?.length ? client.events : [] };
                    } else if (comp.id === 'donation') {
                      data = { bankAccounts: client.bankAccounts?.length ? client.bankAccounts : [] };
                    } else if (comp.id === 'countdown') {
                      data = { eventDate: client.eventDate ? dateToInput(client.eventDate) : '' };
                    } else {
                      data = getDefaultComponentData(comp.id);
                    }
                    const newSection: SectionItem = {
                      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      componentId: comp.id,
                      data,
                      style: 'light',
                      order: sections.length,
                    };
                    setSections([...sections, newSection]);
                    setExpandedSectionId(newSection.id);
                    setShowAddSection(false);
                  }}
                  className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 text-left transition-all"
                >
                  <p className="text-sm font-medium">{comp.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No sections yet. Add sections to build the invitation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, idx) => {
              const meta = getComponentMeta(section.componentId);
              const isExpanded = expandedSectionId === section.id;

              return (
                <div
                  key={section.id}
                  className={cn(
                    'border rounded-lg overflow-hidden bg-card',
                    isExpanded && 'ring-2 ring-primary'
                  )}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40"
                    onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{meta?.label || section.componentId}</p>
                        <p className="text-xs text-muted-foreground">Style: {section.style}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (idx === 0) return;
                          const updated = [...sections];
                          const prev = updated[idx - 1];
                          updated[idx - 1] = { ...section, order: prev.order };
                          updated[idx] = { ...prev, order: section.order };
                          setSections(updated);
                        }}>
                        Up
                      </Button>
                      <Button variant="ghost" size="sm" disabled={idx === sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (idx === sections.length - 1) return;
                          const updated = [...sections];
                          const next = updated[idx + 1];
                          updated[idx + 1] = { ...section, order: next.order };
                          updated[idx] = { ...next, order: section.order };
                          setSections(updated);
                        }}>
                        Down
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSections(sections.filter((s) => s.id !== section.id).map((s, i) => ({ ...s, order: i })));
                        }}>
                        Remove
                      </Button>
                      <span className="text-muted-foreground ml-1 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 bg-muted/20 space-y-4">
                      <div>
                        <Label className="mb-2 block">Background Style</Label>
                        <div className="flex flex-wrap gap-2">
                          {STYLE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              onClick={() => setSections(sections.map((s) => s.id === section.id ? { ...s, style: preset } : s))}
                              className={cn(
                                'px-3 py-1.5 text-xs rounded-lg border transition-all',
                                section.style === preset
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                              )}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {meta && meta.fields.length > 0 ? (
                        <div className="space-y-3">
                          {meta.fields.map((field) => {
                            if (field.type === 'text' || field.type === 'url' || field.type === 'date') {
                              return (
                                <div key={field.key} className="space-y-1.5">
                                  <Label>{field.label}</Label>
                                  <Input
                                    type={field.type === 'date' ? 'date' : 'text'}
                                    value={section.data[field.key] || ''}
                                    placeholder={field.placeholder}
                                    onChange={(e) => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: e.target.value } } : s))}
                                  />
                                </div>
                              );
                            }
                            if (field.type === 'textarea') {
                              return (
                                <div key={field.key} className="space-y-1.5">
                                  <Label>{field.label}</Label>
                                  <Textarea
                                    value={section.data[field.key] || ''}
                                    placeholder={field.placeholder}
                                    onChange={(e) => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: e.target.value } } : s))}
                                  />
                                </div>
                              );
                            }
                            if (field.type === 'select' && field.options) {
                              return (
                                <div key={field.key} className="space-y-1.5">
                                  <Label>{field.label}</Label>
                                  <Select
                                    value={section.data[field.key] || field.options[0]?.value || ''}
                                    onValueChange={(v) => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: v } } : s))}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {field.options.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }
                            if (field.type === 'image-list') {
                              const images: string[] = section.data[field.key] || [];
                              const pasteKey = `${section.id}-${field.key}`;
                              const isPasteVisible = showPasteUrls[pasteKey] || false;
                              return (
                                <div key={field.key} className="space-y-2">
                                  <Label>{field.label}</Label>
                                  <div className="flex items-center gap-3">
                                    <label className={cn(
                                      'cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors',
                                      uploading && 'opacity-50 pointer-events-none'
                                    )}>
                                      {uploading ? 'Uploading...' : 'Upload Images'}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        multiple
                                        className="hidden"
                                        onChange={async (e) => {
                                          const files = e.target.files;
                                          if (!files || files.length === 0) return;
                                          setUploading(true);
                                          try {
                                            const formData = new FormData();
                                            for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
                                            const { data } = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
                                            const newUrls = (data.urls as string[]).map((u: string) => `${apiUrl}${u}`);
                                            setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: [...images, ...newUrls] } } : s));
                                          } catch {
                                            setError('Failed to upload images');
                                          } finally {
                                            setUploading(false);
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="text-xs text-primary hover:underline"
                                      onClick={() => setShowPasteUrls({ ...showPasteUrls, [pasteKey]: !isPasteVisible })}
                                    >
                                      {isPasteVisible ? 'Hide' : 'Paste URLs'}
                                    </button>
                                  </div>
                                  {isPasteVisible && (
                                    <Textarea
                                      value={images.join('\n')}
                                      placeholder="One URL per line"
                                      onChange={(e) => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: e.target.value.split('\n').filter(Boolean) } } : s))}
                                    />
                                  )}
                                  {images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                      {images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="relative group aspect-square rounded-lg overflow-hidden border">
                                          <img src={img} alt={`Image ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: images.filter((_, i) => i !== imgIdx) } } : s))}
                                            className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            if (field.type === 'array' && field.arrayFields) {
                              const items: Record<string, any>[] = section.data[field.key] || [];
                              if (field.key === 'groomParents' || field.key === 'brideParents') {
                                const obj = section.data[field.key] || {};
                                return (
                                  <div key={field.key} className="space-y-2">
                                    <Label>{field.label}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {field.arrayFields.map((af) => (
                                        <div key={af.key} className="space-y-1">
                                          <label className="text-xs text-muted-foreground">{af.label}</label>
                                          <Input value={obj[af.key] || ''}
                                            onChange={(e) => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: { ...obj, [af.key]: e.target.value } } } : s))}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={field.key} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>{field.label}</Label>
                                    <button
                                      className="text-xs text-primary hover:underline"
                                      onClick={() => {
                                        const empty: Record<string, any> = {};
                                        field.arrayFields!.forEach((af) => { empty[af.key] = ''; });
                                        setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: [...items, empty] } } : s));
                                      }}
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="p-3 bg-background border rounded-lg space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        {field.arrayFields!.map((af) => (
                                          <div key={af.key} className="space-y-1">
                                            <label className="text-xs text-muted-foreground">{af.label}</label>
                                            <Input
                                              type={af.type === 'date' ? 'date' : 'text'}
                                              value={item[af.key] || ''}
                                              placeholder={af.placeholder}
                                              onChange={(e) => {
                                                const updated = [...items];
                                                updated[itemIdx] = { ...item, [af.key]: e.target.value };
                                                setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: updated } } : s));
                                              }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <button
                                        className="text-xs text-destructive hover:underline"
                                        onClick={() => setSections(sections.map((s) => s.id === section.id ? { ...s, data: { ...s.data, [field.key]: items.filter((_, i) => i !== itemIdx) } } : s))}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">This component uses data from context (no additional fields needed).</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <Button disabled={saving}
        onClick={() => saveClient({ sections: sections.map((s, i) => ({ ...s, order: i })) })}>
        {saving ? 'Saving...' : 'Save Sections'}
      </Button>
    </div>
  );
}
