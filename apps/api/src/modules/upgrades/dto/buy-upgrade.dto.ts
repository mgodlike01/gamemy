// apps/api/src/modules/upgrades/dto/buy-upgrade.dto.ts
import { IsInt, IsOptional, Min } from 'class-validator';

export class BuyUpgradeDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    levels?: number; // по умолчанию возьмём 1 на бэке
}
