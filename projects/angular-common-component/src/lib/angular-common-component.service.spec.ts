import { TestBed } from '@angular/core/testing';

import { AngularCommonComponentService } from './angular-common-component.service';

describe('AngularCommonComponentService', () => {
  let service: AngularCommonComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularCommonComponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
