import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 32, md: 40, lg: 56 };

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const px = sizes[size];
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        className={cn('rounded-full object-cover ring-2 ring-line', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-display font-bold text-white ring-2 ring-primary/20',
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
    >
      {initial}
    </div>
  );
}
