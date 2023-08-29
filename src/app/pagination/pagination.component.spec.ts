import { HttpClientModule } from '@angular/common/http';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AnalysisReportService } from 'src/app/core/http/services';
import { GoogleAnalyticsContent } from '../../services/google-analytics.content';
import { MockBuilder, MockedComponentFixture, MockRender, ngMocks } from 'ng-mocks';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: MockedComponentFixture<PaginationComponent, any>;
  let mockAnalysisReportService: AnalysisReportService;
  let mockGoogleAnalyticsContent: GoogleAnalyticsContent;
  let componentInstance;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PaginationComponent, PaginationComponent],
      imports: [RouterTestingModule, MatIconModule, HttpClientModule],
      providers: [
        GoogleAnalyticsContent,
        AnalysisReportService
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    // fixture = TestBed.createComponent(PaginationComponent);
    fixture = MockRender(PaginationComponent, {
      countOfList: 100,
      pageIndex: 3,
    });
    // mockAnalysisReportService = TestBed.get(AnalysisReportService);
    // spyOn(mockAnalysisReportService, 'setPaginationObject').and.callThrough();
    // mockGoogleAnalyticsContent = TestBed.get(GoogleAnalyticsContent);
    // spyOn(mockGoogleAnalyticsContent, 'emitEvent').and.callThrough();
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have entry text', async(() => {
    const itag = ngMocks.find('div.entry-text')
    // fixture.debugElement.query(By.css('.entry-text'));
    expect(
      itag.nativeElement.innerText
    ).toEqual('Showing 30 to 40 of 100 entries');
  }));

  it('should go to previous page', fakeAsync(() => {
    spyOn(component, 'movetoPage');
    // const itag = fixture.debugElement.query(By.css('.arrow-icon'));
    const itag = ngMocks.findAll('.arrow-icon');
    itag[0].triggerEventHandler('click', 2);
    fixture.detectChanges();
    tick(1000);
    fixture.whenStable().then(() => {
      expect(component.movetoPage).toHaveBeenCalled();
    });
  }));

  it('should go to next page', fakeAsync(() => {
    spyOn(component, 'movetoPage');
    // const itag = fixture.debugElement.query(By.css('.arrow-icon'));
    const itag = ngMocks.findAll('.arrow-icon');
    itag[1].triggerEventHandler('click', 3);
    fixture.detectChanges();
    tick(1000);
    fixture.whenStable().then(() => {
      expect(component.movetoPage).toHaveBeenCalled();
    });
  }));

});

// @Component({
//   selector: 'app-test-pagination',
//   template: '<app-pagination [countOfList]="100" [pageIndex]="3"></app-pagination>'
// })
// class PaginationComponent {
//   public paginationComponent: PaginationComponent;
// }
