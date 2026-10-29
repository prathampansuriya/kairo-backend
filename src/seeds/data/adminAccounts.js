import bcrypt from 'bcryptjs';

// Pre-computed bcrypt hash for 'KairoSuperSecret2026!' and 'KairoCustomer2026!'
// to ensure rapid, deterministic seeding without slowing down execution
const defaultAdminHash = bcrypt.hashSync('KairoSuperSecret2026!', 10);
const defaultStaffHash = bcrypt.hashSync('KairoStaff2026!', 10);

export const adminAccountsData = [
  {
    firstName: 'Devendra',
    lastName: 'Singhania',
    email: 'superadmin@kairo-horology.com',
    passwordHash: defaultAdminHash,
    phoneNumber: '9820011223',
    role: 'superadmin',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Aarav',
    lastName: 'Venkatesh',
    email: 'admin@kairo-horology.com',
    passwordHash: defaultAdminHash,
    phoneNumber: '9820022334',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Meera',
    lastName: 'Kapoor',
    email: 'catalog@kairo-horology.com',
    passwordHash: defaultStaffHash,
    phoneNumber: '9820033445',
    role: 'catalog_manager',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Kabir',
    lastName: 'Sengupta',
    email: 'concierge@kairo-horology.com',
    passwordHash: defaultStaffHash,
    phoneNumber: '9820044556',
    role: 'support',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  }
];
