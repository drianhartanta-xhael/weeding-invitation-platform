'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';

interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  config: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
  };
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    try {
      const { data } = await api.post('/templates', {
        name: 'New Template',
        slug: `template-${Date.now()}`,
        description: '',
        config: {
          primaryColor: '#D4A373',
          secondaryColor: '#FEFAE0',
          accentColor: '#606C38',
          fontHeading: 'Playfair Display',
          fontBody: 'Lato',
        },
      });
      router.push(`/templates/${data.template._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
    }
  };

  usePageHeader(
    {
      title: 'Tema',
      subtitle: loading ? 'Memuat...' : `${templates.length} tema tersedia`,
      action: { label: 'Tema Baru', icon: Plus, onClick: handleCreate },
    },
    [loading, templates.length]
  );

  useEffect(() => {
    api.get('/templates')
      .then(({ data }) => setTemplates(data.templates))
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter((t) => t._id !== id));
    } catch {
      setError('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-[10px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Semua Tema</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {templates.length}
            </span>
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No templates yet. Create your first one.</p>
              <Button onClick={handleCreate}>Create Template</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
            <Card key={t._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full border border-border" style={{ backgroundColor: t.config.primaryColor }} />
                    <span className="w-7 h-7 rounded-full border border-border" style={{ backgroundColor: t.config.secondaryColor }} />
                    <span className="w-7 h-7 rounded-full border border-border" style={{ backgroundColor: t.config.accentColor }} />
                  </div>
                  <Badge variant={t.isActive ? 'default' : 'secondary'}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.slug}</p>
                </div>
              </CardHeader>
              <CardContent>
                {t.description && <p className="text-sm text-muted-foreground mb-2">{t.description}</p>}
                <p className="text-xs text-muted-foreground">{t.config.fontHeading} + {t.config.fontBody}</p>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/templates/${t._id}`}>Edit</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Clients using this template will lose their template assignment. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(t._id)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
