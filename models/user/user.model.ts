import { Exclude, Expose, Type } from 'class-transformer';
import { WithClassId } from '../decorators/withClassId.decorator';

export enum rolesEnum {
  admin = 'admin',
}

const rolesDescriptionMap = new Map([[rolesEnum.admin, 'Administrador']]);

@Exclude()
@WithClassId('User')
export class User {
  static rolesDescriptors: Array<{ key: rolesEnum; desc: string | undefined }> =
    Object.values(rolesEnum).map(type => {
      return {
        key: type,
        desc: rolesDescriptionMap.get(type),
      };
    });

  @Expose()
  _id!: string;

  @Expose()
  email!: string;

  @Expose()
  password: string | null = null;

  @Expose()
  repeatPassword: string | null = null;

  @Expose()
  fullname!: string;

  @Type(() => Date)
  createdAt!: Date;

  @Expose()
  roles!: string[];

  public get isAdmin(): boolean {
    return Boolean(this.roles?.includes('admin'));
  }
}
