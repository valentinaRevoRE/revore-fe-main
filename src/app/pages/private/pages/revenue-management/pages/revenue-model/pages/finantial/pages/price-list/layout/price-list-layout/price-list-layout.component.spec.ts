import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceListLayoutComponent } from './price-list-layout.component';

describe('PriceListLayoutComponent', () => {
  let component: PriceListLayoutComponent;
  let fixture: ComponentFixture<PriceListLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceListLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PriceListLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
