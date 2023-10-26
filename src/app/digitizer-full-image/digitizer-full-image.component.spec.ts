import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitizerFullImageComponent } from './digitizer-full-image.component';

describe('DigitizerFullImageComponent', () => {
  let component: DigitizerFullImageComponent;
  let fixture: ComponentFixture<DigitizerFullImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigitizerFullImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitizerFullImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
