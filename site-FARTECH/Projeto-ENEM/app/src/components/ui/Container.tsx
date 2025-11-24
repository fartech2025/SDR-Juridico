import * as React from 'react';
import { cn } from '../../lib/cn';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Container({ className, ...props }: ContainerProps) {
  return <div className={cn('container-max w-full', className)} {...props} />;
}
