import { Component, OnInit } from '@angular/core';
// @ts-ignore: Unreachable code error
import menuData from "../../data/menu.json";
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { CommonService } from '@core/common/common.service';

@Component({
    selector: 'app-menu',
    imports: [RouterLink, NgClass],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit{

  menuList: any[] = [];
  routeActive: string = '';
  userName: string = '';
  userRole: string = '';
  userInitials: string = '';

  constructor(
    private router: Router,
    private commonService: CommonService,

    ){}
  ngOnInit(): void {
    // Cargar información del usuario
    this.loadUserInfo();
    
    // Filtrar menú según roles del usuario
    this.filterMenuByRoles();
    
    this.router.events.subscribe( (events: any) => {
      const { url, routerEvent } = events;
      if(url || routerEvent?.url){
        this.routeActive = url || routerEvent?.urlAfterRedirects || routerEvent?.url;
      }
    });
  }

  loadUserInfo(): void {
    // Obtener datos del usuario desde localStorage
    const userStr = localStorage.getItem('user');
    const userRolesStr = localStorage.getItem('userRoles');
    
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userName = user.name || user.email || 'Usuario';
      
      // Generar iniciales
      this.userInitials = this.getInitials(this.userName);
    }
    
    if (userRolesStr) {
      const userRoles: string[] = JSON.parse(userRolesStr);
      // Obtener el primer rol y traducirlo al español
      if (userRoles.length > 0) {
        this.userRole = this.translateRole(userRoles[0]);
      }
    }
  }

  getInitials(name: string): string {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  translateRole(role: string): string {
    const roleTranslations: { [key: string]: string } = {
      'admin': 'Administrador',
      'advisor': 'Asesor',
      'commercial_leader': 'Líder Comercial',
      'developer': 'Desarrollador'
    };
    return roleTranslations[role] || role;
  }

  filterMenuByRoles(): void {
    // Obtener roles del usuario desde localStorage
    const userRolesStr = localStorage.getItem('userRoles');
    const userRoles: string[] = userRolesStr ? JSON.parse(userRolesStr) : [];

    // Filtrar items del menú
    this.menuList = menuData.filter((item: any) => {
      // Si el item no tiene roles definidos, mostrarlo siempre
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      
      // Si tiene roles, verificar que el usuario tenga al menos uno de ellos
      return item.roles.some((role: string) => userRoles.includes(role));
    });
  }

  closeSession(){
    this.commonService.localToken = '';
    this.commonService.clearTokens();
    this.router.navigateByUrl('/login')
  }
}
