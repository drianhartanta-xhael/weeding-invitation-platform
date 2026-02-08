'use client';

import { motion } from 'framer-motion';

interface CoupleProps {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
}

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8 },
};

export default function Couple({
  groomName,
  brideName,
  groomPhoto,
  bridePhoto,
  groomParents,
  brideParents,
}: CoupleProps) {
  return (
    <section className="py-20 px-4 bg-white">
      <motion.h2
        {...fadeInUp}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-16"
      >
        The Happy Couple
      </motion.h2>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Groom */}
        <motion.div {...fadeInUp} className="text-center">
          <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden bg-gray-200">
            {groomPhoto && (
              <img
                src={groomPhoto}
                alt={groomName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h3 className="font-heading text-2xl text-wedding-accent mb-2">
            {groomName}
          </h3>
          <p className="text-gray-500 text-sm">
            Son of {groomParents.father} & {groomParents.mother}
          </p>
        </motion.div>

        {/* Bride */}
        <motion.div {...fadeInUp} className="text-center">
          <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden bg-gray-200">
            {bridePhoto && (
              <img
                src={bridePhoto}
                alt={brideName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h3 className="font-heading text-2xl text-wedding-accent mb-2">
            {brideName}
          </h3>
          <p className="text-gray-500 text-sm">
            Daughter of {brideParents.father} & {brideParents.mother}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
