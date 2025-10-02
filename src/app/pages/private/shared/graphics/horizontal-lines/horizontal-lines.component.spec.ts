import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalLinesComponent } from './horizontal-lines.component';

describe('HorizontalLinesComponent', () => {
  let component: HorizontalLinesComponent;
  let fixture: ComponentFixture<HorizontalLinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorizontalLinesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HorizontalLinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
