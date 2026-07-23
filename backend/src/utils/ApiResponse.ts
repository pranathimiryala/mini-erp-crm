export class ApiResponse {
  static success(data: any, message: string = 'Success', statusCode: number = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
    };
  }

  static error(message: string, statusCode: number = 500, errors?: any) {
    return {
      success: false,
      statusCode,
      message,
      errors: errors || null,
    };
  }

  static paginated(
    data: any[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
  ) {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
