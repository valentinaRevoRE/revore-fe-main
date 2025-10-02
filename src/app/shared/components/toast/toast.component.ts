import { NgClass } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-toast',
    imports: [NgClass],
    templateUrl: './toast.component.html',
    styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnChanges {
  @Input({ required: true }) data!: IToast;
  iconUrl: string = '/assets/icons/emoji-happy.svg';

  ngOnChanges(changes: any): void {
    const newData: IToast = changes?.data?.currentValue;
    if (newData.isOpen) {
      this.selectImage(newData.type);
      setTimeout(() => {
        this.closeToast();
      }, newData?.time ?? 5000);
    }
  }

  closeToast() {
    this.data.isOpen = false;
  }

  selectImage(type: EStates) {
    switch (type) {
      case 'error':
        this.iconUrl = '/assets/icons/emoji-sad.svg';
        break;
      case 'warning':
        this.iconUrl = '/assets/icons/information.svg';
        break;
      default:
        this.iconUrl = '/assets/icons/emoji-happy.svg';
        break;
    }
  }
}
