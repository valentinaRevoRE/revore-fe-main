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

  menuList: any[] = menuData;
  routeActive: string = '';

  constructor(
    private router: Router,
    private commonService: CommonService,

    ){}
  ngOnInit(): void {
    this.router.events.subscribe( (events: any) => {
      const { url, routerEvent } = events;
      if(url || routerEvent?.url){
        this.routeActive = url || routerEvent?.urlAfterRedirects || routerEvent?.url;
      }
    });
  }

  closeSession(){
    this.commonService.localToken = '';
    this.commonService.clearTokens();
    this.router.navigateByUrl('/login')
  }
}
