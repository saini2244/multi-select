import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { AngularCommonComponentComponent } from './angular-common-component.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { CopyTextDirective } from './directives/copy-text.directive';
import { EllipsisDirective } from './directives/ellipsis.directive';
import { OnlyNumbersDirective } from './directives/only-numbers.directive';
import { BoxComponent } from './directives/range-selection/box.component';
import { MultiSelection } from './directives/range-selection/MultiSelection';
import { PaginationComponent } from './pagination/pagination.component';
import { SearchAutocompleteComponent } from './search-autocomplete/search-autocomplete.component';
import { SearchComponent } from './search/search.component';
import { TableComponent } from './table/table.component';



@NgModule({
  declarations: [
    AngularCommonComponentComponent,
    PaginationComponent,
    SearchComponent,
    SearchAutocompleteComponent,
    TableComponent,
    ClickOutsideDirective,
    CopyTextDirective,
    EllipsisDirective,
    OnlyNumbersDirective,
    // MultiSelection,
    BoxComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatIconModule
  ],
  exports: [
    AngularCommonComponentComponent,
    // PaginationComponent,
    // SearchComponent,
    // SearchAutocompleteComponent,
    // TableComponent,
    // ClickOutsideDirective,
    // CopyTextDirective,
    // EllipsisDirective,
    // OnlyNumbersDirective,
    // MultiSelection,
    // BoxComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class AngularCommonComponentModule { }
