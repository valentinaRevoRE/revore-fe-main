import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatBarsComponent } from './float-bars.component';

describe('FloatBarsComponent', () => {
  let component: FloatBarsComponent;
  let fixture: ComponentFixture<FloatBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatBarsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FloatBarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
