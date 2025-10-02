import { IBottomBars } from "../interface/bottom-bars.interface"

export const bottomBarsDataDto = ( data: IBottomBars ): Array<[string, number, string]> => {
    const bodyFormat : Array<[string, number, string]> = [];
    data.header.forEach( (el: string, index: number ) => {
        bodyFormat.push([el,  data.body[0][index], '#2E3C59'])
    });
    return bodyFormat;
}
