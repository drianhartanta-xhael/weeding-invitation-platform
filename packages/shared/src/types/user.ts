export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export type CreateUserDTO = Pick<IUser, 'email' | 'password' | 'name'>;
export type LoginDTO = Pick<IUser, 'email' | 'password'>;
export type UserResponse = Omit<IUser, 'password'>;
