import { Component, Input } from '@angular/core';
import { REVENUE_TABLE_HEADER } from '../../shared/conts/revenue-table-headers.const';
import { MRevenueModel } from '@private/pages/revenue-management/pages/revenue-model/shared/models/revenue-model.model';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-table-revenue',
    imports: [CurrencyPipe],
    templateUrl: './table-revenue.component.html',
    styleUrl: './table-revenue.component.scss'
})
export class TableRevenueComponent {
  @Input({required: true}) isLoading: boolean = true;
  @Input({required: true}) tableBody: MRevenueModel[] = [];
  tableHeader: string[] = REVENUE_TABLE_HEADER;

}
