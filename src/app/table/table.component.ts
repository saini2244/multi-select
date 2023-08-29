import { Component, OnInit, Input, ViewChild, SimpleChanges, Output, EventEmitter, TemplateRef, ElementRef } from '@angular/core';
import { MatTableDataSource, MatSort } from '@angular/material';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableComponent implements OnInit {

  @Input() tableData;
  @Input() columnHeader = [];
  @Input() mapTemplate = {};
  @Input() expandableTemplateName: TemplateRef<any>;
  @Input() expandedElement: any;
  @Input() tableClass?: string;
  @Output() sortKeys = new EventEmitter();
  @Output() rowClickEvent = new EventEmitter();
  objectKeys = Object.keys;
  dataSource;
  displayedColumns: any;
  expandedDisplayedColumns: any;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private router: Router) {

  }

  ngOnInit() {
    if(this.columnHeader) {
      this.displayedColumns = this.columnHeader.map(col => col.key);
    }
    this.dataSource = new MatTableDataSource(this.tableData);
  }

  ngOnChanges(changes: SimpleChanges) {
    const { tableData, columnHeader } = changes;
    if (tableData && tableData.currentValue) {
      this.dataSource = new MatTableDataSource(tableData.currentValue);
    }
    if (columnHeader && columnHeader.currentValue) {
      this.displayedColumns = this.columnHeader.map(col => col.key);
    }
  }

  sortColumn(event) {
    const sortingKeys = {
      'sortKey': event.active,
      'sortOrder': event.direction,
    };
    this.sortKeys.emit(sortingKeys);
  }

  rowClick(element, event) {
    this.rowClickEvent.emit({
      element,
      event
    })
  }

}
