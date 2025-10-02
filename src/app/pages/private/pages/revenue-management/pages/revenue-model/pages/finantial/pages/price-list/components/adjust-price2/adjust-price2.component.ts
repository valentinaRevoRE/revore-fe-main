import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { PriceListService } from '../../shared/services/price-list.service';
import { DialogModule } from 'primeng/dialog';
@Component({
    selector: 'app-adjust-price2',
    imports: [ButtonComponent, DialogModule, ReactiveFormsModule],
    templateUrl: './adjust-price2.component.html',
    styleUrl: './adjust-price2.component.scss'
})
export class AdjustPrice2Component {
  @Input({ required: true }) visible: boolean = true;
  @Output() onClose: EventEmitter<{
    isCorrectly: boolean;
    showToast: boolean;
    message: string;
  }> = new EventEmitter();
  form!: FormGroup;
  isLoading: boolean = false;
  @Input({ required: true }) columsOfInteres: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private priceListS: PriceListService
  ) {
    this.form = this.formBuilder.group({
      columnOfFeature: ['', Validators.required],
      value: ['', Validators.required],
      percentage: ['', [Validators.required, Validators.max(1)]],
    });
  }

  sendForm() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    const formatPrice: any = {
      columnOfFeature: this.form.value.columnOfFeature,
      percentage: Number(this.form.value.percentage),
      value:  this.form.value.value
    }
    this.priceListS.registerAdjustmentPrice2(formatPrice).subscribe({
      next: () => {
        this.isLoading = false;
        this.onClose.emit({
          isCorrectly: true,
          showToast: true,
          message: 'Ajuste de precios realizado',
        });
      },
      error: (err) => {
        this.onClose.emit({
          isCorrectly: false,
          showToast: true,
          message: err?.error?.message ?? 'Error al realizar ajuste de precios',
        });
        this.isLoading = false;
      },
    });
  }
  closeModal() {
    this.onClose.emit({ isCorrectly: false, showToast: false, message: '' });
  }

  validateCharacters(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
    if (allowedKeys.indexOf(event.key) === -1) {
      event.preventDefault();
    }
  }
}
