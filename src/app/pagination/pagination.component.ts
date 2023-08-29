import { Component, OnInit, Input, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { AnalysisReportService } from '../../../core/http/services';
import { GoogleAnalyticsContent } from '../../services/google-analytics.content';
import { KEY_CODE } from '../../utils/enumerator';
import { debounce } from '../../CommonService';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {

  @Input() countOfList: number = 0;
  @Input() pageIndex: any = 0;
  @Input() isPaginationUrl: boolean = true;
  @Input() pageSize: number = 10;

  // use emitter when pagination don't need in url and isPaginationUrl = false
  @Output() paginateChange: EventEmitter<any> = new EventEmitter();

  paginatorIndex: number = 1;
  maximumPages: any;
  pages: string;
  pageUrl: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private analysisReportService: AnalysisReportService,
    private googleAnalyticsContent: GoogleAnalyticsContent,
    private router: Router,
  ) {
    this.onPaginateChange = debounce(this.onPaginateChange, 1000)
  }

  ngOnInit() {
    this.pageUrl = this.router.url.split('/');
    if (this.countOfList !== undefined) {
      this.maximumPages = Math.ceil(this.countOfList / this.pageSize);
    }
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    const { pageIndex, countOfList } = changes;
    if (pageIndex) {
      this.pageIndex = pageIndex.currentValue ? pageIndex.currentValue : '0';
      this.paginatorIndex = parseInt(this.pageIndex) + 1;
    }
    if (countOfList) {
      this.countOfList = countOfList.currentValue;
      this.maximumPages = Math.ceil(this.countOfList / this.pageSize);
      // TODO need to test with different testcase commenting for small issue
      // if (this.paginator !== undefined) {
      //   this.gotoFirstPage();
      // }
    }
  }

  onPaginateChange = (pageInfo) => {
    if (!this.isPaginationUrl) {
      this.paginateChange.emit(pageInfo);
      return;
    }
    const obj = {
      length: pageInfo.length,
      pageSize: pageInfo.pageSize,
      pageIndex: pageInfo.pageIndex,
      previousPageIndex: pageInfo.previousPageIndex
    };
    const queryParamsObject = {
      page: pageInfo.pageIndex
    };
    const urlTree = this.router.createUrlTree([], {
      queryParams: queryParamsObject,
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    this.router.navigateByUrl(urlTree);
    this.analysisReportService.setPaginationObject(obj);
    setTimeout(() => {
      const pageIndex = this.paginator && this.paginator.pageIndex || 0;
      this.paginatorIndex = pageIndex + 1;
    }, 1000);
  }

  handleScroll(event) {
    const { keyCode, target }: { keyCode: number, target: HTMLInputElement } = event;
    const { UP_ARROW, DOWN_ARROW } = KEY_CODE;
    if (event instanceof KeyboardEvent) {
      const index = parseInt((target).value, this.pageSize);
      if ([UP_ARROW, DOWN_ARROW].indexOf(keyCode) != -1) {
        if (index < 1) {
          this.setTargetBlur(target);
          this.paginatorIndex = 1;
        } else if (index > this.maximumPages) {
          this.setTargetBlur(target);
          this.paginatorIndex = this.maximumPages;
        } else {
          this.movetoPage(index);
        }
      } else {
        this.movetoPage(index);
      }
    } else if (event instanceof WheelEvent) {
      this.setTargetBlur(target)
    }
  }

  setTargetBlur(target) {
    (target).blur();
    setTimeout(function () {
      (target).focus();
    }, 1000);
  }

  movetoPage(index: number) {
    this.paginatorIndex = index;
    this.gotoPage();
  }

  gotoPage() {
    if (this.paginatorIndex < 1) {
      this.paginatorIndex = 1;
    } else if (this.paginatorIndex > this.maximumPages) {
      this.paginatorIndex = this.maximumPages;
    }
    this.paginator.pageIndex = this.paginatorIndex - 1;
    this.paginator.page.next({
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length
    });
    this.googleAnalyticsContent.emitEvent(this.googleAnalyticsContent.eventMap.COMPONENT_LIST_REPORT_PAGINATION, this.pageUrl[2] + '->' + 'Pagination click');
  }

  gotoFirstPage() {
    this.paginator.pageIndex = 0;
    this.paginatorIndex = 1;
    this.paginator.page.next({
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length
    });
  }

  isInputButtonDisabled(pageNumber, compareWithPage) {
    return pageNumber === compareWithPage || !this.countOfList;
  }

  getEntriesText() {
    if(this.countOfList) {
      const start = parseInt(this.pageIndex) * this.pageSize;
      const end = start + this.pageSize > this.countOfList ? this.countOfList : start + this.pageSize;
      return `Showing ${start || 1} - ${end} of ${this.countOfList} entries`;
    } else {
      return `Showing 0 entries`;
    }
  }
}
