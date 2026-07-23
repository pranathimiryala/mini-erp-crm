import { Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

const inventoryService = new InventoryService();

export class InventoryController {
  async getMovements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.getMovements(req.query);
      res.status(200).json(
        ApiResponse.paginated(result.data, result.total, result.page, result.limit, 'Stock movements retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  async recordMovement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movement = await inventoryService.recordMovement(req.body, req.user!.id);
      res.status(201).json(ApiResponse.success(movement, 'Stock movement recorded successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getProductMovements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await inventoryService.getProductMovements(parseInt(req.params.productId));
      res.status(200).json(ApiResponse.success(movements, 'Product movements retrieved'));
    } catch (error) {
      next(error);
    }
  }
}
