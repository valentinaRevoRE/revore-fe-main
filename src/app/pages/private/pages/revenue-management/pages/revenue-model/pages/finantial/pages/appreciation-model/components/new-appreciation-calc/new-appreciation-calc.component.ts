import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { AppreciationModelService } from '../../shared/services/appreciation-model.service';
import { AppreciationColModel } from '../../shared/models/appreciation-col.model';
import { processappreciationColSelectedUtil } from '../../shared/util/appreciation-col.util';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { IRevenueParams } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/revenue-params.interface';
import { RevenueParamsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/revenue-params.service';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'app-new-appreciation-calc',
    imports: [
        ButtonComponent,
        DialogModule,
        NgxMaskDirective,
        MultiSelectModule,
        ReactiveFormsModule,
        
    ],
    templateUrl: './new-appreciation-calc.component.html',
    styleUrl: './new-appreciation-calc.component.scss'
})
export class NewAppreciationCalcComponent implements OnInit, OnChanges {
  @Input({ required: true }) visible: boolean = true;
  @Input() closable: boolean = true;
  @Output() onClose: EventEmitter<{
    isCorrectly: boolean;
    showToast: boolean;
    message: string;
  }> = new EventEmitter();
  @ViewChild('multiselect') multi: any;
  allDepasObject: AppreciationColModel = <any>{};
  columsSelected: AppreciationColModel[] = [];
  columsToSelect: AppreciationColModel[] = [];
  disabledSelect: boolean = true;
  form!: FormGroup;
  formInvalid: boolean = false;
  isLoading: boolean = true;
  prediction: { numPredictions: string; _id: string } = <any>{};
  renderForms: boolean = false;
  revenueParasm: IRevenueParams = <any>{};
  selectedLabels: string = '';

  constructor(
    private appreciationS: AppreciationModelService,
    private formBuilder: FormBuilder,
    private paramsS: RevenueParamsService
  ) {
    
  }
  ngOnInit(): void {
    this._setInitialDataForm();
    this._updateRevenueParams();
  }

  ngOnChanges(changes: any): void {
    if (changes?.visible?.currentValue && this.columsToSelect.length == 0) {
      this._updateRevenueParams();
      this._getSelectedColums();
    }
  }

  changeSelection({ value }: any) {
    this._setInitialDataForm();
    value.forEach((field: AppreciationColModel) => {
      this.form.addControl(
        field.feature,
        new FormControl(field.value, [
          Validators.required,
          Validators.max(1),
          Validators.min(0.00000000001),
        ])
      );
    });
    this.selectedLabels = `${value.length} Columnas seleccionados`;
    this.columsSelected = value;
  }
  async sendForm() {
    if (this.form.invalid || !this._validatSumInputValues()) {
      this.formInvalid = true;
      return;
    }
    this.formInvalid = false;
    this.isLoading = true;
    const formValue: any = this.form.value;
    this.allDepasObject.value = Number(this.form.get('allDepts')?.value ?? 0);
    const processCols: any = processappreciationColSelectedUtil(formValue, [
      ...this.columsToSelect,
      new AppreciationColModel(this.allDepasObject),
    ]);
    const formaParams: IRevenueParams = {
      _id: this.revenueParasm._id,
      target: this.form.get('target')?.value ?? 1000,
      numPredictions: this.form.get('numPredictions')?.value ?? 100,
    };
    await firstValueFrom(this.paramsS.updateParams(formaParams));
    try {
      await firstValueFrom(
        this.appreciationS.editAppreciationColums(processCols)
      );
    } catch(err: any) {
      this.isLoading = false;
      this.onClose.emit({
        isCorrectly: false,
        showToast: true,
        message: err?.error?.message ?? 'Error al actualizar Columnas',
      });
      return;
    }
    this.paramsS.getParams();
    this.onClose.emit({
      isCorrectly: true,
      showToast: true,
      message: 'Columnas Actualizadas',
    });
    this.isLoading = false;
  }

  validateCharacter(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
    if (allowedKeys.indexOf(event.key) === -1) {
      event.preventDefault();
    }
  }

  closeModal() {
    this.onClose.emit({ isCorrectly: false, showToast: false, message: '' });
  }

  private _getSelectedColums() {
    this.isLoading = true;
    this.disabledSelect = true;
    this.appreciationS.getAppreciationColums().subscribe({
      next: (resp: any) => {
        this.disabledSelect = false;
        this.columsToSelect = resp?.columsToSelect;
        this.columsSelected = resp?.columsSelected;
        this.allDepasObject = resp?.all_depa;
        this.columsSelected.length > 0 &&
          this._addDefaultControls(this.columsSelected);
        this.renderForms = true;
        this.isLoading = false;
      },
      error: () =>
        this.onClose.emit({
          isCorrectly: false,
          showToast: true,
          message: 'Error al consultar Columnas',
        }),
    });
  }

  private _updateRevenueParams() {
    this.paramsS.params.subscribe((params) => {
      this.revenueParasm = params;
      this.form.get('target')?.setValue(this.revenueParasm.target);
      this.form
        .get('numPredictions')
        ?.setValue(this.revenueParasm.numPredictions);
    });
  }

  private _validatSumInputValues(): boolean {
    let counter: number = 0;
    Object.keys(this.form.value).forEach((element: string) => {
      element != 'target' &&
        element != 'numPredictions' &&
        (counter += Number(this.form.value[element]));
    });
    return Math.round(counter) == 1;
  }

  private _addDefaultControls(cols: AppreciationColModel[]) {
    cols.forEach((field: AppreciationColModel) => {
      this.form.addControl(
        field.feature,
        new FormControl(field.value, [
          Validators.required,
          Validators.pattern('^[0-9]+(\\.[0-9]{1,9})?$'),
          Validators.max(1),
          Validators.min(0.00000000001),
        ])
      );
    });
    this.form.get('allDepts')?.setValue(this.allDepasObject.value);
    this.selectedLabels = `${cols.length} Columnas seleccionados`;
    this.multi?.updateModel(cols);
  }

  private _setInitialDataForm() {
    const auxTarget: number = this.form?.get('target')?.value ?? 100;
    const auxNumPredictions: number =
      this.form?.get('numPredictions')?.value ?? 1000;
    this.form = this.formBuilder.group({});
    this.form.addControl(
      'target',
      new FormControl(auxTarget, [
        Validators.required,
        Validators.min(0.00000000001),
      ])
    );
    this.form.addControl(
      'allDepts',
      new FormControl(0, [Validators.required, Validators.min(0.00000000001)])
    );
    this.form.addControl(
      'numPredictions',
      new FormControl(auxNumPredictions, [
        Validators.required,
        Validators.min(0.00000000001),
      ])
    );
  }
}
