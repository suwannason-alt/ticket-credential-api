import { Injectable } from '@nestjs/common';

import { SaveAppLog } from '../utils/logger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity } from '../database/entities/token';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import jose from 'jose';

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
      const signedJwt = await new jose.SignJWT(payload)
        .setProtectedHeader({
          alg: 'HS256',
          typ: 'JWT',
        })
        .setIssuedAt(Math.floor(Date.now() / 1000))
        .setExpirationTime('1d')
        .setIssuer(`sys:openticket`)
        .setAudience(`service:credential`)
        .sign(new TextEncoder().encode(secret));
      const token = await new jose.CompactEncrypt(
        new TextEncoder().encode(signedJwt),
      )
        .setProtectedHeader({
          alg: 'dir',
          enc: 'A256GCM',
          cty: 'JWT',
        })
        .encrypt(new TextEncoder().encode(secret));

      const signedRefreshToken = await new jose.SignJWT({ sessionId })
        .setProtectedHeader({
          alg: 'HS256',
          typ: 'JWT',
        })
        .setIssuedAt(Math.floor(Date.now() / 1000))
        .setExpirationTime('7d')
        .setIssuer(`sys:openticket`)
        .setAudience(`service:credential`)
        .sign(new TextEncoder().encode(secret));

      const refreshToken = await new jose.CompactEncrypt(
        new TextEncoder().encode(signedRefreshToken),
      )
        .setProtectedHeader({
          alg: 'dir',
          enc: 'A256GCM',
          cty: 'JWT',
        })
        .encrypt(new TextEncoder().encode(secret));
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

  async verify(token: string) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const { plaintext } = await jose.compactDecrypt(
        token,
        new TextEncoder().encode(secret),
      );

      const { payload } = await jose.jwtVerify(
        plaintext,
        new TextEncoder().encode(secret),
        { issuer: 'sys:openticket', audience: 'service:credential' },
      );

      return payload;
    } catch (error) {
      this.logger.error(error.message, error.stack, this.verify.name);
      throw new Error(error);
    }
  }

  async refreshToken(token: string, refreshToken: string) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const { plaintext } = await jose.compactDecrypt(
        refreshToken,
        new TextEncoder().encode(secret),
      );

      const { payload } = await jose.jwtVerify(
        plaintext,
        new TextEncoder().encode(secret),
        { issuer: 'sys:openticket', audience: 'service:credential' },
      );
      const verifyRefresh = payload;

      const lastLogin = await this.tokenRepository
        .createQueryBuilder(`tk`)
        .where(`tk.uuid = :uuid`, { uuid: verifyRefresh.sessionId })
        .select([
          `pgp_sym_decrypt(tk.token, '${this.configService.get('ENCRYPTION_KEY')}') AS token`,
        ])
        .getRawOne();

      this.logger.debug({ lastLogin });

      if (!lastLogin) {
        this.logger.warn(`Not found refresh token.`, this.refreshToken.name, {
          token,
          refreshToken,
        });
        throw new Error(`Not found refresh token.`);
      }

      const oldToken = await jose.compactDecrypt(
        token,
        new TextEncoder().encode(secret),
      );

      const decoded = jose.decodeJwt(
        new TextDecoder().decode(oldToken.plaintext),
      );
      this.logger.debug({ decoded });
      if (decoded.sessionId !== verifyRefresh.sessionId) {
        this.logger.warn(`Refresh token not match.`, this.refreshToken.name, {
          token,
          refreshToken,
          refreshSessionId: verifyRefresh.sessionId,
          tokenSessionId: decoded.sessionId,
        });
        throw new Error(`Refresh token not match.`);
      }
      delete decoded.iat;
      delete decoded.exp;
      this.logger.log(`refresh token for completed`, this.refreshToken.name, {
        sessionId: verifyRefresh.sessionId,
      });
      return this.createToken(decoded);
    } catch (error) {
      this.logger.error(error.message, error.stack, this.refreshToken.name);
      throw new Error(error);
    }
  }
}
