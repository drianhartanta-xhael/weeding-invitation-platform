import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/invitations/${params.slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error('not found');

    const { invitation } = await res.json();
    const title = `${invitation.groomName} & ${invitation.brideName} Wedding Invitation`;
    const description = `You are cordially invited to the wedding of ${invitation.groomName} and ${invitation.brideName}.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(invitation.groomPhoto && { images: [{ url: invitation.groomPhoto }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(invitation.groomPhoto && { images: [invitation.groomPhoto] }),
      },
    };
  } catch {
    return {
      title: 'Wedding Invitation',
      description: 'You are cordially invited.',
    };
  }
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
