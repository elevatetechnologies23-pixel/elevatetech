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

export const MOCK_PRODUCTS: ProductItem[] = [];
