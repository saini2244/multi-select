import { QueryList } from "@angular/core";
import { fromEvent, merge, Subject, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { SelectionItem } from "./SelectionItem";

export class MultiSelection<T extends SelectionItem> {

    private subscription: Subscription;
    private lastIndex: number = -1;
    private activeChanges = new Subject();
    private selectedOrder: number = 1;
    activeChanges$ = this.activeChanges.asObservable();

    constructor(private items: QueryList<T>) {
        this.init();
    }

    async init() {
        if (!this.items) {
            return;
        }
        const clicks$ = await this.getListeners();
        this.startSelection(clicks$);
        return;
    }

    async reinit(items) {
        if (!items) {
            return;
        }
        this.items = items;
        const clicks$ = await this.getListeners();
        this.startSelection(clicks$);
        return;
    }

    private startSelection(clicks$) {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = merge(...clicks$).subscribe(({ comp, isShiftKey, isMetaKey, index, type, isControlKey }) => {
            if (type === "contextmenu") {
                if (!comp.isActive()) {
                    this.items.toArray().forEach(current => {
                        current === comp ? current.setActive() : current.setInactive();
                    });
                }
            } else if (isMetaKey || isControlKey) {
                comp.isActive() ? comp.setInactive() : comp.setActive();
            } else if (isShiftKey) {
                if (this.lastIndex === -1) {
                    comp.isActive() ? comp.setInactive() : comp.setActive();
                    this.lastIndex = index;
                } else {
                    const rangeStartIndex = Math.min(index, this.lastIndex);
                    const rangeEndIndex = Math.max(index, this.lastIndex) + 1;
                    const inRange = this.items.toArray().slice(rangeStartIndex, rangeEndIndex);

                    const isActive = comp.isActive();
                    inRange.forEach(current => isActive ? current.setInactive() : current.setActive());
                    this.lastIndex = index;
                }
            } else {
                const isActive = comp.isActive();
                this.items.toArray().forEach(current => {
                    if (current === comp) {
                        isActive ? current.setInactive() : current.setActive()
                    } else {
                        current.setInactive();
                    }
                });
                this.lastIndex = index;
            }
            if(comp.isActive()) {
                comp.setSelectedOrder(this.selectedOrder++);
            }
            this.activeChanges.next(this.getActives());
        });
    }

    private getListeners() {
        return this.items.map((comp, index) => {
            return merge(...['click', 'contextmenu'].map(ev => fromEvent(comp.getElement(), ev).pipe(
                map((event: MouseEvent) => {
                    const { shiftKey, metaKey, type, ctrlKey } = event;
                    return {
                        index,
                        isShiftKey: shiftKey,
                        isMetaKey: metaKey,
                        isControlKey: ctrlKey,
                        comp,
                        type
                    }
                })
            )));
        });
    }

    selectAll() {
        this.items.toArray().forEach(current => {
            current.setActive();
            current.setSelectedOrder(this.selectedOrder++)
        });
        this.activeChanges.next(this.getActives());
    }

    selectByID(value,key){
        this.items.toArray().filter(current => {
            if(current.getItem()[key] ==value){
                current.setActive();
                current.setSelectedOrder(this.selectedOrder++);
            }
        })
    }

    clearAll() {
        if (!this.items) {
            return;
        }
        this.items.toArray().forEach(current => { 
            current.setInactive();
            current.setSelectedOrder(0);
            this.selectedOrder = 0;
        });
        this.activeChanges.next(this.getActives());
    }

    getActives() {
        const activeItems = this.items.filter(item => item.isActive());
        this.lastIndex = activeItems.length ? this.lastIndex : -1;
        return activeItems
    }

    getIndexes() {
        if (!this.items) {
            return [];
        }
        return this.items.reduce((result, item) => {
            if (item.isActive()) {
                return result.concat(item.getIndex());
            }
            return result;
        }, []);
    }

    getSelectedItems(items = this.items) {
        if (!items) {
            return [];
        }
        return items.reduce((result, item) => {
            if (item.isActive()) {
                return result.concat(item.getItem());
            }
            return result;
        }, []);
    }

    getSelectedItemsByOrder(orderBy = 1) {
        if (!this.items) {
            return [];
        }
        let items: any = this.items;
        items = this.items.toArray().sort((a, b) => {
            return a.getSelectedOrder() > b.getSelectedOrder() ? orderBy : -orderBy
        })
        return this.getSelectedItems(items);
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}