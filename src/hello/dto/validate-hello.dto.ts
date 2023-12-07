import {IsNotEmpty, IsNumber, IsNumberString, IsString} from 'class-validator';

export class ValidateHelloDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}

export class ValidateInputParams {
  @IsNumberString()
  // @IsNumber()
  readonly id: number;
}

// export class FindOneParams {
//   @IsNumberString()
//   id: number;
// }
