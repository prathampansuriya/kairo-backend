// Realistic Indian addresses generator for customers
export const indianMetroAddresses = [
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

export const generateCustomerAddresses = (users) => {
  const addresses = [];

  users.forEach((user, idx) => {
    // 1-2 addresses per customer
    const primary = indianMetroAddresses[idx % indianMetroAddresses.length];
    addresses.push({
      userId: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phoneNumber,
      addressLine1: primary.addressLine1,
      addressLine2: primary.addressLine2,
      city: primary.city,
      state: primary.state,
      pincode: primary.pincode,
      addressType: primary.addressType,
      isDefaultShipping: true,
      isDefaultBilling: true
    });

    // Provide a second address for alternate customers
    if (idx % 2 === 0) {
      const secondary = indianMetroAddresses[(idx + 4) % indianMetroAddresses.length];
      addresses.push({
        userId: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phoneNumber,
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

  return addresses;
};
