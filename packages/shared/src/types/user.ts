export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export type CreateUserDTO = Pick<IUser, 'email' | 'password' | 'name'>;
