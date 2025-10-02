import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppreciationLayoutComponent } from './appreciation-layout.component';

describe('AppreciationLayoutComponent', () => {
  let component: AppreciationLayoutComponent;
  let fixture: ComponentFixture<AppreciationLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppreciationLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppreciationLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
