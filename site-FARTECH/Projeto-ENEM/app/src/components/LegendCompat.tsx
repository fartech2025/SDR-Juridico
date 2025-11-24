import type { ComponentProps } from 'react';
import { Legend as RechartsLegend } from 'recharts';

type LegendProps = ComponentProps<typeof RechartsLegend>;

export default function LegendCompat(props: LegendProps) {
  return <RechartsLegend {...props} />;
}

