'use client';

import { useEffect, useState } from 'react';

// dega-ditta cover palette. Hardcoded because the template's colors arrive with
// the API response and are not yet available while the page is loading.
const PLUM = '#6B1020';
const GOLD = '#C8A84B';

/**
 * Branded loading placeholder shown while the invitation page fetches its data.
 * Mirrors dega-ditta's Cover layout (the coverImage variant) so the real Cover
 * overlay fades in seamlessly. The plum background paints instantly; the shimmer
 * blocks fade in after a short delay so a fast load doesn't flash a skeleton.
 */
export default function LoadingSkeleton() {
  const [showBlocks, setShowBlocks] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBlocks(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: PLUM }}
      role="status"
      aria-busy="true"
      aria-label="Loading invitation"
    >
      <div
        className="flex flex-col items-center text-center w-full max-w-lg transition-opacity duration-500"
        style={{ opacity: showBlocks ? 1 : 0 }}
      >
        {/* invite text line */}
        <Block className="h-3 w-40 mb-6 rounded-full" />
        {/* couple names */}
        <Block className="h-9 w-72 sm:w-96 mb-8 rounded-lg" />
        {/* envelope image area */}
        <Block className="h-40 w-56 sm:h-48 sm:w-72 mb-8 rounded-2xl" />
        {/* "click to open" line */}
        <Block className="h-3 w-48 rounded-full" />
      </div>
    </div>
  );
}

function Block({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{ backgroundColor: `${GOLD}22` }}
    />
  );
}
