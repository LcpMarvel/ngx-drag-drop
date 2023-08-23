import { Directive, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, inject, Input, NgZone, Output, Renderer2, } from '@angular/core';
import { dndState, endDrag, startDrag } from './dnd-state';
import { calculateDragImageOffset, setDragData, setDragImage, } from './dnd-utils';
import * as i0 from "@angular/core";
export class DndDragImageRefDirective {
    constructor() {
        this.dndDraggableDirective = inject(forwardRef(() => DndDraggableDirective));
        this.elementRef = inject(ElementRef);
    }
    ngOnInit() {
        this.dndDraggableDirective.registerDragImage(this.elementRef);
    }
}
DndDragImageRefDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDragImageRefDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
DndDragImageRefDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.2.6", type: DndDragImageRefDirective, selector: "[dndDragImageRef]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDragImageRefDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDragImageRef]' }]
        }] });
export class DndDraggableDirective {
    constructor() {
        this.dndEffectAllowed = 'copy';
        this.dndDraggingClass = 'dndDragging';
        this.dndDraggingSourceClass = 'dndDraggingSource';
        this.dndDraggableDisabledClass = 'dndDraggableDisabled';
        this.dndDragImageOffsetFunction = calculateDragImageOffset;
        this.dndStart = new EventEmitter();
        this.dndDrag = new EventEmitter();
        this.dndEnd = new EventEmitter();
        this.dndMoved = new EventEmitter();
        this.dndCopied = new EventEmitter();
        this.dndLinked = new EventEmitter();
        this.dndCanceled = new EventEmitter();
        this.draggable = true;
        this.isDragStarted = false;
        this.elementRef = inject(ElementRef);
        this.renderer = inject(Renderer2);
        this.ngZone = inject(NgZone);
        this.dragEventHandler = (event) => this.onDrag(event);
    }
    set dndDisableIf(value) {
        this.draggable = !value;
        if (this.draggable) {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
        }
        else {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
        }
    }
    set dndDisableDragIf(value) {
        this.dndDisableIf = value;
    }
    ngAfterViewInit() {
        this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.addEventListener('drag', this.dragEventHandler);
        });
    }
    ngOnDestroy() {
        this.elementRef.nativeElement.removeEventListener('drag', this.dragEventHandler);
        if (this.isDragStarted) {
            endDrag();
        }
    }
    onDragStart(event) {
        if (!this.draggable) {
            return false;
        }
        // check if there is dnd handle and if the dnd handle was used to start the drag
        if (this.dndHandle != null && event._dndUsingHandle == null) {
            event.stopPropagation();
            return false;
        }
        // initialize global state
        startDrag(event, this.dndEffectAllowed, this.dndType);
        this.isDragStarted = true;
        setDragData(event, { data: this.dndDraggable, type: this.dndType }, dndState.effectAllowed);
        this.dragImage = this.determineDragImage();
        // set dragging css class prior to setDragImage so styles are applied before
        // TODO breaking change: add class to elementRef rather than drag image which could be another element
        this.renderer.addClass(this.dragImage, this.dndDraggingClass);
        // set custom dragimage if present
        // set dragimage if drag is started from dndHandle
        if (this.dndDragImageElementRef != null || event._dndUsingHandle != null) {
            setDragImage(event, this.dragImage, this.dndDragImageOffsetFunction);
        }
        // add dragging source css class on first drag event
        const unregister = this.renderer.listen(this.elementRef.nativeElement, 'drag', () => {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
            unregister();
        });
        this.dndStart.emit(event);
        event.stopPropagation();
        setTimeout(() => {
            this.renderer.setStyle(this.dragImage, 'pointer-events', 'none');
        }, 100);
        return true;
    }
    onDrag(event) {
        this.dndDrag.emit(event);
    }
    onDragEnd(event) {
        if (!this.draggable || !this.isDragStarted) {
            return;
        }
        // get drop effect from custom stored state as its not reliable across browsers
        const dropEffect = dndState.dropEffect;
        this.renderer.setStyle(this.dragImage, 'pointer-events', 'unset');
        let dropEffectEmitter;
        switch (dropEffect) {
            case 'copy':
                dropEffectEmitter = this.dndCopied;
                break;
            case 'link':
                dropEffectEmitter = this.dndLinked;
                break;
            case 'move':
                dropEffectEmitter = this.dndMoved;
                break;
            default:
                dropEffectEmitter = this.dndCanceled;
                break;
        }
        dropEffectEmitter.emit(event);
        this.dndEnd.emit(event);
        // reset global state
        endDrag();
        this.isDragStarted = false;
        this.renderer.removeClass(this.dragImage, this.dndDraggingClass);
        // IE9 special hammering
        window.setTimeout(() => {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
        }, 0);
        event.stopPropagation();
    }
    registerDragHandle(handle) {
        this.dndHandle = handle;
    }
    registerDragImage(elementRef) {
        this.dndDragImageElementRef = elementRef;
    }
    determineDragImage() {
        // evaluate custom drag image existence
        if (typeof this.dndDragImageElementRef !== 'undefined') {
            return this.dndDragImageElementRef.nativeElement;
        }
        else {
            return this.elementRef.nativeElement;
        }
    }
}
DndDraggableDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDraggableDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
DndDraggableDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.2.6", type: DndDraggableDirective, selector: "[dndDraggable]", inputs: { dndDraggable: "dndDraggable", dndEffectAllowed: "dndEffectAllowed", dndType: "dndType", dndDraggingClass: "dndDraggingClass", dndDraggingSourceClass: "dndDraggingSourceClass", dndDraggableDisabledClass: "dndDraggableDisabledClass", dndDragImageOffsetFunction: "dndDragImageOffsetFunction", dndDisableIf: "dndDisableIf", dndDisableDragIf: "dndDisableDragIf" }, outputs: { dndStart: "dndStart", dndDrag: "dndDrag", dndEnd: "dndEnd", dndMoved: "dndMoved", dndCopied: "dndCopied", dndLinked: "dndLinked", dndCanceled: "dndCanceled" }, host: { listeners: { "dragstart": "onDragStart($event)", "dragend": "onDragEnd($event)" }, properties: { "attr.draggable": "this.draggable" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDraggableDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDraggable]' }]
        }], propDecorators: { dndDraggable: [{
                type: Input
            }], dndEffectAllowed: [{
                type: Input
            }], dndType: [{
                type: Input
            }], dndDraggingClass: [{
                type: Input
            }], dndDraggingSourceClass: [{
                type: Input
            }], dndDraggableDisabledClass: [{
                type: Input
            }], dndDragImageOffsetFunction: [{
                type: Input
            }], dndStart: [{
                type: Output
            }], dndDrag: [{
                type: Output
            }], dndEnd: [{
                type: Output
            }], dndMoved: [{
                type: Output
            }], dndCopied: [{
                type: Output
            }], dndLinked: [{
                type: Output
            }], dndCanceled: [{
                type: Output
            }], draggable: [{
                type: HostBinding,
                args: ['attr.draggable']
            }], dndDisableIf: [{
                type: Input
            }], dndDisableDragIf: [{
                type: Input
            }], onDragStart: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }], onDragEnd: [{
                type: HostListener,
                args: ['dragend', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLWRyYWdnYWJsZS5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kbmQvc3JjL2xpYi9kbmQtZHJhZ2dhYmxlLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLFdBQVcsRUFDWCxZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sTUFBTSxFQUNOLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFM0QsT0FBTyxFQUNMLHdCQUF3QixFQUd4QixXQUFXLEVBQ1gsWUFBWSxHQUNiLE1BQU0sYUFBYSxDQUFDOztBQUdyQixNQUFNLE9BQU8sd0JBQXdCO0lBRHJDO1FBRUUsMEJBQXFCLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDeEUsZUFBVSxHQUE0QixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7S0FLMUQ7SUFIQyxRQUFRO1FBQ04sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNoRSxDQUFDOztxSEFOVSx3QkFBd0I7eUdBQXhCLHdCQUF3QjsyRkFBeEIsd0JBQXdCO2tCQURwQyxTQUFTO21CQUFDLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFOztBQVc1QyxNQUFNLE9BQU8scUJBQXFCO0lBRGxDO1FBR1cscUJBQWdCLEdBQWtCLE1BQU0sQ0FBQztRQUV6QyxxQkFBZ0IsR0FBRyxhQUFhLENBQUM7UUFDakMsMkJBQXNCLEdBQUcsbUJBQW1CLENBQUM7UUFDN0MsOEJBQXlCLEdBQUcsc0JBQXNCLENBQUM7UUFD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c0JBQWpELFlBQVk7dUJBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQThEQSxTQUFTO3NCQUE3QyxZQUFZO3VCQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBmb3J3YXJkUmVmLFxuICBIb3N0QmluZGluZyxcbiAgSG9zdExpc3RlbmVyLFxuICBpbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFJlbmRlcmVyMixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEbmRIYW5kbGVEaXJlY3RpdmUgfSBmcm9tICcuL2RuZC1oYW5kbGUuZGlyZWN0aXZlJztcbmltcG9ydCB7IGRuZFN0YXRlLCBlbmREcmFnLCBzdGFydERyYWcgfSBmcm9tICcuL2RuZC1zdGF0ZSc7XG5pbXBvcnQgeyBFZmZlY3RBbGxvd2VkIH0gZnJvbSAnLi9kbmQtdHlwZXMnO1xuaW1wb3J0IHtcbiAgY2FsY3VsYXRlRHJhZ0ltYWdlT2Zmc2V0LFxuICBEbmREcmFnSW1hZ2VPZmZzZXRGdW5jdGlvbixcbiAgRG5kRXZlbnQsXG4gIHNldERyYWdEYXRhLFxuICBzZXREcmFnSW1hZ2UsXG59IGZyb20gJy4vZG5kLXV0aWxzJztcblxuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW2RuZERyYWdJbWFnZVJlZl0nIH0pXG5leHBvcnQgY2xhc3MgRG5kRHJhZ0ltYWdlUmVmRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0IHtcbiAgZG5kRHJhZ2dhYmxlRGlyZWN0aXZlID0gaW5qZWN0KGZvcndhcmRSZWYoKCkgPT4gRG5kRHJhZ2dhYmxlRGlyZWN0aXZlKSk7XG4gIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+ID0gaW5qZWN0KEVsZW1lbnRSZWYpO1xuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuZG5kRHJhZ2dhYmxlRGlyZWN0aXZlLnJlZ2lzdGVyRHJhZ0ltYWdlKHRoaXMuZWxlbWVudFJlZik7XG4gIH1cbn1cblxuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW2RuZERyYWdnYWJsZV0nIH0pXG5leHBvcnQgY2xhc3MgRG5kRHJhZ2dhYmxlRGlyZWN0aXZlIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgQElucHV0KCkgZG5kRHJhZ2dhYmxlOiBhbnk7XG4gIEBJbnB1dCgpIGRuZEVmZmVjdEFsbG93ZWQ6IEVmZmVjdEFsbG93ZWQgPSAnY29weSc7XG4gIEBJbnB1dCgpIGRuZFR5cGU/OiBzdHJpbmc7XG4gIEBJbnB1dCgpIGRuZERyYWdnaW5nQ2xhc3MgPSAnZG5kRHJhZ2dpbmcnO1xuICBASW5wdXQoKSBkbmREcmFnZ2luZ1NvdXJjZUNsYXNzID0gJ2RuZERyYWdnaW5nU291cmNlJztcbiAgQElucHV0KCkgZG5kRHJhZ2dhYmxlRGlzYWJsZWRDbGFzcyA9ICdkbmREcmFnZ2FibGVEaXNhYmxlZCc7XG4gIEBJbnB1dCgpIGRuZERyYWdJbWFnZU9mZnNldEZ1bmN0aW9uOiBEbmREcmFnSW1hZ2VPZmZzZXRGdW5jdGlvbiA9XG4gICAgY2FsY3VsYXRlRHJhZ0ltYWdlT2Zmc2V0O1xuXG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmRTdGFydDogRXZlbnRFbWl0dGVyPERyYWdFdmVudD4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PigpO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgZG5kRHJhZzogRXZlbnRFbWl0dGVyPERyYWdFdmVudD4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PigpO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgZG5kRW5kOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmRNb3ZlZDogRXZlbnRFbWl0dGVyPERyYWdFdmVudD4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PigpO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgZG5kQ29waWVkOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmRMaW5rZWQ6IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERyYWdFdmVudD4oKTtcbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZENhbmNlbGVkOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG5cbiAgQEhvc3RCaW5kaW5nKCdhdHRyLmRyYWdnYWJsZScpIGRyYWdnYWJsZSA9IHRydWU7XG5cbiAgcHJpdmF0ZSBkbmRIYW5kbGU/OiBEbmRIYW5kbGVEaXJlY3RpdmU7XG4gIHByaXZhdGUgZG5kRHJhZ0ltYWdlRWxlbWVudFJlZj86IEVsZW1lbnRSZWY7XG4gIHByaXZhdGUgZHJhZ0ltYWdlOiBFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGlzRHJhZ1N0YXJ0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+ID0gaW5qZWN0KEVsZW1lbnRSZWYpO1xuICBwcml2YXRlIHJlbmRlcmVyID0gaW5qZWN0KFJlbmRlcmVyMik7XG4gIHByaXZhdGUgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG5cbiAgQElucHV0KCkgc2V0IGRuZERpc2FibGVJZih2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuZHJhZ2dhYmxlID0gIXZhbHVlO1xuXG4gICAgaWYgKHRoaXMuZHJhZ2dhYmxlKSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5kbmREcmFnZ2FibGVEaXNhYmxlZENsYXNzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5kbmREcmFnZ2FibGVEaXNhYmxlZENsYXNzXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIEBJbnB1dCgpIHNldCBkbmREaXNhYmxlRHJhZ0lmKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kbmREaXNhYmxlSWYgPSB2YWx1ZTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAnZHJhZycsXG4gICAgICAgIHRoaXMuZHJhZ0V2ZW50SGFuZGxlclxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAnZHJhZycsXG4gICAgICB0aGlzLmRyYWdFdmVudEhhbmRsZXJcbiAgICApO1xuICAgIGlmICh0aGlzLmlzRHJhZ1N0YXJ0ZWQpIHtcbiAgICAgIGVuZERyYWcoKTtcbiAgICB9XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdkcmFnc3RhcnQnLCBbJyRldmVudCddKSBvbkRyYWdTdGFydChldmVudDogRG5kRXZlbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuZHJhZ2dhYmxlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgZG5kIGhhbmRsZSBhbmQgaWYgdGhlIGRuZCBoYW5kbGUgd2FzIHVzZWQgdG8gc3RhcnQgdGhlIGRyYWdcbiAgICBpZiAodGhpcy5kbmRIYW5kbGUgIT0gbnVsbCAmJiBldmVudC5fZG5kVXNpbmdIYW5kbGUgPT0gbnVsbCkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSBnbG9iYWwgc3RhdGVcbiAgICBzdGFydERyYWcoZXZlbnQsIHRoaXMuZG5kRWZmZWN0QWxsb3dlZCwgdGhpcy5kbmRUeXBlKTtcblxuICAgIHRoaXMuaXNEcmFnU3RhcnRlZCA9IHRydWU7XG5cbiAgICBzZXREcmFnRGF0YShcbiAgICAgIGV2ZW50LFxuICAgICAgeyBkYXRhOiB0aGlzLmRuZERyYWdnYWJsZSwgdHlwZTogdGhpcy5kbmRUeXBlIH0sXG4gICAgICBkbmRTdGF0ZS5lZmZlY3RBbGxvd2VkIVxuICAgICk7XG5cbiAgICB0aGlzLmRyYWdJbWFnZSA9IHRoaXMuZGV0ZXJtaW5lRHJhZ0ltYWdlKCk7XG5cbiAgICAvLyBzZXQgZHJhZ2dpbmcgY3NzIGNsYXNzIHByaW9yIHRvIHNldERyYWdJbWFnZSBzbyBzdHlsZXMgYXJlIGFwcGxpZWQgYmVmb3JlXG4gICAgLy8gVE9ETyBicmVha2luZyBjaGFuZ2U6IGFkZCBjbGFzcyB0byBlbGVtZW50UmVmIHJhdGhlciB0aGFuIGRyYWcgaW1hZ2Ugd2hpY2ggY291bGQgYmUgYW5vdGhlciBlbGVtZW50XG4gICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmRyYWdJbWFnZSwgdGhpcy5kbmREcmFnZ2luZ0NsYXNzKTtcblxuICAgIC8vIHNldCBjdXN0b20gZHJhZ2ltYWdlIGlmIHByZXNlbnRcbiAgICAvLyBzZXQgZHJhZ2ltYWdlIGlmIGRyYWcgaXMgc3RhcnRlZCBmcm9tIGRuZEhhbmRsZVxuICAgIGlmICh0aGlzLmRuZERyYWdJbWFnZUVsZW1lbnRSZWYgIT0gbnVsbCB8fCBldmVudC5fZG5kVXNpbmdIYW5kbGUgIT0gbnVsbCkge1xuICAgICAgc2V0RHJhZ0ltYWdlKGV2ZW50LCB0aGlzLmRyYWdJbWFnZSwgdGhpcy5kbmREcmFnSW1hZ2VPZmZzZXRGdW5jdGlvbik7XG4gICAgfVxuXG4gICAgLy8gYWRkIGRyYWdnaW5nIHNvdXJjZSBjc3MgY2xhc3Mgb24gZmlyc3QgZHJhZyBldmVudFxuICAgIGNvbnN0IHVucmVnaXN0ZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgJ2RyYWcnLFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAgIHRoaXMuZG5kRHJhZ2dpbmdTb3VyY2VDbGFzc1xuICAgICAgICApO1xuICAgICAgICB1bnJlZ2lzdGVyKCk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuZG5kU3RhcnQuZW1pdChldmVudCk7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmRyYWdJbWFnZSwgJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKTtcbiAgICB9LCAxMDApO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbkRyYWcoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgIHRoaXMuZG5kRHJhZy5lbWl0KGV2ZW50KTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdlbmQnLCBbJyRldmVudCddKSBvbkRyYWdFbmQoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgIGlmICghdGhpcy5kcmFnZ2FibGUgfHwgIXRoaXMuaXNEcmFnU3RhcnRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBnZXQgZHJvcCBlZmZlY3QgZnJvbSBjdXN0b20gc3RvcmVkIHN0YXRlIGFzIGl0cyBub3QgcmVsaWFibGUgYWNyb3NzIGJyb3dzZXJzXG4gICAgY29uc3QgZHJvcEVmZmVjdCA9IGRuZFN0YXRlLmRyb3BFZmZlY3Q7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZHJhZ0ltYWdlLCAncG9pbnRlci1ldmVudHMnLCAndW5zZXQnKTtcblxuICAgIGxldCBkcm9wRWZmZWN0RW1pdHRlcjogRXZlbnRFbWl0dGVyPERyYWdFdmVudD47XG5cbiAgICBzd2l0Y2ggKGRyb3BFZmZlY3QpIHtcbiAgICAgIGNhc2UgJ2NvcHknOlxuICAgICAgICBkcm9wRWZmZWN0RW1pdHRlciA9IHRoaXMuZG5kQ29waWVkO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbGluayc6XG4gICAgICAgIGRyb3BFZmZlY3RFbWl0dGVyID0gdGhpcy5kbmRMaW5rZWQ7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdtb3ZlJzpcbiAgICAgICAgZHJvcEVmZmVjdEVtaXR0ZXIgPSB0aGlzLmRuZE1vdmVkO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZHJvcEVmZmVjdEVtaXR0ZXIgPSB0aGlzLmRuZENhbmNlbGVkO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBkcm9wRWZmZWN0RW1pdHRlci5lbWl0KGV2ZW50KTtcbiAgICB0aGlzLmRuZEVuZC5lbWl0KGV2ZW50KTtcblxuICAgIC8vIHJlc2V0IGdsb2JhbCBzdGF0ZVxuICAgIGVuZERyYWcoKTtcblxuICAgIHRoaXMuaXNEcmFnU3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyh0aGlzLmRyYWdJbWFnZSwgdGhpcy5kbmREcmFnZ2luZ0NsYXNzKTtcblxuICAgIC8vIElFOSBzcGVjaWFsIGhhbW1lcmluZ1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3MoXG4gICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICB0aGlzLmRuZERyYWdnaW5nU291cmNlQ2xhc3NcbiAgICAgICk7XG4gICAgfSwgMCk7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHJlZ2lzdGVyRHJhZ0hhbmRsZShoYW5kbGU6IERuZEhhbmRsZURpcmVjdGl2ZSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuZG5kSGFuZGxlID0gaGFuZGxlO1xuICB9XG5cbiAgcmVnaXN0ZXJEcmFnSW1hZ2UoZWxlbWVudFJlZjogRWxlbWVudFJlZiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuZG5kRHJhZ0ltYWdlRWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICBwcml2YXRlIHJlYWRvbmx5IGRyYWdFdmVudEhhbmRsZXI6IChldmVudDogRHJhZ0V2ZW50KSA9PiB2b2lkID0gKFxuICAgIGV2ZW50OiBEcmFnRXZlbnRcbiAgKSA9PiB0aGlzLm9uRHJhZyhldmVudCk7XG5cbiAgcHJpdmF0ZSBkZXRlcm1pbmVEcmFnSW1hZ2UoKTogRWxlbWVudCB7XG4gICAgLy8gZXZhbHVhdGUgY3VzdG9tIGRyYWcgaW1hZ2UgZXhpc3RlbmNlXG4gICAgaWYgKHR5cGVvZiB0aGlzLmRuZERyYWdJbWFnZUVsZW1lbnRSZWYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdGhpcy5kbmREcmFnSW1hZ2VFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIH1cbiAgfVxufVxuIl19