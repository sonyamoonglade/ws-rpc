

export function Procedure(...args: any[]): any;

export type Api = {
   findProcedure: (name: string) => Procedure
}

export function serveApi(api: Api):void

