export type Role = 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN';

export function roleLabel(role: Role, currentYear?: number | null) {
  if (role === 'ALUMNI') return 'Alumni';
  if (role === 'SENIOR') return 'Senior';
  if (role === 'ADMIN') return 'Admin';
  if (currentYear === 1) return 'First year';
  if (currentYear === 2 || currentYear === 3) return 'Junior';
  return 'Student';
}

export function RoleBadge({ role, currentYear }: { role: Role; currentYear?: number | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
      {roleLabel(role, currentYear)}
    </span>
  );
}
