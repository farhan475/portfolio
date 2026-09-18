import { motion, useReducedMotion } from 'framer-motion';
import type { Cta } from '../../lib/schemas';

interface HeroIntroProps {
  greeting?: string | null;
  name: string;
  role?: string | null;
  description?: string | null;
  ctaPrimary?: Cta | null;
  ctaSecondary?: Cta | null;
}

export default function HeroIntro({
  greeting,
  name,
  role,
  description,
  ctaPrimary,
  ctaSecondary,
}: HeroIntroProps) {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: reduceMotion ? 0 : 0.05 },
    },
  };

  const item = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
      };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-w-0 max-w-xl">
      {greeting ? (
        <motion.p variants={item} className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
          {greeting}
        </motion.p>
      ) : null}

      <motion.h1 variants={item} className="text-3xl font-semibold break-words sm:text-4xl md:text-5xl lg:text-6xl">
        {name}
      </motion.h1>

      {role ? (
        <motion.p variants={item} className="mt-3 text-lg text-accent sm:text-xl md:text-2xl">
          {role}
        </motion.p>
      ) : null}

      {description ? (
        <motion.p variants={item} className="mt-4 text-sm leading-relaxed text-muted sm:mt-5 sm:text-base">
          {description}
        </motion.p>
      ) : null}

      {ctaPrimary || ctaSecondary ? (
        <motion.div variants={item} className="mt-7 flex flex-wrap gap-3 sm:mt-8">
          {ctaPrimary ? (
            <a
              href={ctaPrimary.href}
              className="grow rounded-md bg-primary px-5 py-3 text-center text-sm font-medium text-background wrap-anywhere transition-opacity hover:opacity-90 sm:grow-0 sm:py-2.5"
            >
              {ctaPrimary.label}
            </a>
          ) : null}
          {ctaSecondary ? (
            <a
              href={ctaSecondary.href}
              className="grow rounded-md border border-border-strong px-5 py-3 text-center text-sm font-medium wrap-anywhere transition-colors hover:border-primary sm:grow-0 sm:py-2.5"
            >
              {ctaSecondary.label}
            </a>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
