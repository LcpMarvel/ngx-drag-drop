import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { DndHandleDirective } from './dnd-handle.directive';
import { EffectAllowed } from './dnd-types';
import { DndDragImageOffsetFunction, DndEvent } from './dnd-utils';
import * as i0 from "@angular/core";
export declare class DndDragImageRefDirective implements OnInit {
    dndDraggableDirective: any;
    elementRef: ElementRef<HTMLElement>;
    ngOnInit(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DndDragImageRefDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<DndDragImageRefDirective, "[dndDragImageRef]", never, {}, {}, never, never, false, never>;
}
export declare class DndDraggableDirective implements AfterViewInit, OnDestroy {
    dndDraggable: any;
    dndEffectAllowed: EffectAllowed;
    dndType?: string;
    dndDraggingClass: string;
    dndDraggingSourceClass: string;
    dndDraggableDisabledClass: string;
    dndDragImageOffsetFunction: DndDragImageOffsetFunction;
    readonly dndStart: EventEmitter<DragEvent>;
    readonly dndDrag: EventEmitter<DragEvent>;
    readonly dndEnd: EventEmitter<DragEvent>;
    readonly dndMoved: EventEmitter<DragEvent>;
    readonly dndCopied: EventEmitter<DragEvent>;
    readonly dndLinked: EventEmitter<DragEvent>;
    readonly dndCanceled: EventEmitter<DragEvent>;
    draggable: boolean;
    private dndHandle?;
    private dndDragImageElementRef?;
    private dragImage;
    private isDragStarted;
    private elementRef;
    private renderer;
    private ngZone;
    set dndDisableIf(value: boolean);
    set dndDisableDragIf(value: boolean);
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    onDragStart(event: DndEvent): boolean;
    onDrag(event: DragEvent): void;
    onDragEnd(event: DragEvent): void;
    registerDragHandle(handle: DndHandleDirective | undefined): void;
    registerDragImage(elementRef: ElementRef | undefined): void;
    private readonly dragEventHandler;
    private determineDragImage;
    static ɵfac: i0.ɵɵFactoryDeclaration<DndDraggableDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<DndDraggableDirective, "[dndDraggable]", never, { "dndDraggable": "dndDraggable"; "dndEffectAllowed": "dndEffectAllowed"; "dndType": "dndType"; "dndDraggingClass": "dndDraggingClass"; "dndDraggingSourceClass": "dndDraggingSourceClass"; "dndDraggableDisabledClass": "dndDraggableDisabledClass"; "dndDragImageOffsetFunction": "dndDragImageOffsetFunction"; "dndDisableIf": "dndDisableIf"; "dndDisableDragIf": "dndDisableDragIf"; }, { "dndStart": "dndStart"; "dndDrag": "dndDrag"; "dndEnd": "dndEnd"; "dndMoved": "dndMoved"; "dndCopied": "dndCopied"; "dndLinked": "dndLinked"; "dndCanceled": "dndCanceled"; }, never, never, false, never>;
}