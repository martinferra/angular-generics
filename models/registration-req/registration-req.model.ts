import { Exclude, Expose } from 'class-transformer';
import { WithClassId } from '../decorators/withClassId.decorator';

@Exclude()
@WithClassId('RegistrationReq')
export class RegistrationReq {
  constructor(email?: string, fullname?: string) {
    if (email) {
      this.email = email;
    }
    if (fullname) {
      this.fullname = fullname;
    }
  }

  @Expose()
  _id!: string;

  @Expose()
  email!: string;

  @Expose()
  fullname!: string;
}
