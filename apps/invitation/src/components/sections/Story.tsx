'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

interface StoryItem {
  title: string;
  date: string;
  description: string;
  image: string;
}

interface StoryProps {
  stories: StoryItem[];
  layout?: 'vertical' | 'horizontal';
}

function VerticalTimeline({ stories }: { stories: StoryItem[] }) {
  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Center line (desktop) / left line (mobile) */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-wedding-primary opacity-30 -translate-x-1/2" />

      {stories.map((item, idx) => {
        const isLeft = idx % 2 === 0;

        return (
          <div key={idx} className="relative mb-12 last:mb-0">
            {/* Dot on the line */}
            <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-wedding-primary rounded-full -translate-x-1/2 top-1 z-10 border-2 border-white shadow-sm" />

            {/* Mobile: always right of line */}
            <div className="md:hidden pl-14">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <StoryCard item={item} />
              </motion.div>
            </div>

            {/* Desktop: alternating */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-12">
              {isLeft ? (
                <>
                  <motion.div
                    className="text-right pr-8"
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <StoryCard item={item} align="right" />
                  </motion.div>
                  <div />
                </>
              ) : (
                <>
                  <div />
                  <motion.div
                    className="pl-8"
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <StoryCard item={item} />
                  </motion.div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalTimeline({ stories }: { stories: StoryItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-5xl mx-auto relative">
      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-6 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div className="relative inline-flex items-start gap-0" style={{ minWidth: 'max-content' }}>
          {/* Horizontal line */}
          <div
            className="absolute top-[140px] left-8 right-8 h-px bg-wedding-primary opacity-30"
          />

          {stories.map((item, idx) => {
            const isAbove = idx % 2 === 0;

            return (
              <motion.div
                key={idx}
                className="relative flex-shrink-0 w-[280px] px-4"
                style={{ scrollSnapAlign: 'center' }}
                initial={{ opacity: 0, y: isAbove ? -30 : 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Dot */}
                <div className="absolute left-1/2 top-[140px] w-4 h-4 bg-wedding-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-10 border-2 border-white shadow-sm" />

                {isAbove ? (
                  <div className="pb-10">
                    <StoryCard item={item} compact />
                  </div>
                ) : (
                  <div className="pt-[168px]">
                    <StoryCard item={item} compact />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StoryCard({
  item,
  align = 'left',
  compact = false,
}: {
  item: StoryItem;
  align?: 'left' | 'right';
  compact?: boolean;
}) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className={`w-full ${compact ? 'h-32' : 'h-40'} object-cover rounded-lg mb-3`}
        />
      )}
      <h3 className="font-heading text-lg text-wedding-accent">{item.title}</h3>
      {item.date && (
        <span className="inline-block mt-1 px-2 py-0.5 bg-wedding-primary/10 text-wedding-primary text-xs rounded-full">
          {item.date}
        </span>
      )}
      {item.description && (
        <p className={`text-sm text-gray-600 mt-2 ${compact ? 'line-clamp-3' : ''}`}>
          {item.description}
        </p>
      )}
    </div>
  );
}

export default function Story({ stories, layout = 'vertical' }: StoryProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl text-center text-wedding-accent mb-12"
      >
        Our Story
      </motion.h2>

      {layout === 'horizontal' ? (
        <HorizontalTimeline stories={stories} />
      ) : (
        <VerticalTimeline stories={stories} />
      )}
    </section>
  );
}
