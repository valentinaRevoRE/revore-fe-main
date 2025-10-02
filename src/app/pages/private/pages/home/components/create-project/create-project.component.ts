import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { DialogModule } from 'primeng/dialog';


@Component({
    selector: 'app-create-project',
    imports: [ButtonComponent, DialogModule, ReactiveFormsModule],
    templateUrl: './create-project.component.html',
    styleUrl: './create-project.component.scss'
})
export class CreateProjectComponent {
  @Input({ required: true }) visible: boolean = true;
  @Input({ required: true }) closable: boolean = true;
  @Output() doCreateProject: EventEmitter<string> = new EventEmitter();
  @Output() doclose: EventEmitter<string> = new EventEmitter();
  form!: FormGroup;
  
  constructor(
    private _fb: FormBuilder,
  ) {
    this.form = this._fb.group({
      name: ['', Validators.required],
    });
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name }  = <any>{ ...this.form.value };
    this.doCreateProject.emit(name);
    this.form.reset();
  }

  closeModal(){
    this.doclose.emit();
  }

  get formControls() {
    return this.form.controls;
  }

}
