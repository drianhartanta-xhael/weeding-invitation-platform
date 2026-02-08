declare module 'midtrans-client' {
  interface Config {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  interface TransactionParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    callbacks?: {
      finish?: string;
    };
  }

  interface SnapResponse {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: Config);
    createTransaction(params: TransactionParams): Promise<SnapResponse>;
  }

  class CoreApi {
    constructor(config: Config);
    transaction: {
      status(orderId: string): Promise<any>;
      notification(notification: any): Promise<any>;
    };
  }
}
