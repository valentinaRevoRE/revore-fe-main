import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomBarsComponent } from './bottom-bars.component';

describe('BottomBarsComponent', () => {
  let component: BottomBarsComponent;
  let fixture: ComponentFixture<BottomBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomBarsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BottomBarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
