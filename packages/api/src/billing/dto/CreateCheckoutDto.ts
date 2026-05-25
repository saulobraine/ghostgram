import { IsEnum } from 'class-validator';
import { Plan } from '@ghostgram/shared';

export class CreateCheckoutDto {
  @IsEnum(Plan)
  plan: Plan;
}
