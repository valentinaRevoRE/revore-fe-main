import { Component, Input } from '@angular/core';
import { IDashboardCard } from '../../shared/interfaces/cards.interface';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-cards',
    imports: [CurrencyPipe],
    templateUrl: './cards.component.html',
    styleUrl: './cards.component.scss'
})
export class CardsComponent {
  @Input() cardData: IDashboardCard = <any>{};
}
