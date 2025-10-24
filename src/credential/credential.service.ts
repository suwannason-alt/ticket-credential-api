import { Injectable } from '@nestjs/common';

import jwt from 'jsonwebtoken';
import { SaveAppLog } from '../utils/logger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity } from '../database/entities/token';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class CredentialService {
  private readonly logger = new SaveAppLog(CredentialService.name);

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}
  async createToken(payload: any) {
    try {
      const sessionId = uuidv7();
      const secret = this.configService.get<string>('JWT_SECRET');
      Object.assign(payload, { sessionId });
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ sessionId }, secret, { expiresIn: '3d' });
      this.logger.debug({
        token,
        secret,
      });
      await this.tokenRepository
        .createQueryBuilder()
        .insert()
        .into(TokenEntity)
        .values([
          {
            uuid: sessionId,
            token: () =>
              `pgp_sym_encrypt('${token}', '${this.configService.get('ENCRYPTION_KEY')}')`,
            refreshToken: () =>
              `pgp_sym_encrypt('${refreshToken}', '${this.configService.get('ENCRYPTION_KEY')}')`,
          },
        ])
        .execute();
      return { token, refreshToken };
    } catch (error) {
      this.logger.error(error.message, error.stack, this.createToken.name);
      throw new Error(error);
    }
  }

  verify(token: string) {
    try {
      const payload = jwt.verify(
        token,
        this.configService.get<string>('JWT_SECRET'),
      );

      return payload;
    } catch (error) {
      this.logger.error(error.message, error.stack, this.verify.name);
      throw new Error(error);
    }
  }

  async refreshToken(token: string, refreshToken: string) {
    try {
      const verifyRefresh = await jwt.verify(
        refreshToken,
        this.configService.get<string>('JWT_SECRET'),
      );
      const lastLogin = await this.tokenRepository
        .createQueryBuilder(`tk`)
        .where(`tk.uuid = :uuid`, { uuid: verifyRefresh.sessionId })
        .select([
          `pgp_sym_decrypt(tk.token, '${this.configService.get('ENCRYPTION_KEY')}') AS token`,
        ])
        .getRawOne();

      if (!lastLogin) {
        this.logger.warn(`Not found refresh token.`, this.refreshToken.name, {
          token,
          refreshToken,
        });
        throw new Error(`Not found refresh token.`);
      }

      const oldToken = jwt.decode(lastLogin.token);
      if (oldToken.sessionId !== verifyRefresh.sessionId) {
        this.logger.warn(`Refresh token not match.`, this.refreshToken.name, {
          token,
          refreshToken,
        });
        throw new Error(`Refresh token not match.`);
      }
      const decoded = jwt.decode(token);
      delete decoded.iat;
      delete decoded.exp;
      return this.createToken(decoded);
    } catch (error) {
      this.logger.error(error.message, error.stack, this.refreshToken.name);
      throw new Error(error);
    }
  }
}
