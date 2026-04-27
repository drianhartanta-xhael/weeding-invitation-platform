export interface IEvent {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

export interface IBankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface IMusic {
  url: string;
  autoplay: boolean;
}

export interface ICustomContent {
  heroTitle: string;
  heroSubtitle: string;
  bodyGreeting: string;
  footerTitle: string;
  footerMessage: string;
}

export interface IClient {
  _id: string;
  userId: string;
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: {
    father: string;
    mother: string;
  };
  brideParents: {
    father: string;
    mother: string;
  };
  eventDate: Date;
  events: IEvent[];
  templateId: string;
  slug: string;
  music: IMusic;
  bankAccounts: IBankAccount[];
  customContent: ICustomContent;
  sections: {
    id: string;
    componentId: string;
    data: Record<string, any>;
    style: string;
    order: number;
  }[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateClientDTO = Omit<IClient, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateClientDTO = Partial<CreateClientDTO>;
