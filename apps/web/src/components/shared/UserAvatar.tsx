import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { brandTone, cn, initials } from '@/lib/utils';

const SIZES = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm', xl: 'size-20 text-xl' } as const;

export function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: { id: string; fullName: string; avatarUrl?: string | null };
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
      <AvatarFallback
        className="font-semibold"
        style={{ background: brandTone(user.id).bg, color: brandTone(user.id).fg }}
      >
        {initials(user.fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
