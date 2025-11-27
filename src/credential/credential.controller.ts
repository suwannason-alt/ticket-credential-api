import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { SaveAppLog } from '../utils/logger';

import type { Response } from 'express';
import httpStatus from 'http-status';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Credentials')
@Controller('/credential')
@ApiBearerAuth()
export class CredentialController {
  private readonly logger = new SaveAppLog(CredentialController.name);
  constructor(private readonly credentialService: CredentialService) {}

  @Post('/')
  @ApiBody({ type: Object, description: 'Any json to create payload.' })
  async createToken(@Req() req, @Res() res: Response) {
    try {
      const { body } = req;
      const token = await this.credentialService.createToken(body);
      this.logger.log(`create credential completed.`, this.createToken.name, {
        payload: body,
      });
      res.status(httpStatus.OK);
      res.json({ success: true, data: { token } });
    } catch (error: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR);
      res.json({ success: false, message: error.message });
    }
  }

  @Get('/verify')
  async verify(
    @Headers('Authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      const token = authorization.split(' ');
      const payload = await this.credentialService.verify(token[1]);
      res.status(httpStatus.OK);
      res.json({ success: true, message: `Verify completed.`, data: payload });
    } catch (error: any) {
      this.logger.error(error.message, error.stack, this.verify.name);
      res.status(httpStatus.UNAUTHORIZED);
      res.json({ success: false, message: error.message });
    }
  }

  @Patch('/refresh')
  async refresh(
    @Headers('authorization') authorization: string,
    @Body() body: RefreshTokenDto,
    @Res() res: Response,
  ) {
    try {
      const accessToken = authorization.split(' ');
      const { token, refreshToken } = await this.credentialService.refreshToken(
        accessToken[1],
        body.refreshToken,
      );
      res.status(httpStatus.OK);
      res.json({
        success: true,
        message: `Refresh token completed`,
        data: {
          token,
          refreshToken,
        },
      });
    } catch (error: any) {
      res.status(httpStatus.GONE);
      res.json({ success: false, message: error.message });
    }
  }

  @Patch('/add-fields')
  async modifyCurrentToken(
    @Headers('Authorization') authorization: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const token = authorization.split(' ');
      await this.credentialService.verify(token[1]);
      const results = await this.credentialService.createToken(body);
      res.json({ success: true, data: { token: results } });
    } catch (error) {
      this.logger.error(error.message, error.stack, this.verify.name);
      res.status(httpStatus.UNAUTHORIZED);
      res.json({ success: false, message: error.message });
    }
  }
}
