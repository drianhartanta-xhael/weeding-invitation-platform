'use client';

import { motion } from 'framer-motion';

interface FooterProps {
  groomName: string;
  brideName: string;
  eventDate?: string;
  footerTitle?: string;
  footerMessage?: string;
  regionStripe?: string;
  regionLabel?: string;
  decorConfig?: unknown;
  light?: boolean;
  illustration?: string;
}

function formatDateShort(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Footer({ groomName, brideName, eventDate, footerMessage, regionStripe, regionLabel, light, illustration }: FooterProps) {
  const bg = light ? 'var(--wedding-secondary, #f5f3eb)' : 'var(--wedding-primary, #6B1020)';
  const nameColor = light ? 'var(--wedding-primary, #823460)' : 'var(--wedding-secondary, #F5EDE0)';
  const subText = light ? 'color-mix(in srgb, var(--wedding-primary, #823460) 65%, transparent)' : 'rgba(245,237,224,0.65)';
  const dateText = light ? 'color-mix(in srgb, var(--wedding-primary, #823460) 55%, transparent)' : 'rgba(245,237,224,0.6)';
  const dividerBg = light ? 'color-mix(in srgb, var(--wedding-accent, #ba6193) 45%, transparent)' : 'rgba(200,168,75,0.4)';
  const quoteAttr = light ? 'color-mix(in srgb, var(--wedding-accent, #ba6193) 80%, transparent)' : 'rgba(200,168,75,0.7)';

  return (
    <footer
      className="text-center relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {regionStripe && (
        <div aria-hidden style={{ height: 4, background: regionStripe }} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto py-16 px-4"
      >
        {illustration && (
          <img
            src={illustration}
            alt=""
            aria-hidden
            className="w-44 sm:w-52 h-auto mx-auto mb-8 object-contain"
          />
        )}

        <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          {regionLabel || 'Nusantara Wedding'}
        </p>

        <h2 className="font-heading text-4xl md:text-5xl italic mb-2" style={{ color: nameColor }}>
          {groomName} &amp; {brideName}
        </h2>

        {eventDate && (
          <p className="text-sm mb-8" style={{ color: dateText }}>
            {formatDateShort(eventDate)}
          </p>
        )}

        <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: dividerBg }} />

        {footerMessage ? (
          <p className="text-sm leading-relaxed" style={{ color: subText }}>
            {footerMessage}
          </p>
        ) : (
          <div>
            <p className="text-xs italic leading-relaxed mb-2" style={{ color: subText }}>
              &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
              isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya&rdquo;
            </p>
            <p className="text-xs tracking-widest" style={{ color: quoteAttr }}>
              — QS. Ar-Rum : 21
            </p>
          </div>
        )}
      </motion.div>
    </footer>
  );
}
