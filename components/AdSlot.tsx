// Reserved ad space. Reserving the height up front avoids layout jumps (good for Core Web Vitals / SEO).
// - In development it shows a dashed placeholder so you can see where ads will go.
// - In production it renders NOTHING until you set NEXT_PUBLIC_ADS_ENABLED=true.
// - To show real ads: paste your ad network code (e.g. AdSense <ins> tag) where marked below.
type Props = { id: string; size: 'rect' | 'leader' };

export default function AdSlot({ id, size }: Props) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
  const dev = process.env.NODE_ENV !== 'production';
  if (!enabled && !dev) return null;
  return (
    <aside className={`ad ad-${size}`} aria-label="Advertisement" data-ad-slot={id}>
      {!enabled && <span>Ad space · {size === 'rect' ? '300×250' : '728×90 / 320×100'}</span>}
      {/* PASTE YOUR AD CODE HERE (shown only when NEXT_PUBLIC_ADS_ENABLED=true) */}
    </aside>
  );
}
