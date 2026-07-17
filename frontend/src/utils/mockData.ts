export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  modelNumber: string;
  category: string;
  brand: string;
  basePrice: number;
  gstPercentage: number;
  stock: number;
  images: string[];
  description: string;
  specifications: { name: string; value: string }[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  ratingsAverage: number;
  warrantyMonths?: number;
  accessoriesIncluded?: string[];
}

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'ThinkPad X1 Carbon Gen 11',
    sku: 'THINK-X1-C11',
    modelNumber: '21HM002JIG',
    category: 'Laptop',
    brand: 'Lenovo',
    basePrice: 145000,
    gstPercentage: 18,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60'],
    description: 'The ultimate ultraportable business laptop. Features 13th Gen Intel Core i7, 16GB LPDDR5 RAM, 1TB NVMe SSD, and a stunning 14" WUXGA anti-glare IPS display.',
    specifications: [
      { name: 'Processor', value: 'Intel Core i7-1355U' },
      { name: 'RAM', value: '16GB LPDDR5' },
      { name: 'SSD', value: '1TB NVMe PCIe Gen4' },
      { name: 'Operating System', value: 'Windows 11 Pro' },
      { name: 'Warranty', value: '3 Years Onsite' }
    ],
    isFeatured: true,
    isBestSeller: true,
    ratingsAverage: 4.8
  },
  {
    id: 'prod-2',
    name: 'Hikvision 4MP Dome Network Camera',
    sku: 'HIK-DOM-4MP',
    modelNumber: 'DS-2CD2143G0-I',
    category: 'CCTV Camera',
    brand: 'Hikvision',
    basePrice: 4200,
    gstPercentage: 18,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60'],
    description: 'High quality imaging with 4 MP resolution. Clear imaging against strong back light due to 120 dB WDR technology. Water and dust resistant (IP67) and vandal proof (IK10).',
    specifications: [
      { name: 'Camera Resolution', value: '4 Megapixel (2688x1520)' },
      { name: 'Lens', value: '2.8mm Fixed' },
      { name: 'IR Range', value: 'Up to 30 meters' },
      { name: 'Compression', value: 'H.265+' }
    ],
    isFeatured: true,
    isNewArrival: true,
    ratingsAverage: 4.5
  },
  {
    id: 'prod-3',
    name: 'Enterprise Billing & POS Software',
    sku: 'BILL-SW-ENT',
    modelNumber: 'EB-POS-V5',
    category: 'Billing Software',
    brand: 'EnterpriseSoft',
    basePrice: 12000,
    gstPercentage: 18,
    stock: 9999, // digital item
    images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60'],
    description: 'Comprehensive Retail & Wholesale inventory billing software. Includes GST calculation, barcode printing, multi-counter support, thermal receipt printing, and real-time dashboard.',
    specifications: [
      { name: 'Deployment', value: 'Windows OS (Local & Sync)' },
      { name: 'Database', value: 'Local SQLite / Cloud Sync' },
      { name: 'Reports', value: 'GST, Sales, Inventory, Ledger' },
      { name: 'Devices', value: 'Thermal Printer, Scanner, Cash Drawer' }
    ],
    isFeatured: true,
    isBestSeller: true,
    ratingsAverage: 4.9
  },
  {
    id: 'prod-4',
    name: 'Cisco C9200L Gigabit 24-Port Switch',
    sku: 'CISCO-9200L-24',
    modelNumber: 'C9200L-24T-4G-E',
    category: 'Networking',
    brand: 'Cisco',
    basePrice: 85000,
    gstPercentage: 18,
    stock: 8,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60'],
    description: 'Cisco Catalyst 9200 Series switches extend the power of intent-based networking and Catalyst 9000 hardware and software innovation to a broader set of deployments.',
    specifications: [
      { name: 'Ports', value: '24 x 10/100/1000' },
      { name: 'Uplinks', value: '4 x 1G SFP' },
      { name: 'Layer', value: 'Layer 3 Access Switch' },
      { name: 'Software', value: 'Network Essentials' }
    ],
    isFeatured: false,
    isNewArrival: true,
    ratingsAverage: 4.6
  },
  {
    id: 'prod-5',
    name: 'HP LaserJet Pro M404dn Printer',
    sku: 'HP-LJP-M404',
    modelNumber: 'W1A53A',
    category: 'Printer',
    brand: 'HP',
    basePrice: 28500,
    gstPercentage: 18,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=60'],
    description: 'Designed to let you focus on growing your business. Fast print speeds (up to 40 ppm), automatic two-sided printing, and strong security built-in.',
    specifications: [
      { name: 'Print Speed', value: 'Up to 40 ppm' },
      { name: 'Duplex Printing', value: 'Automatic' },
      { name: 'Connectivity', value: 'Ethernet, USB' },
      { name: 'Duty Cycle', value: '80,000 pages monthly' }
    ],
    isFeatured: false,
    isBestSeller: true,
    ratingsAverage: 4.4
  },
  {
    id: 'prod-6',
    name: 'Corsair Vengeance LPX 16GB DDR4',
    sku: 'COR-RAM-16D4',
    modelNumber: 'CMK16GX4M1E3200C16',
    category: 'RAM',
    brand: 'Corsair',
    basePrice: 3800,
    gstPercentage: 18,
    stock: 120,
    images: ['https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=60'],
    description: 'Designed for high-performance overclocking. The heatspreader is made of pure aluminum for faster heat dissipation, and the custom performance PCB helps manage heat.',
    specifications: [
      { name: 'Capacity', value: '16GB' },
      { name: 'Type', value: 'DDR4 SDRAM' },
      { name: 'Speed', value: '3200 MHz' },
      { name: 'Latency', value: 'CL16' }
    ],
    isFeatured: false,
    isNewArrival: false,
    ratingsAverage: 4.7
  }
];
