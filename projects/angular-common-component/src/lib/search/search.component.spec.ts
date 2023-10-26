import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { MockBuilder, MockedComponentFixture, MockRender, ngMocks } from 'ng-mocks';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: MockedComponentFixture<SearchComponent, any>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchComponent, ClickOutsideDirective],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        MatIconModule
      ]
    })
      .overrideComponent(SearchComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    // fixture = TestBed.createComponent(TestSearchComponent);
    // component = fixture.componentInstance;
    fixture = MockRender(SearchComponent, {
      searchValue: ''
    });
    // mockAnalysisReportService = TestBed.get(AnalysisReportService);
    // spyOn(mockAnalysisReportService, 'setPaginationObject').and.callThrough();
    // mockGoogleAnalyticsContent = TestBed.get(GoogleAnalyticsContent);
    // spyOn(mockGoogleAnalyticsContent, 'emitEvent').and.callThrough();
    component = fixture.point.componentInstance;
    fixture.detectChanges();
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have i tag with title \'search\'', async(() => {
    const itag = ngMocks.find('.hide-search-icon');
    // fixture.debugElement.query(By.css('i'));
    expect(
      itag.nativeElement.title
    ).toEqual('Search');
  }));

  it('should have i tag with title \'search\' click event', fakeAsync (async () => {
    expect(component.showSearch).toBeFalsy();
    spyOn(component, 'openSearch');
    const itag = ngMocks.find('.hide-search-icon');;
    // itag.triggerEventHandler('click', { stopPropagation() {}});
    ngMocks.click(itag, new Event('input'));
    tick();
    fixture.detectChanges();
    // await fixture.whenStable();
    expect(component.openSearch).toHaveBeenCalled();
    expect(fixture.point.componentInstance.showSearch).toBeTruthy();
    // fixture.whenStable().then(() => {
    // });
  }));

  it('should have mat icon close tag click event', fakeAsync(() => {
    component.showSearch = true;
    component.searchValue = 'Test';
    fixture.detectChanges();
    const input = ngMocks.find('.search-input');
    // fixture.debugElement.query(By.css('.search-input'));
    let el = input.nativeElement;

    expect(el.value).toBe('Test');

    // el.value = 'someValue';
    // el.dispatchEvent(new Event('input'));
    // ngMocks.change(input, 'someValue');
    // fixture.detectChanges();
    // tick(1000);
    // expect(el.value).toBe('someValue');
    spyOn(component, 'applySearch');
    const close = ngMocks.find('.close-icon');
    // fixture.debugElement.query(By.css('.close-icon'));
    close.triggerEventHandler('click', 'close');
    fixture.detectChanges();
    tick(1000);
    fixture.whenStable().then(() => {
      expect(component.applySearch).toHaveBeenCalled();
      expect(component.showSearch).toBeTruthy();
    });
  }));

  it('should event output emitter', fakeAsync(() => {
    component.showSearch = true;
    fixture.detectChanges();
    spyOn(component, 'applySearch');
    const input = ngMocks.find('.search-input');
    let el = input.nativeElement;

    expect(el.value).toBe('');

    // el.value = 'someValue';
    // el.dispatchEvent(new Event('input'));
    ngMocks.change(input, 'someValue');
    fixture.detectChanges();
    tick(1000);

    expect(component.searchValue).toBe('someValue');
    expect(component.applySearch).toHaveBeenCalled();
    expect(component.searchValueChange.emit).toHaveBeenCalled();
    expect(component.showSearch).toBeTruthy();

    // el.value = '';
    // el.dispatchEvent(new Event('input'));
    ngMocks.change(input, '');
    fixture.detectChanges();
    tick(1000);

    expect(component.searchValue).toBe('');
    expect(component.applySearch).toHaveBeenCalled();
    expect(component.searchValueChange.emit).toHaveBeenCalled();
    expect(component.showSearch).toBeTruthy();
  }));

  it('should call ngOnChanges', () => {
    expect(component.showSearch).toBeFalsy();
    fixture.point.componentInstance.searchValue = 'Test';
    spyOn(component, 'ngOnChanges').and.callThrough();
    fixture.detectChanges();
    expect(component.ngOnChanges).toHaveBeenCalled();
    // expect(component.showSearch).toBeTruthy();
  })

});

// @Component({
//   selector: 'app-test-search',
//   template: '<app-search [searchValue]="searchComponent.searchValue"></app-search>'
// })
// class TestSearchComponent {
//   searchComponent = new SearchComponent() ; //mock your input
// }
