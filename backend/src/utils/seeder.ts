import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import AuditLog from '../models/AuditLog';

// Load Env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/enterprise-electronics';

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding... 🔌');
    await mongoose.connect(dbUri);
    console.log('Connected! Clearing existing collections... 🧹');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Collections cleared! Seeding categories and brands... 🌱');

    // 1. Seed Categories
    const laptopCat = await Category.create({ name: 'Laptop', slug: 'laptop', description: 'Business & Gaming laptops' });
    const cctvCat = await Category.create({ name: 'CCTV Camera', slug: 'cctv-camera', description: 'Dome & Bullet security cameras' });
    const softwareCat = await Category.create({ name: 'Billing Software', slug: 'billing-software', description: 'Automated POS & Billing software licenses' });
    const networkingCat = await Category.create({ name: 'Networking', slug: 'networking', description: 'Switches, routers & cables' });
    const printerCat = await Category.create({ name: 'Printer', slug: 'printer', description: 'Workgroup printers & scanners' });
    const ramCat = await Category.create({ name: 'RAM', slug: 'ram', description: 'High speed DDR4 & DDR5 memory' });

    // 2. Seed Brands
    const lenovoBrand = await Brand.create({ name: 'Lenovo', slug: 'lenovo', description: 'ThinkPad & Legion hardware' });
    const hikBrand = await Brand.create({ name: 'Hikvision', slug: 'hikvision', description: 'Commercial CCTV surveillance security systems' });
    const ciscoBrand = await Brand.create({ name: 'Cisco', slug: 'cisco', description: 'Enterprise networking switches & routers' });
    const hpBrand = await Brand.create({ name: 'HP', slug: 'hp', description: 'HP LaserJet & office computing lines' });
    const corsairBrand = await Brand.create({ name: 'Corsair', slug: 'corsair', description: 'High performance computer memory & storage' });
    const softBrand = await Brand.create({ name: 'EnterpriseSoft', slug: 'enterprisesoft', description: 'POS Software suites' });

    console.log('Categories and Brands seeded! Seeding products... 🛒');

    // 3. Seed Products
    const productsToSeed = [
      {
        name: 'ThinkPad X1 Carbon Gen 11',
        slug: 'thinkpad-x1-carbon-gen-11',
        sku: 'THINK-X1-C11',
        modelNumber: '21HM002JIG',
        description: 'The ultimate ultraportable business laptop. Features 13th Gen Intel Core i7, 16GB LPDDR5 RAM, 1TB NVMe SSD, and a stunning 14" WUXGA anti-glare IPS display.',
        category: laptopCat._id,
        brand: lenovoBrand._id,
        basePrice: 145000,
        gstPercentage: 18,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60'],
        videoUrl: 'https://www.youtube.com/watch?v=mock-video',
        variants: [
          { name: '16GB RAM / 512GB SSD', sku: 'THINK-X1-512', price: 135000, stock: 5 },
          { name: '16GB RAM / 1TB SSD', sku: 'THINK-X1-1TB', price: 145000, stock: 7 }
        ],
        specifications: [
          { name: 'Processor', value: 'Intel Core i7-1355U' },
          { name: 'RAM', value: '16GB LPDDR5' },
          { name: 'SSD', value: '1TB NVMe PCIe Gen4' },
          { name: 'Operating System', value: 'Windows 11 Pro' },
          { name: 'Graphics Card', value: 'Intel Iris Xe Graphics' }
        ],
        warrantyMonths: 36,
        accessoriesIncluded: ['ThinkPad Ethernet Extension Adapter', '65W USB-C Adapter', 'User Manual'],
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        ratingsAverage: 4.8,
        ratingsQuantity: 14
      },
      {
        name: 'Hikvision 4MP Dome Network Camera',
        slug: 'hikvision-4mp-dome-network-camera',
        sku: 'HIK-DOM-4MP',
        modelNumber: 'DS-2CD2143G0-I',
        description: 'High quality imaging with 4 MP resolution. Clear imaging against strong back light due to 120 dB WDR technology. Water and dust resistant (IP67) and vandal proof (IK10).',
        category: cctvCat._id,
        brand: hikBrand._id,
        basePrice: 4200,
        gstPercentage: 18,
        stock: 45,
        images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60'],
        specifications: [
          { name: 'Camera Resolution', value: '4 Megapixel (2688x1520)' },
          { name: 'Lens', value: '2.8mm Fixed' },
          { name: 'IR Range', value: 'Up to 30 meters' },
          { name: 'Compression', value: 'H.265+' }
        ],
        warrantyMonths: 24,
        accessoriesIncluded: ['Wall Mount Base', 'Screw Kit', 'Waterproof Terminal Cover', 'Quick Start Guide'],
        isFeatured: true,
        isNewArrival: true,
        ratingsAverage: 4.5,
        ratingsQuantity: 32
      },
      {
        name: 'Enterprise Billing & POS Software',
        slug: 'enterprise-billing-pos-software',
        sku: 'BILL-SW-ENT',
        modelNumber: 'EB-POS-V5',
        description: 'Comprehensive Retail & Wholesale inventory billing software. Includes GST calculation, barcode printing, multi-counter support, thermal receipt printing, and real-time dashboard.',
        category: softwareCat._id,
        brand: softBrand._id,
        basePrice: 12000,
        gstPercentage: 18,
        stock: 9999,
        images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60'],
        specifications: [
          { name: 'Deployment', value: 'Windows OS (Local & Sync)' },
          { name: 'Database', value: 'Local SQLite / Cloud Sync' },
          { name: 'Reports', value: 'GST, Sales, Inventory, Ledger' },
          { name: 'Devices', value: 'Thermal Printer, Scanner, Cash Drawer' }
        ],
        warrantyMonths: 12,
        accessoriesIncluded: ['Digital Setup File (Download Link)', 'Standard License Key', 'User Guide PDF'],
        isFeatured: true,
        isBestSeller: true,
        ratingsAverage: 4.9,
        ratingsQuantity: 88
      },
      {
        name: 'Cisco C9200L Gigabit 24-Port Switch',
        slug: 'cisco-c9200l-gigabit-24-port-switch',
        sku: 'CISCO-9200L-24',
        modelNumber: 'C9200L-24T-4G-E',
        description: 'Cisco Catalyst 9200 Series switches extend the power of intent-based networking and Catalyst 9000 hardware and software innovation to a broader set of deployments.',
        category: networkingCat._id,
        brand: ciscoBrand._id,
        basePrice: 85000,
        gstPercentage: 18,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60'],
        specifications: [
          { name: 'Ports', value: '24 x 10/100/1000' },
          { name: 'Uplinks', value: '4 x 1G SFP' },
          { name: 'Layer', value: 'Layer 3 Access Switch' },
          { name: 'Software', value: 'Network Essentials' }
        ],
        warrantyMonths: 36,
        accessoriesIncluded: ['Rackmount Ears Kit', 'Power Cord', 'Console Cable', 'Rubber Feet Set'],
        isFeatured: false,
        isNewArrival: true,
        ratingsAverage: 4.6,
        ratingsQuantity: 6
      },
      {
        name: 'HP LaserJet Pro M404dn Printer',
        slug: 'hp-laserjet-pro-m404dn-printer',
        sku: 'HP-LJP-M404',
        modelNumber: 'W1A53A',
        description: 'Designed to let you focus on growing your business. Fast print speeds (up to 40 ppm), automatic two-sided printing, and strong security built-in.',
        category: printerCat._id,
        brand: hpBrand._id,
        basePrice: 28500,
        gstPercentage: 18,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=60'],
        specifications: [
          { name: 'Print Speed', value: 'Up to 40 ppm' },
          { name: 'Duplex Printing', value: 'Automatic' },
          { name: 'Connectivity', value: 'Ethernet, USB' },
          { name: 'Duty Cycle', value: '80,000 pages monthly' }
        ],
        warrantyMonths: 12,
        accessoriesIncluded: ['HP Black LaserJet Toner Cartridge', 'Getting Started Guide', 'Support Flyer', 'Warranty Guide', 'Power Cord'],
        isFeatured: false,
        isBestSeller: true,
        ratingsAverage: 4.4,
        ratingsQuantity: 21
      },
      {
        name: 'Corsair Vengeance LPX 16GB DDR4',
        slug: 'corsair-vengeance-lpx-16gb-ddr4',
        sku: 'COR-RAM-16D4',
        modelNumber: 'CMK16GX4M1E3200C16',
        description: 'Designed for high-performance overclocking. The heatspreader is made of pure aluminum for faster heat dissipation, and the custom performance PCB helps manage heat.',
        category: ramCat._id,
        brand: corsairBrand._id,
        basePrice: 3800,
        gstPercentage: 18,
        stock: 120,
        images: ['https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=60'],
        specifications: [
          { name: 'Capacity', value: '16GB' },
          { name: 'Type', value: 'DDR4 SDRAM' },
          { name: 'Speed', value: '3200 MHz' },
          { name: 'Latency', value: 'CL16' }
        ],
        warrantyMonths: 120, // 10 years
        accessoriesIncluded: ['RAM Memory DIMM Stick', 'Safety Flyer'],
        isFeatured: false,
        isNewArrival: false,
        ratingsAverage: 4.7,
        ratingsQuantity: 104
      }
    ];

    await Product.insertMany(productsToSeed);

    // 4. Seed Standard Coupons
    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365*24*60*60*1000),
      isActive: true,
      usageCount: 0
    });

    await Coupon.create({
      code: 'B2BDEAL',
      discountType: 'fixed',
      discountValue: 2000,
      minPurchase: 20000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365*24*60*60*1000),
      isActive: true,
      usageCount: 0
    });

    console.log('Products & Coupons seeded! Seeding demo accounts... 👥');

    // 5. Seed standard users (Admin, Employee, Customer)
    // admin@test.com
    await User.create({
      name: 'System Admin Coordinator',
      email: 'admin@test.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true
    });

    // employee@test.com
    await User.create({
      name: 'POS Support Clerk',
      email: 'employee@test.com',
      password: 'employeepassword123',
      role: 'employee',
      isVerified: true
    });

    // customer@test.com
    await User.create({
      name: 'Verified Business Buyer',
      email: 'customer@test.com',
      password: 'customerpassword123',
      role: 'customer',
      isVerified: true
    });

    console.log('Seeding complete! Closing database connection... 🏁');
    await mongoose.connection.close();
    console.log('Database connection closed. You are ready to run the app!');
  } catch (error: any) {
    console.error('Error during data seeding: 💥', error.message);
    process.exit(1);
  }
};

seedData();
