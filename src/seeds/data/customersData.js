import bcrypt from 'bcryptjs';

const defaultCustomerHash = bcrypt.hashSync('KairoCustomer2026!', 10);

export const customersData = [
  {
    firstName: 'Arjun',
    lastName: 'Kapoor',
    email: 'arjun.kapoor@example.com',
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
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
    passwordHash: defaultCustomerHash,
    phoneNumber: '9820992255',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Meera',
    lastName: 'Sen',
    email: 'meera.sen@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810113366',
    role: 'customer',
    status: 'active',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    firstName: 'Siddharth',
    lastName: 'Rao',
    email: 'siddharth.rao@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810224477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Ishaan',
    lastName: 'Verma',
    email: 'ishaan.verma@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810335588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Nisha',
    lastName: 'Agarwal',
    email: 'nisha.agarwal@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810446699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Aditya',
    lastName: 'Chopra',
    email: 'aditya.chopra@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810557700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Rhea',
    lastName: 'Bose',
    email: 'rhea.bose@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810668811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Kabir',
    lastName: 'Menon',
    email: 'kabir.menon@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810779922',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Anand',
    lastName: 'Kulkarni',
    email: 'anand.kulkarni@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810880033',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Pooja',
    lastName: 'Reddy',
    email: 'pooja.reddy@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9810991144',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Varun',
    lastName: 'Malhotra',
    email: 'varun.malhotra@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710112255',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Shreya',
    lastName: 'Iyer',
    email: 'shreya.iyer@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710223366',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Gaurav',
    lastName: 'Joshi',
    email: 'gaurav.joshi@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710334477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Alia',
    lastName: 'Merchant',
    email: 'alia.merchant@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710445588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Karan',
    lastName: 'Suri',
    email: 'karan.suri@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710556699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Diya',
    lastName: 'Nambiar',
    email: 'diya.nambiar@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710667700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Manish',
    lastName: 'Trivedi',
    email: 'manish.trivedi@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710778811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Natasha',
    lastName: 'Wadia',
    email: 'natasha.wadia@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710889922',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Sameer',
    lastName: 'Grover',
    email: 'sameer.grover@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9710990033',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Tara',
    lastName: 'Sundaram',
    email: 'tara.sundaram@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610111144',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Nikhil',
    lastName: 'Bansal',
    email: 'nikhil.bansal@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610222255',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Zoya',
    lastName: 'Khan',
    email: 'zoya.khan@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610333366',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Harsh',
    lastName: 'Vardhan',
    email: 'harsh.vardhan@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610444477',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Simran',
    lastName: 'Kaur',
    email: 'simran.kaur@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610555588',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Akash',
    lastName: 'Saxena',
    email: 'akash.saxena@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610666699',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Neha',
    lastName: 'Pillai',
    email: 'neha.pillai@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610777700',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Pranav',
    lastName: 'Dutta',
    email: 'pranav.dutta@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610888811',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Kriti',
    lastName: 'Sanon',
    email: 'kriti.sanon@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9610999922',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Rajesh',
    lastName: 'Jhunjhunwala',
    email: 'rajesh.j@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9510112233',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Anushka',
    lastName: 'Roy',
    email: 'anushka.roy@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9510223344',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Tushar',
    lastName: 'Gupta',
    email: 'tushar.gupta@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9510334455',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  },
  {
    firstName: 'Sanya',
    lastName: 'Mirza',
    email: 'sanya.mirza@example.com',
    passwordHash: defaultCustomerHash,
    phoneNumber: '9510445566',
    role: 'customer',
    status: 'active',
    isEmailVerified: true
  }
];
