import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IHeader } from '@private/shared/interfaces/header.interface';

@Component({
    selector: 'app-header',
    imports: [NgStyle],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() data!: IHeader;
}
