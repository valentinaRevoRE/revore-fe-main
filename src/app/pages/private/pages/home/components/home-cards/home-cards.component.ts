import { Component, Input } from '@angular/core';
import { IHomeCard } from '../../shared/interfaces/home-card.interface';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home-cards',
    imports: [RouterLink],
    templateUrl: './home-cards.component.html',
    styleUrl: './home-cards.component.scss'
})
export class HomeCardsComponent {
  @Input({ required:true} ) cardInfo!: IHomeCard;

}
