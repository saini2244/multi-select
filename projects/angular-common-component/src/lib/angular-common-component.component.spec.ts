import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularCommonComponentComponent } from './angular-common-component.component';

describe('AngularCommonComponentComponent', () => {
  let component: AngularCommonComponentComponent;
  let fixture: ComponentFixture<AngularCommonComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularCommonComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularCommonComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
