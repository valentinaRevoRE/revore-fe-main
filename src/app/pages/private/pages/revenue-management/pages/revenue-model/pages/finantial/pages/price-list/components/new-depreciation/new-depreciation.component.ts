import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { DialogModule } from 'primeng/dialog';
import { PriceListService } from '../../shared/services/price-list.service';
import { IDepaToSelect } from '../../shared/interfaces/adjustmen-price-1.interface';

@Component({
    selector: 'app-new-depreciation',
    imports: [ButtonComponent, ReactiveFormsModule, DialogModule],
    templateUrl: './new-depreciation.component.html'
})
export class NewDepreciationComponent {
  @Input({ required: true }) visible: boolean = true;
  @Input({required: true}) saleDepas: IDepaToSelect[] = [];
  @Output() onClose: EventEmitter<{
    isCorrectly: boolean;
    showToast: boolean;
    message: string;
  }> = new EventEmitter();
  isLoading: boolean = false;
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private priceListS: PriceListService
  ) {
    this.form = this.formBuilder.group({
      numberDepartment: ['', Validators.required],
    });
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.priceListS.registerDepreciation(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.onClose.emit({
          isCorrectly: true,
          showToast: true,
          message: 'Depreciación registrada.',
        });
        this.form.reset();
      },
      error: (err: any) => {
        const codeStatus: boolean = err.status >= 200 && err.status <= 299;
        this.isLoading = false;
        this.onClose.emit({
          isCorrectly: codeStatus,
          showToast: true,
          message: codeStatus ? 'Depreciación registrada.' : err?.error?.message ?? 'Ups. Algo salio mal.',
        });
      },
    });
  }

  closeModal() {
    this.onClose.emit({ isCorrectly: false, showToast: false, message: '' });
  }

  get formControls() {
    return this.form.controls;
  }
}
