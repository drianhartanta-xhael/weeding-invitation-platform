export interface IGuest {
  _id: string;
  clientId: string;
  name: string;
  phone: string;
  email: string;
  invitationName: string;
  slug: string;
  rsvpStatus: 'pending' | 'attending' | 'notAttending';
  numberOfGuests: number;
  rsvpDate: Date | null;
  createdAt: Date;
}

export type CreateGuestDTO = Omit<IGuest, '_id' | 'createdAt' | 'rsvpDate' | 'rsvpStatus'>;
export type UpdateGuestDTO = Partial<CreateGuestDTO>;
export type RSVPSubmitDTO = Pick<IGuest, 'rsvpStatus' | 'numberOfGuests'>;
