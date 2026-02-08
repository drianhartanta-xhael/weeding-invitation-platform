export interface IWish {
  _id: string;
  clientId: string;
  guestName: string;
  message: string;
  createdAt: Date;
  isApproved: boolean;
}

export type CreateWishDTO = Pick<IWish, 'clientId' | 'guestName' | 'message'>;
