import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { PATHS } from '../const/home-paths.conts';
import { Observable, map } from 'rxjs';
import { IProject } from '../interfaces/project.interface';

@Injectable()
export class ProjectsService {

  constructor(private http: HttpClient) { }

  getProjects(): Observable<any>{
    const url: string = `${environment.apiUrl}${PATHS.PROJECTS}`;
    return this.http.post(url, { limit: 100 }).pipe( map( (res: any) => {
      return {
        ...res,
        activeProject: res?.projects.filter( (el: IProject) => el.isActive )[0]
      }
    }));
  }

  activateProject( projectId: string  ){
    const url: string = `${environment.apiUrl}${PATHS.PROJECTS_ACTIVATE}`;
    return this.http.post<IProject>(url, { projectId });
  }

  createProject(name: string){
    const url: string = `${environment.apiUrl}${PATHS.PROJECTS_CREATE}`;
    return this.http.post<IProject>(url, { name });
  }

}
