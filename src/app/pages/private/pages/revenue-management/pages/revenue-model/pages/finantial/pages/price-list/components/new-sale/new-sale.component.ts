import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { SaleModel } from '../../shared/models/sale.model';
import { ISaleForm } from '../../shared/interfaces/sale.interface';
import { PriceListService } from '../../shared/services/price-list.service';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { IDepaToSelect } from '../../shared/interfaces/adjustmen-price-1.interface';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'app-new-sale',
    imports: [ButtonComponent, ReactiveFormsModule, DialogModule, NgxMaskDirective],
    templateUrl: './new-sale.component.html'
})
export class NewSaleComponent {
  @Input({ required: true }) visible: boolean = true;
  @Input({required: true}) availableDepas: IDepaToSelect[] = [];
  @Output() onClose: EventEmitter<{
    isCorrectly: boolean;
    showToast: boolean;
    message: string;
  }> = new EventEmitter();
  form!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private priceListS: PriceListService
  ) {
    this.form = this.formBuilder.group({
      numberDepartment: ['', Validators.required],
      totalPrice: ['', Validators.required],
      initialPayment: ['', Validators.required],
      paymentPerPeriod: ['', Validators.required],
      numberOfPeriods: ['', Validators.required],
      settlement: ['', Validators.required],
    },{ validators: this.formValidation  });
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const formatSale: SaleModel = new SaleModel(this.form.value as ISaleForm);
    this.isLoading = true;
    this.priceListS.registerSale(formatSale).subscribe({
      next: () => {
        this.isLoading = false;
        this.onClose.emit({
          isCorrectly: true,
          showToast: true,
          message: 'Venta registrada.',
        });
        this.form.reset();
        this.form.get('numberOfPredictions')?.setValue(1000);
        this.form.get('departmentForSale_limit')?.setValue(100);
      },
      error: (err) => {
        this.isLoading = false;
        this.onClose.emit({
          isCorrectly: false,
          showToast: true,
          message: err?.error?.message ?? 'Ups. Algo salio mal.',
        });
      },
    });
  }

  closeModal() {
    this.onClose.emit({ isCorrectly: false, showToast: false, message: '' });
  }

  formValidation(form: FormControl){
    let validSum: boolean = false;
    const totalPrice: number = form.get('totalPrice')?.value;
    const initialPayment: number = form.get('initialPayment')?.value;
    const paymentPerPeriod: number = form.get('paymentPerPeriod')?.value;
    const numberOfPeriods: number = form.get('numberOfPeriods')?.value;
    const settlement: number = form.get('settlement')?.value;
    const operation: number = initialPayment + ( paymentPerPeriod * numberOfPeriods ) + settlement;
    validSum = totalPrice == operation;
    if(validSum){
      return null;
    }else{
      return { invalid: true }
    }
  }

  get formControls() {
    return this.form.controls;
  }
}
