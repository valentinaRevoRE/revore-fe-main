import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'app-modal-confirm',
    imports: [DialogModule, ButtonComponent],
    templateUrl: './modal-confirm.component.html',
    styleUrl: './modal-confirm.component.scss'
})
export class ModalConfirmComponent {
  @Input({required: true}) visible: boolean = false;
  @Output() onConfirm: EventEmitter<boolean> = new EventEmitter();

  close(result: boolean){
    this.onConfirm.emit(result);
  }
}
