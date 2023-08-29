import {
  Component, Input, SimpleChanges,
  OnChanges, EventEmitter, Output, ViewChild
} from '@angular/core';
import { MatInput } from '@angular/material';
import { debounce } from 'src/app/shared/CommonService';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnChanges {

  @Input() searchValue: string = "";
  @Input() isOutsideClickEnabled: boolean = true;
  @Output() searchValueChange = new EventEmitter();
  @ViewChild('search') searchInput: MatInput;
  showSearch: boolean = false;
  isRemoveValue: boolean = false;
  constructor() {
    this.applySearch = debounce(this.applySearch, 1000)
  }

  ngOnChanges(changes: SimpleChanges) {
    const { searchValue, isOutsideClickEnabled } = changes;
    const { currentValue } = searchValue;
    if (!currentValue) {
      if(!this.isOutsideClickEnabled) {
        this.showSearch = true;
      } else {
        this.showSearch = this.isRemoveValue;
        this.isRemoveValue = false;
      }
    } else {
      this.showSearch = true;
    }
    if(isOutsideClickEnabled && (!isOutsideClickEnabled.currentValue || this.searchValue)) {
      this.showSearch = true;
    }
  }

  closeSearch() {
    if (!this.searchValue && this.isOutsideClickEnabled) {
      this.showSearch = false;
    }
  }

  openSearch(event) {
    event.stopPropagation();
    this.showSearch = true;
  }

  applySearch = (type) => {
    let value = this.searchValue;
    if (type === 'close') {
      this.isRemoveValue = true;
      value = "";
    } else if (value === "") {
      this.isRemoveValue = true;
    }
    this.searchValueChange.emit(value);
  }
}