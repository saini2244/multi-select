export interface SelectionItem {
    getElement: () => Element;
    isActive: () => boolean;
    setActive: () => void;
    setInactive: () => void;
    getIndex: () => number;
    getItem: () => any;
    setSelectedOrder: (selectedOrder: number) => void;
    getSelectedOrder: () => number;
}