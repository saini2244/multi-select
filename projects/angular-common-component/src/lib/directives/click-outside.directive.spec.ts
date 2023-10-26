import { Component, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ClickOutsideDirective } from './click-outside.directive';

class MockElementRef extends ElementRef {
  constructor() { super(undefined); }
}

// creating a test component in the spec file
@Component(
  {
    selector: 'app-test-outside-click-component',
    template: `<div (click)="outerClick()" class="outer">
      <div appClickOutside (clickOutside)="handleOutSideClick()">
        <div (click)="innerClick()" class="inner">Test component content</div>
      </div>
    </div>`
  }
)
class TestOutSideClickComponent {
  outerClick() { }
  handleOutSideClick() { }
  innerClick() { }
}

describe('ClickOutsideDirective', () => {
  let component: TestOutSideClickComponent;
  let fixture: ComponentFixture<TestOutSideClickComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestOutSideClickComponent, ClickOutsideDirective],
      providers: [{
        provide: ElementRef, useClass: MockElementRef
      }]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestOutSideClickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeDefined();
  });

  it('should not trigger #handleOutSideClick() for inner click', () => {
    spyOn(component, 'innerClick');
    spyOn(component, 'handleOutSideClick');
    const innerElement = fixture.debugElement.query(By.css('.inner'));
    innerElement.nativeElement.click();
    expect(component.innerClick).toHaveBeenCalled();
    expect(component.handleOutSideClick).not.toHaveBeenCalled();
  });

  it('should trigger #handleOutSideClick() for outer click', () => {
    spyOn(component, 'innerClick');
    spyOn(component, 'handleOutSideClick');
    spyOn(component, 'outerClick');
    const innerElement = fixture.debugElement.query(By.css('.outer'));
    innerElement.nativeElement.click();
    expect(component.outerClick).toHaveBeenCalled();
    expect(component.handleOutSideClick).toHaveBeenCalled();
  });
});