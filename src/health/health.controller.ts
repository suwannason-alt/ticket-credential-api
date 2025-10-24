import { Controller, Get, Res } from '@nestjs/common';

import type { Response } from 'express';
import httpStatus from 'http-status';

@Controller('/health')
export class HealthController {
  @Get()
  health(@Res() res: Response) {
    try {
      res.status(httpStatus.OK).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message });
    }
  }
}
