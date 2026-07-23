import { Response, NextFunction } from 'express';
import { ProductService } from './products.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

const productService = new ProductService();

export class ProductController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getAll(req.query);
      res.status(200).json(
        ApiResponse.paginated(result.data, result.total, result.page, result.limit, 'Products retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getById(parseInt(req.params.id));
      res.status(200).json(ApiResponse.success(product, 'Product retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.create(req.body, req.user!.id);
      res.status(201).json(ApiResponse.success(product, 'Product created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.update(parseInt(req.params.id), req.body);
      res.status(200).json(ApiResponse.success(product, 'Product updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await productService.getLowStockProducts();
      res.status(200).json(ApiResponse.success(products, 'Low stock products retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getCategories();
      res.status(200).json(ApiResponse.success(categories, 'Categories retrieved'));
    } catch (error) {
      next(error);
    }
  }
}
