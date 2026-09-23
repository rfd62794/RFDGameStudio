import { Sparkles, Flame, Droplets, Compass, Shield, Swords } from 'lucide-react';
import { TitleScreen, Card } from '../../../ui/components';

interface IntroScreenProps {
  onStartGame: () => void;
}

const FEATURES = [
  {
    icon: <Flame style={{ width: '1.25rem', height: '1.25rem', color: 'var(--red)' }} />,
    title: 'Elemental Chemistry',
    body: 'Combine up to 2 Elements from your hand with an infinite Component (Strike, Ward, Mend, Blight). Same elements amplify; adjacent hybridize; opposed trigger volatile 50%/150% power flips.',
  },
  {
    icon: <Droplets style={{ width: '1.25rem', height: '1.25rem', color: 'var(--accent)' }} />,
    title: 'The Residue Field',
    body: 'Unspent chemicals accumulate in the cauldron. Burning deals DoT, Soaked weakens intents, Fortified blocks overrides, and Windswept doubles other effects. Opposed elements cleanse the field.',
  },
  {
    icon: <Compass style={{ width: '1.25rem', height: '1.25rem', color: 'var(--green)' }} />,
    title: 'Descending the Halls',
    body: 'Survive a 9-node linear descent through the ruined alchemical cauldron floors. Forage new element combinations, rest at purge furnaces, and defeat the final Rootbound Guardian.',
  },
  {
    icon: <Shield style={{ width: '1.25rem', height: '1.25rem', color: 'var(--yellow)' }} />,
    title: 'No Free Refills',
    body: 'No mana resource exists. Your hand is your fuel. Remaining elements discard each turn. Anticipate telegraphed enemy values precisely to survive.',
  },
];

export default function IntroScreen({ onStartGame }: IntroScreenProps) {
  return (
    <TitleScreen
      id="intro-container"
      title="Brewfield"
      tagline={
        <>
          <Sparkles style={{ width: '0.875rem', height: '0.875rem' }} />
          Alchemical Battler
        </>
      }
      quote="Every brew is a committed uncertainty, a calculated risk about to become irreversible."
      menuItems={[
        {
          id: 'start',
          label: 'Descend the Cauldron Hall',
          icon: <Swords style={{ width: '1.25rem', height: '1.25rem' }} />,
          onClick: onStartGame,
          variant: 'primary',
        },
      ]}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          textAlign: 'left',
          marginTop: 'var(--space-6)',
        }}
      >
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="intro-feature-card">
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div
                style={{
                  flexShrink: 0,
                  padding: 'var(--space-2)',
                  height: 'fit-content',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                {feature.icon}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.body}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
          }}
        >
          Starting deck: 2 Fire · 2 Water · 2 Earth · 2 Air
        </span>
      </div>
    </TitleScreen>
  );
}
