import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { IProject } from '../../shared/interfaces/project.interface';

@Component({
    selector: 'app-select-project',
    imports: [DialogModule],
    templateUrl: './select-project.component.html',
    styleUrl: './select-project.component.scss'
})
export class SelectProjectComponent {
  @Input({ required: true }) visible: boolean = true;
  @Input({ required: true }) projects: IProject[] = [];
  @Input({ required: true }) closable: boolean = true;
  @Output() doActiveProject: EventEmitter<string> = new EventEmitter();
  @Output() doclose: EventEmitter<string> = new EventEmitter();

  activeProject(id: string) {
      this.doActiveProject.emit(id);
  }

  closeModal(){
    this.doclose.emit();
  }
}
