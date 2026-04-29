'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Client, BankAccount, TemplateOption } from '../types';
import { EMPTY_BANK } from '../constants';
import { dateToInput } from '../helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  client: Client;
  saving: boolean;
  saveClient: (payload: Record<string, unknown>) => Promise<void>;
}

export default function DetailsTab({ client, saving, saveClient }: Props) {
  const [form, setForm] = useState({
    slug: client.slug || '',
    eventDate: dateToInput(client.eventDate),
    status: (client.status || 'draft') as 'draft' | 'published',
    music: {
      videoId: client.music?.videoId || '',
      title: client.music?.title || '',
      artist: client.music?.artist || '',
      thumbnailUrl: client.music?.thumbnailUrl || '',
      url: client.music?.url || '',
      autoplay: client.music?.autoplay || false,
    },
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    typeof client.templateId === 'object' && client.templateId
      ? (client.templateId as any)._id
      : client.templateId || ''
  );
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(client.bankAccounts || []);
  const [newBank, setNewBank] = useState<BankAccount>({ ...EMPTY_BANK });
  const [showAddBank, setShowAddBank] = useState(false);
  const [musicMode, setMusicMode] = useState<'youtube' | 'audio'>(
    client.music?.videoId ? 'youtube' : client.music?.url ? 'audio' : 'youtube'
  );
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    api
      .get('/templates')
      .then(({ data }) => { setTemplates(data.templates); setTemplatesLoaded(true); })
      .catch(() => {});
  }, []);

  const handlePreview = async () => {
    setPreviewError('');
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/youtube/preview', { url: youtubeUrlInput });
      setForm((f) => ({
        ...f,
        music: {
          ...f.music,
          videoId: data.videoId,
          title: data.title,
          artist: data.artist,
          thumbnailUrl: data.thumbnailUrl,
        },
      }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Preview failed';
      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClearYoutube = () => {
    setForm((f) => ({
      ...f,
      music: { ...f.music, videoId: '', title: '', artist: '', thumbnailUrl: '' },
    }));
    setYoutubeUrlInput('');
    setPreviewError('');
  };

  return (
    <div className="space-y-6">
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              {form.slug && (
                <p className="text-xs text-muted-foreground">
                  URL: {process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001'}/{form.slug}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Event Date</Label>
              <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as 'draft' | 'published' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Music */}
      <Card>
        <CardHeader>
          <CardTitle>Background Music</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Label className="text-sm font-medium">Mode:</Label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="music-mode"
                value="youtube"
                checked={musicMode === 'youtube'}
                onChange={() => setMusicMode('youtube')}
              />
              YouTube
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="music-mode"
                value="audio"
                checked={musicMode === 'audio'}
                onChange={() => setMusicMode('audio')}
              />
              Audio file (legacy)
            </label>
          </div>

          {musicMode === 'youtube' && (
            <div className="space-y-3">
              {form.music.videoId ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  {form.music.thumbnailUrl && (
                    <img
                      src={form.music.thumbnailUrl}
                      alt=""
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{form.music.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.music.artist}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      videoId: {form.music.videoId}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearYoutube}>
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>YouTube URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={youtubeUrlInput}
                      onChange={(e) => setYoutubeUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={previewLoading || !youtubeUrlInput.trim()}
                    >
                      {previewLoading ? 'Loading...' : 'Preview'}
                    </Button>
                  </div>
                  {previewError && (
                    <p className="text-xs text-destructive">{previewError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {musicMode === 'audio' && (
            <div className="space-y-1.5">
              <Label>Audio URL (MP3)</Label>
              <Input
                value={form.music.url}
                onChange={(e) =>
                  setForm({ ...form, music: { ...form.music, url: e.target.value } })
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={form.music.autoplay}
              onCheckedChange={(checked) =>
                setForm({ ...form, music: { ...form.music, autoplay: checked } })
              }
            />
            <Label>Autoplay setelah cover dibuka</Label>
          </div>
        </CardContent>
      </Card>

      {/* Template */}
      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
        </CardHeader>
        <CardContent>
          {!templatesLoaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No templates available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {templates.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTemplateId(t._id)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    selectedTemplateId === t._id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <div className="flex gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: t.config.primaryColor }} />
                    <span className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: t.config.secondaryColor }} />
                    <span className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: t.config.accentColor }} />
                  </div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.config.fontHeading} + {t.config.fontBody}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bank Accounts</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddBank(!showAddBank)}>
            {showAddBank ? 'Cancel' : '+ Add Account'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddBank && (
            <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Bank</Label>
                  <Input placeholder="e.g. BCA" value={newBank.bank}
                    onChange={(e) => setNewBank({ ...newBank, bank: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={newBank.accountNumber}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Name</Label>
                  <Input value={newBank.accountName}
                    onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })} />
                </div>
              </div>
              <Button size="sm" onClick={() => {
                if (!newBank.bank || !newBank.accountNumber || !newBank.accountName) return;
                setBankAccounts([...bankAccounts, { ...newBank }]);
                setNewBank({ ...EMPTY_BANK });
                setShowAddBank(false);
              }}>
                Add Account
              </Button>
            </div>
          )}

          {bankAccounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bank accounts.</p>
          ) : (
            <div className="space-y-2">
              {bankAccounts.map((ba, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{ba.bank}</span>
                    <span className="text-muted-foreground text-sm ml-2">{ba.accountNumber}</span>
                    <span className="text-muted-foreground text-sm ml-2">({ba.accountName})</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                    onClick={() => setBankAccounts(bankAccounts.filter((_, idx) => idx !== i))}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button disabled={saving}
            onClick={() => {
              const musicPayload =
                musicMode === 'youtube'
                  ? form.music.videoId
                    ? {
                        videoId: form.music.videoId,
                        title: form.music.title,
                        artist: form.music.artist,
                        thumbnailUrl: form.music.thumbnailUrl,
                        url: '',
                        autoplay: form.music.autoplay,
                      }
                    : {
                        videoId: '',
                        title: '',
                        artist: '',
                        thumbnailUrl: '',
                        url: '',
                        autoplay: form.music.autoplay,
                      }
                  : {
                      videoId: '',
                      title: '',
                      artist: '',
                      thumbnailUrl: '',
                      url: form.music.url,
                      autoplay: form.music.autoplay,
                    };
              saveClient({
                slug: form.slug,
                eventDate: form.eventDate,
                status: form.status,
                music: musicPayload,
                bankAccounts,
                templateId: selectedTemplateId || undefined,
              });
            }}>
            {saving ? 'Saving...' : 'Save Details'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
