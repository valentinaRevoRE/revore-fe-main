import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { adjustmenDepas1SendDTO } from '../../shared/utils/adjuntsment-price-1.util';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import {
  IDepaToSelect,
  IDepaToSend,
} from '../../shared/interfaces/adjustmen-price-1.interface';
import { PriceListService } from '../../shared/services/price-list.service';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'app-adjust-price1',
    imports: [
        ButtonComponent,
        DialogModule,
        MultiSelectModule,
        NgxMaskDirective,
        ReactiveFormsModule,
    ],
    templateUrl: './adjust-price1.component.html',
    styleUrl: './adjust-price1.component.scss'
})
export class AdjustPrice1Component {
  @Input({ required: true }) visible: boolean = true;
  @Output() onClose: EventEmitter<{
    isCorrectly: boolean;
    showToast: boolean;
    message: string;
  }> = new EventEmitter();
  @Input({ required: true }) depasToSelect: IDepaToSelect[] = [];
  depasSelected: IDepaToSelect[] = [];
  disabledSelect: boolean = false;
  form!: FormGroup;
  isLoading: boolean = false;
  selectedLabels: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private priceListS: PriceListService
  ) {
    this.form = this.formBuilder.group({});
  }

  changeSelection({ value }: any) {
    value.forEach((field: IDepaToSelect) => {
      this.form.addControl(
        field.num.toString(),
        new FormControl('', Validators.required)
      );
    });
    this.selectedLabels = `${value.length} Depas seleccionados`;
    this.depasSelected = value;
  }
  async sendForm() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    const formatData: IDepaToSend = adjustmenDepas1SendDTO(this.form.value);
    this.priceListS.registerAdjustmentPrice1(formatData).subscribe({
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
}
