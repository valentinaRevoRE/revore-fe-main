import { Component } from '@angular/core';
import menuData from '../../data/menu.json';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-taps',
    imports: [NgClass],
    templateUrl: './taps.component.html',
    styleUrl: './taps.component.scss'
})
export class TapsComponent {
  tabs: any[] = menuData;
  filterTabs: any[] = [];
  routeActive: string = '';
  tabActive: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((events: any) => {
      const { url, routerEvent } = events;
      if (url || routerEvent?.url) {
        this.routeActive = this.routeActive = url || routerEvent?.urlAfterRedirects || routerEvent?.url;
        this.changeSection(this.routeActive);
      }
    });
  }

  changeSection(url: string) {
    this.routeActive = url;
    this.filterTabs =
      this.tabs.filter((tab: any, index: number) => {
        if(url.includes(tab.link)){
          
          this.tabActive = index;
          return true;
        } else return false;
      })[0]?.children ?? [];
  }

  navigate(url: string) {
    this.router.navigateByUrl(url);
  }
}
