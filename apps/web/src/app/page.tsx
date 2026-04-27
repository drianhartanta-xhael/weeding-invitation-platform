import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <Heart className="h-14 w-14 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Wedding Invitation Platform</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create beautiful wedding invitations for your clients
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
