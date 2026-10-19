import * as RT from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn';

// Label plus a 2px underline on the active tab. No fill, no inset shadow, no glow.
export const Tabs = RT.Root;
export const TabsContent = RT.Content;

export function TabsList({ className, ...rest }: RT.TabsListProps) {
  return <RT.List className={cn('flex gap-6 border-b border-line', className)} {...rest} />;
}

export function TabsTrigger({ className, ...rest }: RT.TabsTriggerProps) {
  return (
    <RT.Trigger
      className={cn(
        'relative flex h-11 items-center px-1 text-16 font-semibold text-ink2 transition-colors duration-150 hover:text-ink',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-[var(--bl-border-2)] after:rounded-full after:bg-accent after:opacity-0 after:transition-opacity',
        'data-[state=active]:text-ink data-[state=active]:after:opacity-100',
        className,
      )}
      {...rest}
    />
  );
}
