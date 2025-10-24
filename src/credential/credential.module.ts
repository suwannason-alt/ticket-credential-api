import { Module } from '@nestjs/common';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '../database/entities/token';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity])],
  controllers: [CredentialController],
  providers: [CredentialService],
  exports: [CredentialService],
})
export class CredentialModule {}
