import { Response, NextFunction } from 'express';
import { ChallanService } from './challans.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

const challanService = new ChallanService();

export class ChallanController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await challanService.getAll(req.query);
      res.status(200).json(
        ApiResponse.paginated(result.data, result.total, result.page, result.limit, 'Challans retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challanService.getById(parseInt(req.params.id));
      res.status(200).json(ApiResponse.success(challan, 'Challan retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challanService.create(req.body, req.user!.id);
      res.status(201).json(ApiResponse.success(challan, 'Challan created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challanService.update(parseInt(req.params.id), req.body, req.user!.id);
      res.status(200).json(ApiResponse.success(challan, 'Challan updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challanService.confirm(parseInt(req.params.id), req.user!.id);
      res.status(200).json(ApiResponse.success(challan, 'Challan confirmed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challanService.cancel(parseInt(req.params.id), req.user!.id);
      res.status(200).json(ApiResponse.success(challan, 'Challan cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }
}
