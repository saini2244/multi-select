import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import { SearchAutocompleteComponent } from './search-autocomplete.component';
import {ngMocks} from 'ng-mocks';
import {Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material';
import {By} from '@angular/platform-browser';

@Component({
  template: `
    <ng-template #searchOptionTemplate let-optionLabel="label" let-searchVal="searchVal">\\n' +
        '  <div [innerHTML]="optionLabel"></div>\\n' +
        '</ng-template>
    <app-search-autocomplete optionLabel="name" optionKey="id" [optionTemplate]="searchOptionTemplate"> </app-search-autocomplete>
  `,
})
class WrapperComponent {
  @ViewChild(SearchAutocompleteComponent) appComponentRef: SearchAutocompleteComponent;
}

describe('SearchAutocompleteComponent', () => {
  let component: SearchAutocompleteComponent;
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchAutocompleteComponent, WrapperComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [ReactiveFormsModule, MatAutocompleteModule, FormsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    component = fixture.debugElement.componentInstance.appComponentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should open search input on click', () => {
    //spyOn(component, 'openSearchBox');
    //const el = ngMocks.findAll('.open-search-wrap');
    const el = fixture.debugElement.query(By.css('.open-search-wrap')); // Returns DebugElement
    // we can click debug elements
    //ngMocks.click(el);
    el.triggerEventHandler('click', null);
    fixture.detectChanges();
    //expect(component.openSearchBox).toHaveBeenCalled();
    expect(component.isSearchInputOpen).toBe(true);
    const elAfterClick = ngMocks.findAll('.open-search-wrap');
    expect(elAfterClick.length).toBe(0);
  });

  it ('options should be filtered when input changed', async () => {

    const el = fixture.debugElement.query(By.css('.open-search-wrap')); // Returns DebugElement
    el.triggerEventHandler('click', null);
    fixture.detectChanges();
    const inputElement = fixture.debugElement.query(By.css('input')); // Returns DebugElement
    inputElement.nativeElement.dispatchEvent(new Event('focus'));
    inputElement.nativeElement.dispatchEvent(new Event('focusin'));
    inputElement.nativeElement.value = 'ar';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    inputElement.nativeElement.dispatchEvent(new Event('keydown'));
    //ngMocks.change('input', 'ar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const option = ngMocks.findAll('mat-option');
    expect(option.length).toBe(2);
  });

  it ('should remove search if clicked on cross', async () => {
    const el = fixture.debugElement.query(By.css('.open-search-wrap')); // Returns DebugElement
    el.triggerEventHandler('click', null);
    fixture.detectChanges();
    let inputElement = fixture.debugElement.query(By.css('input')); // Returns DebugElement
    inputElement.nativeElement.dispatchEvent(new Event('focus'));
    inputElement.nativeElement.dispatchEvent(new Event('focusin'));
    inputElement.nativeElement.value = 'ar';
    expect(inputElement.nativeElement.value).toBe('ar');
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    inputElement.nativeElement.dispatchEvent(new Event('keydown'));
    //ngMocks.change('input', 'ar');
    fixture.detectChanges();
    const closeButton = fixture.debugElement.query(By.css('.close-icon')); // Returns DebugElement
    closeButton.triggerEventHandler('click', null);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(inputElement.nativeElement.value).toBe('');
  })
});
