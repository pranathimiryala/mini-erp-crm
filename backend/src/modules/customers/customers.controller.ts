import { Response, NextFunction } from 'express';
import { CustomerService } from './customers.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

const customerService = new CustomerService();

export class CustomerController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerService.getAll(req.query);
      res.status(200).json(
        ApiResponse.paginated(result.data, result.total, result.page, result.limit, 'Customers retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getById(parseInt(req.params.id));
      res.status(200).json(ApiResponse.success(customer, 'Customer retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.create(req.body, req.user!.id);
      res.status(201).json(ApiResponse.success(customer, 'Customer created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.update(parseInt(req.params.id), req.body);
      res.status(200).json(ApiResponse.success(customer, 'Customer updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerService.delete(parseInt(req.params.id));
      res.status(200).json(ApiResponse.success(result, 'Customer deleted'));
    } catch (error) {
      next(error);
    }
  }

  async addFollowUp(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const followup = await customerService.addFollowUp(
        parseInt(req.params.id),
        req.body,
        req.user!.id
      );
      res.status(201).json(ApiResponse.success(followup, 'Follow-up added successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getFollowUps(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const followups = await customerService.getFollowUps(parseInt(req.params.id));
      res.status(200).json(ApiResponse.success(followups, 'Follow-ups retrieved'));
    } catch (error) {
      next(error);
    }
  }
}
