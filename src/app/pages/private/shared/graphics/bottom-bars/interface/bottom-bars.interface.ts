export interface IBottomBars {
    header: any[];
    body: Array<any[]>;
    ticks?: number[],
    formatData?: "#'%'" | "#'$'",
    value_text: 'Porcentaje' | 'Valor'
}