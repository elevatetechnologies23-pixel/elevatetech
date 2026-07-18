import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Review from '../models/Review';
import AuditLog from '../models/AuditLog';
import { AppError } from '../app';

// Helper to generate slug
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// -------------------------------------------------------------
// CATEGORIES & BRANDS CONTROLLERS
// -------------------------------------------------------------
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find();
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, parentId } = req.body;
    const category = await Category.create({
      name,
      slug: slugify(name),
      description,
      parentId: parentId || null
    });
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brands = await Brand.find();
    res.status(200).json({ status: 'success', data: brands });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, logoUrl, description } = req.body;
    const brand = await Brand.create({
      name,
      slug: slugify(name),
      logoUrl,
      description
    });
    res.status(201).json({ status: 'success', data: brand });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// PRODUCTS CONTROLLERS
// -------------------------------------------------------------
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      category, 
      brand, 
      minPrice, 
      maxPrice, 
      search, 
      status, 
      sort,
      isFeatured,
      isBestSeller,
      isNewArrival,
      // Specs filters
      processor,
      ram,
      ssd,
      hdd,
      os,
      graphics,
      resolution
    } = req.query;

    const query: any = {};

    // Filter by status (default is active for customer portal)
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    // Category / Brand
    if (category) {
      const cat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
      if (cat) query.category = cat._id;
    }
    if (brand) {
      const brnd = await Brand.findOne({ $or: [{ slug: brand }, { name: brand }] });
      if (brnd) query.brand = brnd._id;
    }

    // Flags
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isNewArrival === 'true') query.isNewArrival = true;

    // Price range
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    // Full text search or SKU matching
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { modelNumber: searchRegex },
        { description: searchRegex }
      ];
    }

    // Specs sub-documents filters mapping
    const specsFilters: { name: string; value: any }[] = [];
    if (processor) specsFilters.push({ name: 'Processor', value: processor });
    if (ram) specsFilters.push({ name: 'RAM', value: ram });
    if (ssd) specsFilters.push({ name: 'SSD', value: ssd });
    if (hdd) specsFilters.push({ name: 'HDD', value: hdd });
    if (os) specsFilters.push({ name: 'Operating System', value: os });
    if (graphics) specsFilters.push({ name: 'Graphics Card', value: graphics });
    if (resolution) specsFilters.push({ name: 'Camera Resolution', value: resolution });

    if (specsFilters.length > 0) {
      query.$and = specsFilters.map(filter => ({
        specifications: {
          $elemMatch: {
            name: filter.name,
            value: new RegExp(String(filter.value), 'i')
          }
        }
      }));
    }

    // Build query builder
    let queryBuilder = Product.find(query).populate('category').populate('brand');

    // Sorting
    if (sort) {
      const sortBy = String(sort);
      if (sortBy === 'price-asc') queryBuilder = queryBuilder.sort({ basePrice: 1 });
      else if (sortBy === 'price-desc') queryBuilder = queryBuilder.sort({ basePrice: -1 });
      else if (sortBy === 'rating') queryBuilder = queryBuilder.sort({ ratingsAverage: -1 });
      else if (sortBy === 'newest') queryBuilder = queryBuilder.sort({ createdAt: -1 });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 }); // Default newest
    }

    const products = await queryBuilder;
    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('brand');

    if (!product) {
      return next(new AppError('Product not found with that ID', 404));
    }

    // Fetch related products (same category)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'active'
    }).limit(4);

    res.status(200).json({
      status: 'success',
      data: {
        product,
        relatedProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      sku,
      modelNumber,
      description,
      categoryName,
      brandName,
      basePrice,
      gstPercentage,
      stock,
      images,
      videoUrl,
      variants,
      specifications,
      warrantyMonths,
      accessoriesIncluded,
      isFeatured,
      isBestSeller,
      isNewArrival
    } = req.body;

    // Find category/brand ids
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = await Category.create({ name: categoryName, slug: slugify(categoryName) });
    }

    let brand = await Brand.findOne({ name: brandName });
    if (!brand) {
      brand = await Brand.create({ name: brandName, slug: slugify(brandName) });
    }

    const product = await Product.create({
      name,
      slug: slugify(name) + '-' + Math.floor(1000 + Math.random() * 9000),
      sku,
      modelNumber,
      description,
      category: category._id,
      brand: brand._id,
      basePrice,
      gstPercentage: gstPercentage || 18,
      stock,
      images: images || [],
      videoUrl,
      variants: variants || [],
      specifications: specifications || [],
      warrantyMonths: warrantyMonths || 12,
      accessoriesIncluded: accessoriesIncluded || [],
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isNewArrival: !!isNewArrival
    });

    // Write audit logs
    await AuditLog.create({
      user: req.user?._id,
      action: 'PRODUCT_CREATE',
      details: `Created product ${product.name} (SKU: ${product.sku})`
    });

    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateData = { ...req.body };

    if (req.body.categoryName) {
      let category = await Category.findOne({ name: req.body.categoryName });
      if (!category) {
        category = await Category.create({ name: req.body.categoryName, slug: slugify(req.body.categoryName) });
      }
      updateData.category = category._id;
    }

    if (req.body.brandName) {
      let brand = await Brand.findOne({ name: req.body.brandName });
      if (!brand) {
        brand = await Brand.create({ name: req.body.brandName, slug: slugify(req.body.brandName) });
      }
      updateData.brand = brand._id;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Write audit logs
    await AuditLog.create({
      user: req.user?._id,
      action: 'PRODUCT_UPDATE',
      details: `Updated product ${product.name} (ID: ${product._id})`
    });

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Write audit logs
    await AuditLog.create({
      user: req.user?._id,
      action: 'PRODUCT_DELETE',
      details: `Deleted product ${product.name} (SKU: ${product.sku})`
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// REVIEWS CONTROLLERS
// -------------------------------------------------------------
export const createProductReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ user: req.user?._id, product: productId });
    if (existingReview) {
      return next(new AppError('You have already reviewed this product', 400));
    }

    const review = await Review.create({
      user: req.user?._id,
      product: productId,
      rating: Number(rating),
      comment
    });

    // Recalculate average ratings
    const reviews = await Review.find({ product: productId });
    const ratingsQuantity = reviews.length;
    const ratingsAverage = reviews.reduce((acc, item) => item.rating + acc, 0) / ratingsQuantity;

    product.ratingsAverage = Math.round(ratingsAverage * 10) / 10;
    product.ratingsQuantity = ratingsQuantity;
    await product.save();

    res.status(201).json({
      status: 'success',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await Review.find({ product: req.params.id }).populate('user', 'name');
    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
