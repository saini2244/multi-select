import { Component, ElementRef, HostBinding, Input } from "@angular/core";
import { SelectionItem } from "./SelectionItem";


@Component({
    selector: 'box',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./box.component.scss']
})
export class BoxComponent implements SelectionItem {
    @Input() index: number;
    @Input() item: any;
    @HostBinding('class.active') active = false;
    private selectedOrder: number = 0;

    constructor(private host: ElementRef) { }

    setActive() { this.active = true }

    setInactive() { this.active = false }

    isActive() { return this.active }

    getElement() { return this.host.nativeElement }

    getIndex() { return this.index }

    getItem() { return this.item };

    setSelectedOrder(selectedOrder: number) { this.selectedOrder = selectedOrder; }

    getSelectedOrder() { return this.selectedOrder; }

}