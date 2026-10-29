export class ApiResponse {
  constructor(statusCode = 200, data = null, message = 'Success', meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }
  }

  static success(data = null, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, data, message, meta);
  }

  static created(data = null, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message);
  }
}

export default ApiResponse;
