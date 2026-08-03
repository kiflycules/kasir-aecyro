declare module "midtrans-client" {
  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: any): Promise<{ token: string; redirect_url: string }>;
  }
  export class CoreApi {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    charge(parameter: any): Promise<any>;
    transaction: {
      status(orderId: string): Promise<any>;
      notification(payload: any): Promise<any>;
    };
  }
  const _default: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default _default;
}
