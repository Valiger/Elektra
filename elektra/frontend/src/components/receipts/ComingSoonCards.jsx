import React from 'react';

const COMING_SOON = [
  {
    icon: 'electrical_services',
    title: 'Appliance Library',
    description:
      'Browse typical wattage ratings for common Philippine household appliances and calculate your daily energy cost.',
    accentColor: '#d5bbff',
    accentBg: 'rgba(213,187,255,0.10)',
  },
];

/**
 * ComingSoonCards
 *
 * Always visible, always pointer-events-none / blurred — no props needed.
 */
export default function ComingSoonCards() {
  return (
    <section id="coming-soon-cards" className="flex flex-col gap-3">
      {/* Section header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60">
          What's next
        </p>
        <h2 className="font-headline font-bold text-on-surface text-lg leading-tight">
          Coming Soon
        </h2>
      </div>

      {COMING_SOON.map((card) => (
        <div
          key={card.title}
          className="relative rounded-2xl overflow-hidden select-none"
          style={{
            opacity: 0.52,
            pointerEvents: 'none',
          }}
        >
          {/* Card body */}
          <div
            className="p-5 flex items-start gap-4"
            style={{ background: 'rgba(180,150,230,0.11)' }}
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 p-3 rounded-2xl"
              style={{ background: card.accentBg }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: card.accentColor }}
              >
                {card.icon}
              </span>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="font-headline font-bold text-on-surface text-sm">{card.title}</h3>
              <p className="text-secondary text-xs leading-relaxed opacity-80">
                {card.description}
              </p>
            </div>
          </div>

          {/* Backdrop blur overlay */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          />

          {/* Coming Soon badge */}
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(60,32,128,0.90)' }}
          >
            <span
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: '#cfbfef' }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
