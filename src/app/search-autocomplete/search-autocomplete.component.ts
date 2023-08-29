import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material';

@Component({
  selector: 'app-search-autocomplete',
  templateUrl: './search-autocomplete.component.html',
  styleUrls: ['./search-autocomplete.component.scss']
})
export class SearchAutocompleteComponent implements OnInit, OnChanges {

  constructor() { }

  searchControl = new FormControl();
  @Input() autocompleteList: any = [];
  @Input() optionKey: string | number;
  @Input() optionLabel: string | number;
  @Input() optionTemplate: TemplateRef<any>;
  @Input() searchValue: string = "";
  @Output() searchChangeHandler = new EventEmitter();
  @Output() selectHandler = new EventEmitter();
  isSearchInputOpen: boolean = false;

  ngOnInit() {
    this.searchControl.setValue(this.searchValue);
    this.searchControl.valueChanges.subscribe(filterValue => {
      this.searchChangeHandler.emit(filterValue);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const { searchValue } = changes;
    if (searchValue) {
      this.searchControl.setValue(searchValue.currentValue);
    }
  }

  clearSearch() {
    this.searchControl.setValue("");
    this.searchChangeHandler.emit("");
  }

  openSearchBox() {
    this.isSearchInputOpen = true;
  }

  handleOptionSelection(event: MatAutocompleteSelectedEvent) {
    this.selectHandler.emit(event.option.value);
  }

}
