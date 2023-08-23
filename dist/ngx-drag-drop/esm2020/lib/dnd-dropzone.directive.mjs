import { ContentChild, Directive, EventEmitter, HostListener, Input, Output, } from '@angular/core';
import { getDndType, getDropEffect, isExternalDrag, setDropEffect, } from './dnd-state';
import { getDirectChildElement, getDropData, shouldPositionPlaceholderBeforeElement, } from './dnd-utils';
import * as i0 from "@angular/core";
export class DndPlaceholderRefDirective {
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    ngOnInit() {
        // placeholder has to be "invisible" to the cursor, or it would interfere with the dragover detection for the same dropzone
        this.elementRef.nativeElement.style.pointerEvents = 'none';
    }
}
DndPlaceholderRefDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndPlaceholderRefDirective, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
DndPlaceholderRefDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.2.6", type: DndPlaceholderRefDirective, selector: "[dndPlaceholderRef]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndPlaceholderRefDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndPlaceholderRef]' }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; } });
export class DndDropzoneDirective {
    constructor(ngZone, elementRef, renderer) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        this.renderer = renderer;
        this.dndDropzone = '';
        this.dndEffectAllowed = 'uninitialized';
        this.dndAllowExternal = false;
        this.dndHorizontal = false;
        this.dndDragoverClass = 'dndDragover';
        this.dndDropzoneDisabledClass = 'dndDropzoneDisabled';
        this.dndDragover = new EventEmitter();
        this.dndDrop = new EventEmitter();
        this.placeholder = null;
        this.disabled = false;
        this.dragEnterEventHandler = (event) => this.onDragEnter(event);
        this.dragOverEventHandler = (event) => this.onDragOver(event);
        this.dragLeaveEventHandler = (event) => this.onDragLeave(event);
    }
    set dndDisableIf(value) {
        this.disabled = value;
        if (this.disabled) {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
        }
        else {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
        }
    }
    set dndDisableDropIf(value) {
        this.dndDisableIf = value;
    }
    ngAfterViewInit() {
        this.placeholder = this.tryGetPlaceholder();
        this.removePlaceholderFromDOM();
        this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.addEventListener('dragenter', this.dragEnterEventHandler);
            this.elementRef.nativeElement.addEventListener('dragover', this.dragOverEventHandler);
            this.elementRef.nativeElement.addEventListener('dragleave', this.dragLeaveEventHandler);
        });
    }
    ngOnDestroy() {
        this.elementRef.nativeElement.removeEventListener('dragenter', this.dragEnterEventHandler);
        this.elementRef.nativeElement.removeEventListener('dragover', this.dragOverEventHandler);
        this.elementRef.nativeElement.removeEventListener('dragleave', this.dragLeaveEventHandler);
    }
    onDragEnter(event) {
        // check if another dropzone is activated
        if (event._dndDropzoneActive === true) {
            this.cleanupDragoverState();
            return;
        }
        // set as active if the target element is inside this dropzone
        if (event._dndDropzoneActive == null) {
            const newTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (this.elementRef.nativeElement.contains(newTarget)) {
                event._dndDropzoneActive = true;
            }
        }
        // check if this drag event is allowed to drop on this dropzone
        const type = getDndType(event);
        if (!this.isDropAllowed(type)) {
            return;
        }
        // allow the dragenter
        event.preventDefault();
    }
    onDragOver(event) {
        // With nested dropzones, we want to ignore this event if a child dropzone
        // has already handled a dragover.  Historically, event.stopPropagation() was
        // used to prevent this bubbling, but that prevents any dragovers outside the
        // ngx-drag-drop component, and stops other use cases such as scrolling on drag.
        // Instead, we can check if the event was already prevented by a child and bail early.
        if (event.defaultPrevented) {
            return;
        }
        // check if this drag event is allowed to drop on this dropzone
        const type = getDndType(event);
        if (!this.isDropAllowed(type)) {
            return;
        }
        this.checkAndUpdatePlaceholderPosition(event);
        const dropEffect = getDropEffect(event, this.dndEffectAllowed);
        if (dropEffect === 'none') {
            this.cleanupDragoverState();
            return;
        }
        // allow the dragover
        event.preventDefault();
        // set the drop effect
        setDropEffect(event, dropEffect);
        this.dndDragover.emit(event);
        this.renderer.addClass(this.elementRef.nativeElement, this.dndDragoverClass);
    }
    onDrop(event) {
        try {
            // check if this drag event is allowed to drop on this dropzone
            const type = getDndType(event);
            if (!this.isDropAllowed(type)) {
                return;
            }
            const data = getDropData(event, isExternalDrag());
            if (!this.isDropAllowed(data.type)) {
                return;
            }
            // signal custom drop handling
            event.preventDefault();
            const dropEffect = getDropEffect(event);
            setDropEffect(event, dropEffect);
            if (dropEffect === 'none') {
                return;
            }
            const dropIndex = this.getPlaceholderIndex();
            // if for whatever reason the placeholder is not present in the DOM but it should be there
            // we don't allow/emit the drop event since it breaks the contract
            // seems to only happen if drag and drop is executed faster than the DOM updates
            if (dropIndex === -1) {
                return;
            }
            this.dndDrop.emit({
                event: event,
                dropEffect: dropEffect,
                isExternal: isExternalDrag(),
                data: data.data,
                index: dropIndex,
                type: type,
            });
            event.stopPropagation();
        }
        finally {
            this.cleanupDragoverState();
        }
    }
    onDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        // check if still inside this dropzone and not yet handled by another dropzone
        if (event._dndDropzoneActive == null) {
            const newTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (this.elementRef.nativeElement.contains(newTarget)) {
                event._dndDropzoneActive = true;
                return;
            }
        }
        this.cleanupDragoverState();
        // cleanup drop effect when leaving dropzone
        setDropEffect(event, 'none');
    }
    isDropAllowed(type) {
        // dropzone is disabled -> deny it
        if (this.disabled) {
            return false;
        }
        // if drag did not start from our directive
        // and external drag sources are not allowed -> deny it
        if (isExternalDrag() && !this.dndAllowExternal) {
            return false;
        }
        // no filtering by types -> allow it
        if (!this.dndDropzone) {
            return true;
        }
        // no type set -> allow it
        if (!type) {
            return true;
        }
        if (!Array.isArray(this.dndDropzone)) {
            throw new Error('dndDropzone: bound value to [dndDropzone] must be an array!');
        }
        // if dropzone contains type -> allow it
        return this.dndDropzone.indexOf(type) !== -1;
    }
    tryGetPlaceholder() {
        if (typeof this.dndPlaceholderRef !== 'undefined') {
            return this.dndPlaceholderRef.elementRef.nativeElement;
        }
        // TODO nasty workaround needed because if ng-container / template is used @ContentChild() or DI will fail because
        // of wrong context see angular bug https://github.com/angular/angular/issues/13517
        return this.elementRef.nativeElement.querySelector('[dndPlaceholderRef]');
    }
    removePlaceholderFromDOM() {
        if (this.placeholder !== null && this.placeholder.parentNode !== null) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
    }
    checkAndUpdatePlaceholderPosition(event) {
        if (this.placeholder === null) {
            return;
        }
        // make sure the placeholder is in the DOM
        if (this.placeholder.parentNode !== this.elementRef.nativeElement) {
            this.renderer.appendChild(this.elementRef.nativeElement, this.placeholder);
        }
        // update the position if the event originates from a child element of the dropzone
        const directChild = getDirectChildElement(this.elementRef.nativeElement, event.target);
        // early exit if no direct child or direct child is placeholder
        if (directChild === null || directChild === this.placeholder) {
            return;
        }
        const positionPlaceholderBeforeDirectChild = shouldPositionPlaceholderBeforeElement(event, directChild, this.dndHorizontal);
        if (positionPlaceholderBeforeDirectChild) {
            // do insert before only if necessary
            if (directChild.previousSibling !== this.placeholder) {
                this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild);
            }
        }
        else {
            // do insert after only if necessary
            if (directChild.nextSibling !== this.placeholder) {
                this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild.nextSibling);
            }
        }
    }
    getPlaceholderIndex() {
        if (this.placeholder === null) {
            return undefined;
        }
        const element = this.elementRef.nativeElement;
        return Array.prototype.indexOf.call(element.children, this.placeholder);
    }
    cleanupDragoverState() {
        this.renderer.removeClass(this.elementRef.nativeElement, this.dndDragoverClass);
        this.removePlaceholderFromDOM();
    }
}
DndDropzoneDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDropzoneDirective, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive });
DndDropzoneDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.2.6", type: DndDropzoneDirective, selector: "[dndDropzone]", inputs: { dndDropzone: "dndDropzone", dndEffectAllowed: "dndEffectAllowed", dndAllowExternal: "dndAllowExternal", dndHorizontal: "dndHorizontal", dndDragoverClass: "dndDragoverClass", dndDropzoneDisabledClass: "dndDropzoneDisabledClass", dndDisableIf: "dndDisableIf", dndDisableDropIf: "dndDisableDropIf" }, outputs: { dndDragover: "dndDragover", dndDrop: "dndDrop" }, host: { listeners: { "drop": "onDrop($event)" } }, queries: [{ propertyName: "dndPlaceholderRef", first: true, predicate: DndPlaceholderRefDirective, descendants: true }], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.6", ngImport: i0, type: DndDropzoneDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDropzone]' }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { dndDropzone: [{
                type: Input
            }], dndEffectAllowed: [{
                type: Input
            }], dndAllowExternal: [{
                type: Input
            }], dndHorizontal: [{
                type: Input
            }], dndDragoverClass: [{
                type: Input
            }], dndDropzoneDisabledClass: [{
                type: Input
            }], dndDragover: [{
                type: Output
            }], dndDrop: [{
                type: Output
            }], dndPlaceholderRef: [{
                type: ContentChild,
                args: [DndPlaceholderRefDirective]
            }], dndDisableIf: [{
                type: Input
            }], dndDisableDropIf: [{
                type: Input
            }], onDrop: [{
                type: HostListener,
                args: ['drop', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLWRyb3B6b25lLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RuZC9zcmMvbGliL2RuZC1kcm9wem9uZS5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFlBQVksRUFDWixTQUFTLEVBRVQsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBSUwsTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxVQUFVLEVBQ1YsYUFBYSxFQUNiLGNBQWMsRUFDZCxhQUFhLEdBQ2QsTUFBTSxhQUFhLENBQUM7QUFFckIsT0FBTyxFQUdMLHFCQUFxQixFQUNyQixXQUFXLEVBQ1gsc0NBQXNDLEdBQ3ZDLE1BQU0sYUFBYSxDQUFDOztBQVlyQixNQUFNLE9BQU8sMEJBQTBCO0lBQ3JDLFlBQTRCLFVBQW1DO1FBQW5DLGVBQVUsR0FBVixVQUFVLENBQXlCO0lBQUcsQ0FBQztJQUVuRSxRQUFRO1FBQ04sMkhBQTJIO1FBQzNILElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzdELENBQUM7O3VIQU5VLDBCQUEwQjsyR0FBMUIsMEJBQTBCOzJGQUExQiwwQkFBMEI7a0JBRHRDLFNBQVM7bUJBQUMsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUU7O0FBVzlDLE1BQU0sT0FBTyxvQkFBb0I7SUEwQi9CLFlBQ1UsTUFBYyxFQUNkLFVBQXNCLEVBQ3RCLFFBQW1CO1FBRm5CLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLGFBQVEsR0FBUixRQUFRLENBQVc7UUE1QnBCLGdCQUFXLEdBQW1CLEVBQUUsQ0FBQztRQUVqQyxxQkFBZ0IsR0FBa0IsZUFBZSxDQUFDO1FBRWxELHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQUVsQyxrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUUvQixxQkFBZ0IsR0FBVyxhQUFhLENBQUM7UUFFekMsNkJBQXdCLEdBQUcscUJBQXFCLENBQUM7UUFFdkMsZ0JBQVcsR0FDNUIsSUFBSSxZQUFZLEVBQWEsQ0FBQztRQUViLFlBQU8sR0FDeEIsSUFBSSxZQUFZLEVBQWdCLENBQUM7UUFLM0IsZ0JBQVcsR0FBbUIsSUFBSSxDQUFDO1FBRW5DLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFzTWpCLDBCQUFxQixHQUErQixDQUNuRSxLQUFnQixFQUNoQixFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVaLHlCQUFvQixHQUErQixDQUNsRSxLQUFnQixFQUNoQixFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVYLDBCQUFxQixHQUErQixDQUNuRSxLQUFnQixFQUNoQixFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQTFNMUIsQ0FBQztJQUVKLElBQWEsWUFBWSxDQUFDLEtBQWM7UUFDdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFFdEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFDN0IsSUFBSSxDQUFDLHdCQUF3QixDQUM5QixDQUFDO1NBQ0g7YUFBTTtZQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFDN0IsSUFBSSxDQUFDLHdCQUF3QixDQUM5QixDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBRUQsSUFBYSxnQkFBZ0IsQ0FBQyxLQUFjO1FBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFFRCxlQUFlO1FBQ2IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUU1QyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUVoQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FDNUMsV0FBVyxFQUNYLElBQUksQ0FBQyxxQkFBcUIsQ0FDM0IsQ0FBQztZQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUM1QyxVQUFVLEVBQ1YsSUFBSSxDQUFDLG9CQUFvQixDQUMxQixDQUFDO1lBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQzVDLFdBQVcsRUFDWCxJQUFJLENBQUMscUJBQXFCLENBQzNCLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQy9DLFdBQVcsRUFDWCxJQUFJLENBQUMscUJBQXFCLENBQzNCLENBQUM7UUFDRixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FDL0MsVUFBVSxFQUNWLElBQUksQ0FBQyxvQkFBb0IsQ0FDMUIsQ0FBQztRQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUMvQyxXQUFXLEVBQ1gsSUFBSSxDQUFDLHFCQUFxQixDQUMzQixDQUFDO0lBQ0osQ0FBQztJQUVELFdBQVcsQ0FBQyxLQUFlO1FBQ3pCLHlDQUF5QztRQUN6QyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7WUFDckMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsT0FBTztTQUNSO1FBRUQsOERBQThEO1FBQzlELElBQUksS0FBSyxDQUFDLGtCQUFrQixJQUFJLElBQUksRUFBRTtZQUNwQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFMUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3JELEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7YUFDakM7U0FDRjtRQUVELCtEQUErRDtRQUMvRCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0IsT0FBTztTQUNSO1FBRUQsc0JBQXNCO1FBQ3RCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWdCO1FBQ3pCLDBFQUEwRTtRQUMxRSw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLGdGQUFnRjtRQUNoRixzRkFBc0Y7UUFDdEYsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7WUFDMUIsT0FBTztTQUNSO1FBRUQsK0RBQStEO1FBQy9ELE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFOUMsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUUvRCxJQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7WUFDekIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsT0FBTztTQUNSO1FBRUQscUJBQXFCO1FBQ3JCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUV2QixzQkFBc0I7UUFDdEIsYUFBYSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU3QixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FDcEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQzdCLElBQUksQ0FBQyxnQkFBZ0IsQ0FDdEIsQ0FBQztJQUNKLENBQUM7SUFFaUMsTUFBTSxDQUFDLEtBQWdCO1FBQ3ZELElBQUk7WUFDRiwrREFBK0Q7WUFDL0QsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM3QixPQUFPO2FBQ1I7WUFFRCxNQUFNLElBQUksR0FBaUIsV0FBVyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBRWhFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbEMsT0FBTzthQUNSO1lBRUQsOEJBQThCO1lBQzlCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFeEMsYUFBYSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVqQyxJQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7Z0JBQ3pCLE9BQU87YUFDUjtZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRTdDLDBGQUEwRjtZQUMxRixrRUFBa0U7WUFDbEUsZ0ZBQWdGO1lBQ2hGLElBQUksU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNwQixPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDaEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFVBQVUsRUFBRSxjQUFjLEVBQUU7Z0JBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixLQUFLLEVBQUUsU0FBUztnQkFDaEIsSUFBSSxFQUFFLElBQUk7YUFDWCxDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7U0FDekI7Z0JBQVM7WUFDUixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUM3QjtJQUNILENBQUM7SUFFRCxXQUFXLENBQUMsS0FBZTtRQUN6QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdkIsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXhCLDhFQUE4RTtRQUM5RSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLEVBQUU7WUFDcEMsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFFLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNyRCxLQUFLLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dCQUNoQyxPQUFPO2FBQ1I7U0FDRjtRQUVELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBRTVCLDRDQUE0QztRQUM1QyxhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFjTyxhQUFhLENBQUMsSUFBYTtRQUNqQyxrQ0FBa0M7UUFDbEMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCwyQ0FBMkM7UUFDM0MsdURBQXVEO1FBQ3ZELElBQUksY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDOUMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELG9DQUFvQztRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDVCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2IsNkRBQTZELENBQzlELENBQUM7U0FDSDtRQUVELHdDQUF3QztRQUN4QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFTyxpQkFBaUI7UUFDdkIsSUFBSSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxXQUFXLEVBQUU7WUFDakQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLGFBQXdCLENBQUM7U0FDbkU7UUFFRCxrSEFBa0g7UUFDbEgsbUZBQW1GO1FBQ25GLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVPLHdCQUF3QjtRQUM5QixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxLQUFLLElBQUksRUFBRTtZQUNyRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzNEO0lBQ0gsQ0FBQztJQUVPLGlDQUFpQyxDQUFDLEtBQWdCO1FBQ3hELElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLEVBQUU7WUFDN0IsT0FBTztTQUNSO1FBRUQsMENBQTBDO1FBQzFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUU7WUFDakUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUM3QixJQUFJLENBQUMsV0FBVyxDQUNqQixDQUFDO1NBQ0g7UUFFRCxtRkFBbUY7UUFDbkYsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUM3QixLQUFLLENBQUMsTUFBaUIsQ0FDeEIsQ0FBQztRQUVGLCtEQUErRDtRQUMvRCxJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksV0FBVyxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDNUQsT0FBTztTQUNSO1FBRUQsTUFBTSxvQ0FBb0MsR0FDeEMsc0NBQXNDLENBQ3BDLEtBQUssRUFDTCxXQUFXLEVBQ1gsSUFBSSxDQUFDLGFBQWEsQ0FDbkIsQ0FBQztRQUVKLElBQUksb0NBQW9DLEVBQUU7WUFDeEMscUNBQXFDO1lBQ3JDLElBQUksV0FBVyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNwRCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FDeEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQzdCLElBQUksQ0FBQyxXQUFXLEVBQ2hCLFdBQVcsQ0FDWixDQUFDO2FBQ0g7U0FDRjthQUFNO1lBQ0wsb0NBQW9DO1lBQ3BDLElBQUksV0FBVyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNoRCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FDeEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQzdCLElBQUksQ0FBQyxXQUFXLEVBQ2hCLFdBQVcsQ0FBQyxXQUFXLENBQ3hCLENBQUM7YUFDSDtTQUNGO0lBQ0gsQ0FBQztJQUVPLG1CQUFtQjtRQUN6QixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssSUFBSSxFQUFFO1lBQzdCLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUE0QixDQUFDO1FBRTdELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFTyxvQkFBb0I7UUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUM3QixJQUFJLENBQUMsZ0JBQWdCLENBQ3RCLENBQUM7UUFFRixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztJQUNsQyxDQUFDOztpSEEvVlUsb0JBQW9CO3FHQUFwQixvQkFBb0Isd2dCQW1CakIsMEJBQTBCOzJGQW5CN0Isb0JBQW9CO2tCQURoQyxTQUFTO21CQUFDLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRTs4SUFFN0IsV0FBVztzQkFBbkIsS0FBSztnQkFFRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUVHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUVHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFYSxXQUFXO3NCQUE3QixNQUFNO2dCQUdZLE9BQU87c0JBQXpCLE1BQU07Z0JBSVUsaUJBQWlCO3NCQURqQyxZQUFZO3VCQUFDLDBCQUEwQjtnQkFhM0IsWUFBWTtzQkFBeEIsS0FBSztnQkFnQk8sZ0JBQWdCO3NCQUE1QixLQUFLO2dCQXlHNEIsTUFBTTtzQkFBdkMsWUFBWTt1QkFBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0TGlzdGVuZXIsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFJlbmRlcmVyMixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBnZXREbmRUeXBlLFxuICBnZXREcm9wRWZmZWN0LFxuICBpc0V4dGVybmFsRHJhZyxcbiAgc2V0RHJvcEVmZmVjdCxcbn0gZnJvbSAnLi9kbmQtc3RhdGUnO1xuaW1wb3J0IHsgRHJvcEVmZmVjdCwgRWZmZWN0QWxsb3dlZCB9IGZyb20gJy4vZG5kLXR5cGVzJztcbmltcG9ydCB7XG4gIERuZEV2ZW50LFxuICBEcmFnRHJvcERhdGEsXG4gIGdldERpcmVjdENoaWxkRWxlbWVudCxcbiAgZ2V0RHJvcERhdGEsXG4gIHNob3VsZFBvc2l0aW9uUGxhY2Vob2xkZXJCZWZvcmVFbGVtZW50LFxufSBmcm9tICcuL2RuZC11dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG5kRHJvcEV2ZW50IHtcbiAgZXZlbnQ6IERyYWdFdmVudDtcbiAgZHJvcEVmZmVjdDogRHJvcEVmZmVjdDtcbiAgaXNFeHRlcm5hbDogYm9vbGVhbjtcbiAgZGF0YT86IGFueTtcbiAgaW5kZXg/OiBudW1iZXI7XG4gIHR5cGU/OiBhbnk7XG59XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tkbmRQbGFjZWhvbGRlclJlZl0nIH0pXG5leHBvcnQgY2xhc3MgRG5kUGxhY2Vob2xkZXJSZWZEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgLy8gcGxhY2Vob2xkZXIgaGFzIHRvIGJlIFwiaW52aXNpYmxlXCIgdG8gdGhlIGN1cnNvciwgb3IgaXQgd291bGQgaW50ZXJmZXJlIHdpdGggdGhlIGRyYWdvdmVyIGRldGVjdGlvbiBmb3IgdGhlIHNhbWUgZHJvcHpvbmVcbiAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICB9XG59XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tkbmREcm9wem9uZV0nIH0pXG5leHBvcnQgY2xhc3MgRG5kRHJvcHpvbmVEaXJlY3RpdmUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICBASW5wdXQoKSBkbmREcm9wem9uZT86IHN0cmluZ1tdIHwgJycgPSAnJztcblxuICBASW5wdXQoKSBkbmRFZmZlY3RBbGxvd2VkOiBFZmZlY3RBbGxvd2VkID0gJ3VuaW5pdGlhbGl6ZWQnO1xuXG4gIEBJbnB1dCgpIGRuZEFsbG93RXh0ZXJuYWw6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBASW5wdXQoKSBkbmRIb3Jpem9udGFsOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgZG5kRHJhZ292ZXJDbGFzczogc3RyaW5nID0gJ2RuZERyYWdvdmVyJztcblxuICBASW5wdXQoKSBkbmREcm9wem9uZURpc2FibGVkQ2xhc3MgPSAnZG5kRHJvcHpvbmVEaXNhYmxlZCc7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZERyYWdvdmVyOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZERyb3A6IEV2ZW50RW1pdHRlcjxEbmREcm9wRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERuZERyb3BFdmVudD4oKTtcblxuICBAQ29udGVudENoaWxkKERuZFBsYWNlaG9sZGVyUmVmRGlyZWN0aXZlKVxuICBwcml2YXRlIHJlYWRvbmx5IGRuZFBsYWNlaG9sZGVyUmVmPzogRG5kUGxhY2Vob2xkZXJSZWZEaXJlY3RpdmU7XG5cbiAgcHJpdmF0ZSBwbGFjZWhvbGRlcjogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjJcbiAgKSB7fVxuXG4gIEBJbnB1dCgpIHNldCBkbmREaXNhYmxlSWYodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRpc2FibGVkID0gdmFsdWU7XG5cbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhcbiAgICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgIHRoaXMuZG5kRHJvcHpvbmVEaXNhYmxlZENsYXNzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5kbmREcm9wem9uZURpc2FibGVkQ2xhc3NcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgQElucHV0KCkgc2V0IGRuZERpc2FibGVEcm9wSWYodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRuZERpc2FibGVJZiA9IHZhbHVlO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIHRoaXMucGxhY2Vob2xkZXIgPSB0aGlzLnRyeUdldFBsYWNlaG9sZGVyKCk7XG5cbiAgICB0aGlzLnJlbW92ZVBsYWNlaG9sZGVyRnJvbURPTSgpO1xuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2RyYWdlbnRlcicsXG4gICAgICAgIHRoaXMuZHJhZ0VudGVyRXZlbnRIYW5kbGVyXG4gICAgICApO1xuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2RyYWdvdmVyJyxcbiAgICAgICAgdGhpcy5kcmFnT3ZlckV2ZW50SGFuZGxlclxuICAgICAgKTtcbiAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdkcmFnbGVhdmUnLFxuICAgICAgICB0aGlzLmRyYWdMZWF2ZUV2ZW50SGFuZGxlclxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAnZHJhZ2VudGVyJyxcbiAgICAgIHRoaXMuZHJhZ0VudGVyRXZlbnRIYW5kbGVyXG4gICAgKTtcbiAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgJ2RyYWdvdmVyJyxcbiAgICAgIHRoaXMuZHJhZ092ZXJFdmVudEhhbmRsZXJcbiAgICApO1xuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAnZHJhZ2xlYXZlJyxcbiAgICAgIHRoaXMuZHJhZ0xlYXZlRXZlbnRIYW5kbGVyXG4gICAgKTtcbiAgfVxuXG4gIG9uRHJhZ0VudGVyKGV2ZW50OiBEbmRFdmVudCkge1xuICAgIC8vIGNoZWNrIGlmIGFub3RoZXIgZHJvcHpvbmUgaXMgYWN0aXZhdGVkXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5jbGVhbnVwRHJhZ292ZXJTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHNldCBhcyBhY3RpdmUgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluc2lkZSB0aGlzIGRyb3B6b25lXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBuZXdUYXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuXG4gICAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMobmV3VGFyZ2V0KSkge1xuICAgICAgICBldmVudC5fZG5kRHJvcHpvbmVBY3RpdmUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNoZWNrIGlmIHRoaXMgZHJhZyBldmVudCBpcyBhbGxvd2VkIHRvIGRyb3Agb24gdGhpcyBkcm9wem9uZVxuICAgIGNvbnN0IHR5cGUgPSBnZXREbmRUeXBlKGV2ZW50KTtcbiAgICBpZiAoIXRoaXMuaXNEcm9wQWxsb3dlZCh0eXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFsbG93IHRoZSBkcmFnZW50ZXJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25EcmFnT3ZlcihldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgLy8gV2l0aCBuZXN0ZWQgZHJvcHpvbmVzLCB3ZSB3YW50IHRvIGlnbm9yZSB0aGlzIGV2ZW50IGlmIGEgY2hpbGQgZHJvcHpvbmVcbiAgICAvLyBoYXMgYWxyZWFkeSBoYW5kbGVkIGEgZHJhZ292ZXIuICBIaXN0b3JpY2FsbHksIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpIHdhc1xuICAgIC8vIHVzZWQgdG8gcHJldmVudCB0aGlzIGJ1YmJsaW5nLCBidXQgdGhhdCBwcmV2ZW50cyBhbnkgZHJhZ292ZXJzIG91dHNpZGUgdGhlXG4gICAgLy8gbmd4LWRyYWctZHJvcCBjb21wb25lbnQsIGFuZCBzdG9wcyBvdGhlciB1c2UgY2FzZXMgc3VjaCBhcyBzY3JvbGxpbmcgb24gZHJhZy5cbiAgICAvLyBJbnN0ZWFkLCB3ZSBjYW4gY2hlY2sgaWYgdGhlIGV2ZW50IHdhcyBhbHJlYWR5IHByZXZlbnRlZCBieSBhIGNoaWxkIGFuZCBiYWlsIGVhcmx5LlxuICAgIGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgdGhpcyBkcmFnIGV2ZW50IGlzIGFsbG93ZWQgdG8gZHJvcCBvbiB0aGlzIGRyb3B6b25lXG4gICAgY29uc3QgdHlwZSA9IGdldERuZFR5cGUoZXZlbnQpO1xuICAgIGlmICghdGhpcy5pc0Ryb3BBbGxvd2VkKHR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGVja0FuZFVwZGF0ZVBsYWNlaG9sZGVyUG9zaXRpb24oZXZlbnQpO1xuXG4gICAgY29uc3QgZHJvcEVmZmVjdCA9IGdldERyb3BFZmZlY3QoZXZlbnQsIHRoaXMuZG5kRWZmZWN0QWxsb3dlZCk7XG5cbiAgICBpZiAoZHJvcEVmZmVjdCA9PT0gJ25vbmUnKSB7XG4gICAgICB0aGlzLmNsZWFudXBEcmFnb3ZlclN0YXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYWxsb3cgdGhlIGRyYWdvdmVyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIC8vIHNldCB0aGUgZHJvcCBlZmZlY3RcbiAgICBzZXREcm9wRWZmZWN0KGV2ZW50LCBkcm9wRWZmZWN0KTtcblxuICAgIHRoaXMuZG5kRHJhZ292ZXIuZW1pdChldmVudCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICB0aGlzLmRuZERyYWdvdmVyQ2xhc3NcbiAgICApO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJvcCcsIFsnJGV2ZW50J10pIG9uRHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGNoZWNrIGlmIHRoaXMgZHJhZyBldmVudCBpcyBhbGxvd2VkIHRvIGRyb3Agb24gdGhpcyBkcm9wem9uZVxuICAgICAgY29uc3QgdHlwZSA9IGdldERuZFR5cGUoZXZlbnQpO1xuICAgICAgaWYgKCF0aGlzLmlzRHJvcEFsbG93ZWQodHlwZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhOiBEcmFnRHJvcERhdGEgPSBnZXREcm9wRGF0YShldmVudCwgaXNFeHRlcm5hbERyYWcoKSk7XG5cbiAgICAgIGlmICghdGhpcy5pc0Ryb3BBbGxvd2VkKGRhdGEudHlwZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBzaWduYWwgY3VzdG9tIGRyb3AgaGFuZGxpbmdcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IGRyb3BFZmZlY3QgPSBnZXREcm9wRWZmZWN0KGV2ZW50KTtcblxuICAgICAgc2V0RHJvcEVmZmVjdChldmVudCwgZHJvcEVmZmVjdCk7XG5cbiAgICAgIGlmIChkcm9wRWZmZWN0ID09PSAnbm9uZScpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkcm9wSW5kZXggPSB0aGlzLmdldFBsYWNlaG9sZGVySW5kZXgoKTtcblxuICAgICAgLy8gaWYgZm9yIHdoYXRldmVyIHJlYXNvbiB0aGUgcGxhY2Vob2xkZXIgaXMgbm90IHByZXNlbnQgaW4gdGhlIERPTSBidXQgaXQgc2hvdWxkIGJlIHRoZXJlXG4gICAgICAvLyB3ZSBkb24ndCBhbGxvdy9lbWl0IHRoZSBkcm9wIGV2ZW50IHNpbmNlIGl0IGJyZWFrcyB0aGUgY29udHJhY3RcbiAgICAgIC8vIHNlZW1zIHRvIG9ubHkgaGFwcGVuIGlmIGRyYWcgYW5kIGRyb3AgaXMgZXhlY3V0ZWQgZmFzdGVyIHRoYW4gdGhlIERPTSB1cGRhdGVzXG4gICAgICBpZiAoZHJvcEluZGV4ID09PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZG5kRHJvcC5lbWl0KHtcbiAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICBkcm9wRWZmZWN0OiBkcm9wRWZmZWN0LFxuICAgICAgICBpc0V4dGVybmFsOiBpc0V4dGVybmFsRHJhZygpLFxuICAgICAgICBkYXRhOiBkYXRhLmRhdGEsXG4gICAgICAgIGluZGV4OiBkcm9wSW5kZXgsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICB9KTtcblxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xlYW51cERyYWdvdmVyU3RhdGUoKTtcbiAgICB9XG4gIH1cblxuICBvbkRyYWdMZWF2ZShldmVudDogRG5kRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gY2hlY2sgaWYgc3RpbGwgaW5zaWRlIHRoaXMgZHJvcHpvbmUgYW5kIG5vdCB5ZXQgaGFuZGxlZCBieSBhbm90aGVyIGRyb3B6b25lXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBuZXdUYXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuXG4gICAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMobmV3VGFyZ2V0KSkge1xuICAgICAgICBldmVudC5fZG5kRHJvcHpvbmVBY3RpdmUgPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhbnVwRHJhZ292ZXJTdGF0ZSgpO1xuXG4gICAgLy8gY2xlYW51cCBkcm9wIGVmZmVjdCB3aGVuIGxlYXZpbmcgZHJvcHpvbmVcbiAgICBzZXREcm9wRWZmZWN0KGV2ZW50LCAnbm9uZScpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkb25seSBkcmFnRW50ZXJFdmVudEhhbmRsZXI6IChldmVudDogRHJhZ0V2ZW50KSA9PiB2b2lkID0gKFxuICAgIGV2ZW50OiBEcmFnRXZlbnRcbiAgKSA9PiB0aGlzLm9uRHJhZ0VudGVyKGV2ZW50KTtcblxuICBwcml2YXRlIHJlYWRvbmx5IGRyYWdPdmVyRXZlbnRIYW5kbGVyOiAoZXZlbnQ6IERyYWdFdmVudCkgPT4gdm9pZCA9IChcbiAgICBldmVudDogRHJhZ0V2ZW50XG4gICkgPT4gdGhpcy5vbkRyYWdPdmVyKGV2ZW50KTtcblxuICBwcml2YXRlIHJlYWRvbmx5IGRyYWdMZWF2ZUV2ZW50SGFuZGxlcjogKGV2ZW50OiBEcmFnRXZlbnQpID0+IHZvaWQgPSAoXG4gICAgZXZlbnQ6IERyYWdFdmVudFxuICApID0+IHRoaXMub25EcmFnTGVhdmUoZXZlbnQpO1xuXG4gIHByaXZhdGUgaXNEcm9wQWxsb3dlZCh0eXBlPzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgLy8gZHJvcHpvbmUgaXMgZGlzYWJsZWQgLT4gZGVueSBpdFxuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gaWYgZHJhZyBkaWQgbm90IHN0YXJ0IGZyb20gb3VyIGRpcmVjdGl2ZVxuICAgIC8vIGFuZCBleHRlcm5hbCBkcmFnIHNvdXJjZXMgYXJlIG5vdCBhbGxvd2VkIC0+IGRlbnkgaXRcbiAgICBpZiAoaXNFeHRlcm5hbERyYWcoKSAmJiAhdGhpcy5kbmRBbGxvd0V4dGVybmFsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gbm8gZmlsdGVyaW5nIGJ5IHR5cGVzIC0+IGFsbG93IGl0XG4gICAgaWYgKCF0aGlzLmRuZERyb3B6b25lKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBubyB0eXBlIHNldCAtPiBhbGxvdyBpdFxuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHRoaXMuZG5kRHJvcHpvbmUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdkbmREcm9wem9uZTogYm91bmQgdmFsdWUgdG8gW2RuZERyb3B6b25lXSBtdXN0IGJlIGFuIGFycmF5ISdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gaWYgZHJvcHpvbmUgY29udGFpbnMgdHlwZSAtPiBhbGxvdyBpdFxuICAgIHJldHVybiB0aGlzLmRuZERyb3B6b25lLmluZGV4T2YodHlwZSkgIT09IC0xO1xuICB9XG5cbiAgcHJpdmF0ZSB0cnlHZXRQbGFjZWhvbGRlcigpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmRuZFBsYWNlaG9sZGVyUmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRoaXMuZG5kUGxhY2Vob2xkZXJSZWYuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETyBuYXN0eSB3b3JrYXJvdW5kIG5lZWRlZCBiZWNhdXNlIGlmIG5nLWNvbnRhaW5lciAvIHRlbXBsYXRlIGlzIHVzZWQgQENvbnRlbnRDaGlsZCgpIG9yIERJIHdpbGwgZmFpbCBiZWNhdXNlXG4gICAgLy8gb2Ygd3JvbmcgY29udGV4dCBzZWUgYW5ndWxhciBidWcgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTM1MTdcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcignW2RuZFBsYWNlaG9sZGVyUmVmXScpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVQbGFjZWhvbGRlckZyb21ET00oKSB7XG4gICAgaWYgKHRoaXMucGxhY2Vob2xkZXIgIT09IG51bGwgJiYgdGhpcy5wbGFjZWhvbGRlci5wYXJlbnROb2RlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnBsYWNlaG9sZGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5wbGFjZWhvbGRlcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjaGVja0FuZFVwZGF0ZVBsYWNlaG9sZGVyUG9zaXRpb24oZXZlbnQ6IERyYWdFdmVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYWNlaG9sZGVyID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gbWFrZSBzdXJlIHRoZSBwbGFjZWhvbGRlciBpcyBpbiB0aGUgRE9NXG4gICAgaWYgKHRoaXMucGxhY2Vob2xkZXIucGFyZW50Tm9kZSAhPT0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYXBwZW5kQ2hpbGQoXG4gICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICB0aGlzLnBsYWNlaG9sZGVyXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSB0aGUgcG9zaXRpb24gaWYgdGhlIGV2ZW50IG9yaWdpbmF0ZXMgZnJvbSBhIGNoaWxkIGVsZW1lbnQgb2YgdGhlIGRyb3B6b25lXG4gICAgY29uc3QgZGlyZWN0Q2hpbGQgPSBnZXREaXJlY3RDaGlsZEVsZW1lbnQoXG4gICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgIGV2ZW50LnRhcmdldCBhcyBFbGVtZW50XG4gICAgKTtcblxuICAgIC8vIGVhcmx5IGV4aXQgaWYgbm8gZGlyZWN0IGNoaWxkIG9yIGRpcmVjdCBjaGlsZCBpcyBwbGFjZWhvbGRlclxuICAgIGlmIChkaXJlY3RDaGlsZCA9PT0gbnVsbCB8fCBkaXJlY3RDaGlsZCA9PT0gdGhpcy5wbGFjZWhvbGRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9uUGxhY2Vob2xkZXJCZWZvcmVEaXJlY3RDaGlsZCA9XG4gICAgICBzaG91bGRQb3NpdGlvblBsYWNlaG9sZGVyQmVmb3JlRWxlbWVudChcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGRpcmVjdENoaWxkLFxuICAgICAgICB0aGlzLmRuZEhvcml6b250YWxcbiAgICAgICk7XG5cbiAgICBpZiAocG9zaXRpb25QbGFjZWhvbGRlckJlZm9yZURpcmVjdENoaWxkKSB7XG4gICAgICAvLyBkbyBpbnNlcnQgYmVmb3JlIG9ubHkgaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAoZGlyZWN0Q2hpbGQucHJldmlvdXNTaWJsaW5nICE9PSB0aGlzLnBsYWNlaG9sZGVyKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIsXG4gICAgICAgICAgZGlyZWN0Q2hpbGRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZG8gaW5zZXJ0IGFmdGVyIG9ubHkgaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAoZGlyZWN0Q2hpbGQubmV4dFNpYmxpbmcgIT09IHRoaXMucGxhY2Vob2xkZXIpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgICAgdGhpcy5wbGFjZWhvbGRlcixcbiAgICAgICAgICBkaXJlY3RDaGlsZC5uZXh0U2libGluZ1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGxhY2Vob2xkZXJJbmRleCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLnBsYWNlaG9sZGVyID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcblxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGVsZW1lbnQuY2hpbGRyZW4sIHRoaXMucGxhY2Vob2xkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbnVwRHJhZ292ZXJTdGF0ZSgpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKFxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICB0aGlzLmRuZERyYWdvdmVyQ2xhc3NcbiAgICApO1xuXG4gICAgdGhpcy5yZW1vdmVQbGFjZWhvbGRlckZyb21ET00oKTtcbiAgfVxufVxuIl19