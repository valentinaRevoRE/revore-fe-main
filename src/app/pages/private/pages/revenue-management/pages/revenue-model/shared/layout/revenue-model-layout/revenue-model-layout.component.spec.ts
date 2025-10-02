import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueModelLayoutComponent } from './revenue-model-layout.component';

describe('RevenueModelLayoutComponent', () => {
  let component: RevenueModelLayoutComponent;
  let fixture: ComponentFixture<RevenueModelLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueModelLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RevenueModelLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
