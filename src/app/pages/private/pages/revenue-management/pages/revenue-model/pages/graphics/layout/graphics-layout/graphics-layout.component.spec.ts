import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicsLayoutComponent } from './graphics-layout.component';

describe('GraphicsLayoutComponent', () => {
  let component: GraphicsLayoutComponent;
  let fixture: ComponentFixture<GraphicsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphicsLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GraphicsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
