import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { HomeCardsComponent } from '../../components/home-cards/home-cards.component';
import { IHomeCard } from '../../shared/interfaces/home-card.interface';
import { HOME_CARDS } from '../../shared/const/home-cards.const';
import { HOME_HEADER } from '../../shared/const/home-header.const';
import { CommonService } from '@core/common/common.service';
import { SelectProjectComponent } from '../../components/select-project/select-project.component';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { ProjectsService } from '../../shared/services/projects.service';
import { CreateProjectComponent } from '../../components/create-project/create-project.component';
import { IProject } from '../../shared/interfaces/project.interface';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-home-layout',
    imports: [
        ButtonComponent,
        CreateProjectComponent,
        HeaderComponent,
        HomeCardsComponent,
        SelectProjectComponent,
        ToastComponent,
    ],
    templateUrl: './home-layout.component.html',
    styleUrl: './home-layout.component.scss',
    providers: [ProjectsService]
})
export class HomeLayoutComponent implements OnInit {
  cards: IHomeCard[] = HOME_CARDS;
  headerData: IHeader = HOME_HEADER;
  isLoading: boolean = true;
  projects: IProject[] = [];
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };
  viewCreatedProjectModal: boolean = false;
  viewSelectProjectModal: boolean = false;
  currentProject: IProject = <any>{};

  constructor(private _cmS: CommonService, private _PrjS: ProjectsService) {}

  ngOnInit(): void {
    this._getProjects();
  }
  activeProject(id: string) {
    this.isLoading = true;
    this._PrjS.activateProject(id).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        this.viewSelectProjectModal = false;
        this._showToast(true, 'Proyecto activado!');
        this._getProjects();
      },
      error: (err) => {
        this.isLoading = false;
        this._showToast(false, err?.error?.message ?? 'Error al activar proyecto!');
      },
    });
  }

  createProject(name: string) {
    this.isLoading = true;
    this._PrjS.createProject(name).subscribe({
      next: () => {
        this.viewCreatedProjectModal = false;
        this.isLoading = false;
        this._showToast(true, 'Proyecto creado!');
        this._getProjects();
      },
      error: (err) => {
        this.isLoading = false;
        this._showToast(false, err?.error?.message ?? 'Error al crear proyecto!');
      },
    });
  }

  private _getProjects() {
    this.isLoading = true;
    this._PrjS.getProjects().subscribe({
      next: (resp: any) => {
        this.projects = resp.projects;
        this.isLoading = false;
        this.currentProject = resp.activeProject;
        resp.activeProject?._id && (this._cmS.activeProjectId = resp.activeProject?._id);
        if (this.projects.length == 0) {
          this.viewCreatedProjectModal = true;
        } else {
          !resp.activeProject?._id && (this.viewSelectProjectModal = true);
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  closeModals(){
    this.viewSelectProjectModal = false;
    this.viewCreatedProjectModal = false;
  }

  private _showToast(isValid: boolean, message: string){
    this.toastData = {
      type: isValid ? EStates.success : EStates.error,
      message,
      isOpen: true,
    };

  }
}
