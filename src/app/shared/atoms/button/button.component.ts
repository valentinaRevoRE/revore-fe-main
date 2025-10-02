import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-button',
    imports: [NgClass],
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input({required:true}) isLoading!: boolean;
  @Input({required:true}) theme!: 'primary' | 'light' | 'warning';
  @Input({required:true}) name!:string;
  @Input({required:true}) icon!:string;
  @Output() onClickButton: EventEmitter<boolean> = new EventEmitter();

  clickButton(){
    this.onClickButton.emit(true);
  }

}
