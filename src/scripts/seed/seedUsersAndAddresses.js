import bcrypt from 'bcryptjs';
import { User } from '../../models/User.js';
import { Address } from '../../models/Address.js';

// Pre-computed hash with bcrypt cost 12
const CUSTOMER_PASSWORD = 'KairoCustomer2026!';
const ADMIN_PASSWORD = 'KairoSuperSecret2026!';
const customerHash = bcrypt.hashSync(CUSTOMER_PASSWORD, 12);
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 12);

export const adminSeedData = [
  {
    firstName: 'Atelier',
    lastName: 'Superadmin',
    email: 'superadmin@kairo-horology.com',
    passwordHash: adminHash,
    phoneNumber: '9820000001',
    role: 'superadmin',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Marcus',
    lastName: 'Vane',
    email: 'marcus.vane@kairo-horology.com',
    passwordHash: adminHash,
    phoneNumber: '9820000002',
    role: 'admin',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Horology',
    lastName: 'Inventory',
    email: 'inventory.manager@kairo-horology.com',
    passwordHash: adminHash,
    phoneNumber: '9820000003',
    role: 'order_manager',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Concierge',
    lastName: 'Staff',
    email: 'concierge.support@kairo-horology.com',
    passwordHash: adminHash,
    phoneNumber: '9820000004',
    role: 'support',
    status: 'active',
    isEmailVerified: true
  }
];

export const customerSeedData = [
  {
    firstName: 'Arjun',
    lastName: 'Kapoor',
    email: 'arjun.kapoor@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820114477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820225588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Vikram',
    lastName: 'Mehta',
    email: 'vikram.mehta@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820336699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    email: 'ananya.deshmukh@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820447700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Rohit',
    lastName: 'Singhania',
    email: 'rohit.singhania@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820558811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Tanvi',
    lastName: 'Patel',
    email: 'tanvi.patel@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820669922',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Kavita',
    lastName: 'Nair',
    email: 'kavita.nair@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820770033',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Dev',
    lastName: 'Choudhury',
    email: 'dev.choudhury@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820881144',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Rohan',
    lastName: 'Bhatia',
    email: 'rohan.bhatia@example.com',
    passwordHash: customerHash,
    phoneNumber: '9820992255',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Sunita',
    lastName: 'Verma',
    email: 'sunita.verma@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821003366',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Kabir',
    lastName: 'Malhotra',
    email: 'kabir.malhotra@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821114477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha.khan@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821225588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Siddharth',
    lastName: 'Rao',
    email: 'siddharth.rao@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821336699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Meera',
    lastName: 'Iyer',
    email: 'meera.iyer@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821447700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Aditya',
    lastName: 'Saxena',
    email: 'aditya.saxena@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821558811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Tara',
    lastName: 'Sengupta',
    email: 'tara.sengupta@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821669922',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Karan',
    lastName: 'Oberoi',
    email: 'karan.oberoi@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821770033',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Divya',
    lastName: 'Kulkarni',
    email: 'divya.kulkarni@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821881144',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Sameer',
    lastName: 'Chopra',
    email: 'sameer.chopra@example.com',
    passwordHash: customerHash,
    phoneNumber: '9821992255',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Zoya',
    lastName: 'Mirza',
    email: 'zoya.mirza@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822003366',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Nikhil',
    lastName: 'Joshi',
    email: 'nikhil.joshi@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822114477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Rhea',
    lastName: 'Pillai',
    email: 'rhea.pillai@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822225588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Gaurav',
    lastName: 'Trivedi',
    email: 'gaurav.trivedi@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822336699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Shalini',
    lastName: 'Reddy',
    email: 'shalini.reddy@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822447700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Varun',
    lastName: 'Nambiar',
    email: 'varun.nambiar@example.com',
    passwordHash: customerHash,
    phoneNumber: '9822558811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
  }
];

export const metroAddresses = [
  {
    addressLine1: 'Penthouse 42, The Imperial Towers, Tardeo Road',
    addressLine2: 'Near AC Market',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400034',
    addressType: 'home'
  },
  {
    addressLine1: 'Suite 1204, Lodha World One, Senapati Bapat Marg',
    addressLine2: 'Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    addressType: 'office'
  },
  {
    addressLine1: 'Bungalow 7, Amrita Shergill Marg',
    addressLine2: 'Lutyens Bungalow Zone',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110003',
    addressType: 'home'
  },
  {
    addressLine1: 'Tower B, Floor 14, DLF Cyber City, Sector 24',
    addressLine2: 'DLF Phase 2',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    addressType: 'office'
  },
  {
    addressLine1: 'Villa 18, Prestige Golfshire, Nandi Hills Road',
    addressLine2: 'Devanahalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '562110',
    addressType: 'home'
  },
  {
    addressLine1: 'UB City Concorde Block, 8th Floor, Vittal Mallya Road',
    addressLine2: 'Lavelle Road Junction',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    addressType: 'office'
  },
  {
    addressLine1: '45 Boat Club Road, Raja Annamalai Puram',
    addressLine2: 'Adyar Riverfront',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600028',
    addressType: 'home'
  },
  {
    addressLine1: 'Plot 108, Road No. 36, Jubilee Hills',
    addressLine2: 'Near Peddamma Temple',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    addressType: 'home'
  },
  {
    addressLine1: 'Bungalow 12, Koregaon Park North Main Road',
    addressLine2: 'Lane 5, Near Osho Ashram',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    addressType: 'home'
  },
  {
    addressLine1: '32 Ballygunge Circular Road',
    addressLine2: 'Near Military Camp',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700019',
    addressType: 'home'
  },
  {
    addressLine1: 'Shantigram Golf Villa 104, SG Highway',
    addressLine2: 'Near Vaishnodevi Circle',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382421',
    addressType: 'home'
  },
  {
    addressLine1: 'Civil Lines Heritage House, Jacob Road',
    addressLine2: 'Near Raj Bhavan',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302006',
    addressType: 'home'
  }
];

export async function seedUsersAndAddresses() {
  console.log('\n--- [PHASE 10: CUSTOMER & ADDRESS SEEDING] ---');

  // Insert administrative accounts
  const createdAdmins = await User.insertMany(adminSeedData);
  console.log(`✓ Seeded ${createdAdmins.length} administrative accounts.`);

  // Insert customer accounts (25 customers)
  const createdCustomers = await User.insertMany(customerSeedData);
  console.log(`✓ Seeded ${createdCustomers.length} luxury customer profiles.`);

  // Generate and insert addresses
  const addressesToInsert = [];
  createdCustomers.forEach((customer, idx) => {
    const primary = metroAddresses[idx % metroAddresses.length];
    addressesToInsert.push({
      userId: customer._id,
      fullName: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phoneNumber,
      addressLine1: primary.addressLine1,
      addressLine2: primary.addressLine2,
      city: primary.city,
      state: primary.state,
      pincode: primary.pincode,
      addressType: primary.addressType,
      isDefaultShipping: true,
      isDefaultBilling: true
    });

    // Provide secondary address for alternate customers
    if (idx % 2 === 0) {
      const secondary = metroAddresses[(idx + 4) % metroAddresses.length];
      addressesToInsert.push({
        userId: customer._id,
        fullName: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phoneNumber,
        addressLine1: secondary.addressLine1,
        addressLine2: secondary.addressLine2,
        city: secondary.city,
        state: secondary.state,
        pincode: secondary.pincode,
        addressType: secondary.addressType === 'home' ? 'office' : 'home',
        isDefaultShipping: false,
        isDefaultBilling: false
      });
    }
  });

  const createdAddresses = await Address.insertMany(addressesToInsert);
  console.log(`✓ Seeded ${createdAddresses.length} verified Indian metro addresses.`);

  return {
    admins: createdAdmins,
    customers: createdCustomers,
    addresses: createdAddresses
  };
}

export default seedUsersAndAddresses;
