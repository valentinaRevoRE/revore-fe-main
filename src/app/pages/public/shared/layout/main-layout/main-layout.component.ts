import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@public/shared/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss',
    providers: [AuthService]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  imageUrl: string = '/assets/login/login.png';
  subscription: Subscription = new Subscription();
  constructor(private route: Router) {}

  ngOnInit(): void {
    this.subscription.add(this.route.events.subscribe( (eventSus: any)  => {
      if(!eventSus?.routerEvent?.url) return;
      const url = eventSus?.routerEvent?.url;
      this.getImageUrl(url)
      }));
  }

  private getImageUrl(url: string) {
    const path: string = '/assets/login/'
    switch(url) {
      case '/login': this.imageUrl = `${path}login.png`; break;
      case '/login/crear-cuenta': this.imageUrl = `${path}create-account.png`; break;
      default: this.imageUrl = `${path}recover-password.png`; break;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
